package com.russianmaster.app.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.russianmaster.app.entity.Question;
import com.russianmaster.app.entity.Test;
import com.russianmaster.app.enums.CEFRLevel;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class TestImportService {

    @Autowired
    private ContentService contentService;
    private final ObjectMapper objectMapper;

    public enum QuestionType {
        QUIZ_SINGLE, QUIZ_MULTI, READING, ARRANGE, REWRITE, ERROR_CHECK, LISTENING,
        INSTRUCTION, FILL_BLANK, AUDIO
    }

    // --- REGEX PATTERNS ---
    private static final Pattern META_TITLE_PATTERN = Pattern.compile("^#EXAM_TITLE:\\s*(.*)", Pattern.CASE_INSENSITIVE);
    private static final Pattern TYPE_TAG_PATTERN = Pattern.compile("\\[TYPE:\\s*(\\w+)]", Pattern.CASE_INSENSITIVE);
    private static final Pattern SRC_TAG_PATTERN = Pattern.compile("\\[SRC:\\s*(.*)]", Pattern.CASE_INSENSITIVE);

    private static final Pattern INSTRUCTION_PATTERN = Pattern.compile(
            "^\\s*(Bài|Phần|Part|Task|Exercise)\\s*\\d+.*|^\\s*(Mark the letter|Read the following|Choose the word|Read the passage|Hoàn thành|Điền vào).*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // [NEW] Regex bắt Level: [LEVEL: B1]
    private static final Pattern LEVEL_TAG_PATTERN = Pattern.compile("\\[LEVEL:\\s*(\\w+)]", Pattern.CASE_INSENSITIVE);

    // Hỗ trợ cả: {Q1}, 1., Câu 1:
    private static final Pattern QUESTION_START_PATTERN = Pattern.compile("^(\\{Q\\d+}|Câu \\d+[:.]|Question \\d+[:.]|\\d+[:.])\\s*(.*)", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    // Pattern tìm chỗ điền từ {...}
    private static final Pattern FILL_BLANK_CONTENT_PATTERN = Pattern.compile(".*\\{.+}.*", Pattern.DOTALL);

    private static final Pattern OPTION_PATTERN = Pattern.compile("^([A-D])[:.)]\\s*(.*)", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRUE_FLAG_PATTERN = Pattern.compile("\\|\\s*True$", Pattern.CASE_INSENSITIVE);
    private static final Pattern KEY_PATTERN = Pattern.compile("(?:^|\\s)(Key|Answer|Đáp án|Org|Words)[:.]\\s*(.*)", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final Pattern PASSAGE_START = Pattern.compile("^\\[PASSAGE]", Pattern.CASE_INSENSITIVE);
    private static final Pattern PASSAGE_END = Pattern.compile("^\\[/PASSAGE]", Pattern.CASE_INSENSITIVE);

    public Test importFromStream(MultipartFile file, String title, Integer duration) throws Exception {
        // 1. Extract text
        String text = contentService.extractTextFromFile(file);
        Map<String, String> metadata = new HashMap<>();

        // 2. Parse text thành List Map (Logic Regex)
        List<Map<String, Object>> rawQuestions = parseCustomFormat(text, metadata);

        if (rawQuestions.isEmpty()) {
            throw new RuntimeException("Không tìm thấy nội dung hợp lệ. Vui lòng kiểm tra format file.");
        }

        // 3. Khởi tạo Test Object
        Test test = new Test();
        test.setTitle(metadata.getOrDefault("title", title));
        test.setDuration(duration);
        test.setDescription("Imported from file: " + file.getOriginalFilename());

        // Vẫn lưu JSON để frontend cũ hoạt động (Backward Compatibility)
        test.setQuestionsData(objectMapper.writeValueAsString(rawQuestions));

        if (metadata.containsKey("audio")) {
            test.setAudioUrl(metadata.get("audio"));
        }

        // 4. [QUAN TRỌNG] Convert từ Raw Map sang Question Entity (Cho tính năng A1-C2)
        List<Question> questionEntities = new ArrayList<>();

        for (Map<String, Object> map : rawQuestions) {
            // Bỏ qua instruction nếu không muốn lưu vào bảng Question (hoặc lưu với type riêng)
            if ("INSTRUCTION".equals(map.get("type"))) continue;

            Question q = new Question();
            q.setTest(test); // Link với bài Test cha (Quan hệ 2 chiều)
            q.setContent((String) map.get("text"));
            q.setType((String) map.get("type"));

            // Map Level (Mặc định A1 nếu thiếu)
            String levelStr = (String) map.getOrDefault("level", "A1");
            try {
                CEFRLevel level = CEFRLevel.valueOf(levelStr.toUpperCase());
                q.setDifficultyLevel(level);
                q.setScoreWeight((double) level.getWeight());
            } catch (IllegalArgumentException e) {
                // Fallback nếu gõ sai level trong file
                q.setDifficultyLevel(CEFRLevel.A1);
                q.setScoreWeight(1.0);
            }

            // Lưu Options dưới dạng JSON
            if (map.containsKey("options")) {
                q.setOptionsJson(objectMapper.writeValueAsString(map.get("options")));
            }

            // Lưu Key/Correct Answer
            if (map.containsKey("correct")) {
                Object correctObj = map.get("correct");
                // Nếu là trắc nghiệm index (VD: 0, 1) -> Lưu string
                // Nếu là tự luận text -> Lưu string
                q.setCorrectKey(correctObj.toString());
            }

            // Lưu các field phụ (Media, Passage...) vào JSON mở rộng nếu cần
            // Ở đây giả sử Question entity có field extraData hoặc bạn map thẳng

            questionEntities.add(q);
        }

        // Gán list câu hỏi vào Test (Hibernate Cascade Type.ALL sẽ tự lưu Question)
        test.setQuestions(questionEntities);

        return test;
    }

    private List<Map<String, Object>> parseCustomFormat(String text, Map<String, String> metadata) {
        List<Map<String, Object>> questions = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");

        QuestionType currentType = QuestionType.QUIZ_SINGLE;
        Map<String, Object> currentQuestion = null;
        List<String> currentOptions = null;
        List<Integer> correctIndices = null;

        StringBuilder passageContent = new StringBuilder();
        boolean isPassageBlock = false;
        String currentMediaSrc = null;

        // [NEW] Biến theo dõi Level hiện tại
        String currentLevel = "A1";

        int idCounter = 1;

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            // 1. META DATA
            Matcher metaTitle = META_TITLE_PATTERN.matcher(line);
            if (metaTitle.find()) {
                metadata.put("title", metaTitle.group(1).trim());
                continue;
            }

            // 2. MEDIA SRC
            Matcher srcMatcher = SRC_TAG_PATTERN.matcher(line);
            if (srcMatcher.find()) {
                currentMediaSrc = srcMatcher.group(1).trim();
                line = line.replace(srcMatcher.group(0), "").trim();
            }

            // 3. [NEW] LEVEL TAG (Xử lý trước TYPE)
            Matcher levelMatcher = LEVEL_TAG_PATTERN.matcher(line);
            if (levelMatcher.find()) {
                currentLevel = levelMatcher.group(1).trim().toUpperCase(); // Cập nhật state level
                line = line.replace(levelMatcher.group(0), "").trim();
            }

            // 4. TYPE TAG
            Matcher typeMatcher = TYPE_TAG_PATTERN.matcher(line);
            if (typeMatcher.find()) {
                // Lưu câu trước đó
                saveCurrentQuestion(questions, currentQuestion, currentOptions, correctIndices, currentLevel);
                currentQuestion = null;

                try {
                    currentType = QuestionType.valueOf(typeMatcher.group(1).toUpperCase());
                } catch (Exception e) {
                    currentType = QuestionType.QUIZ_SINGLE;
                }

                passageContent.setLength(0);
                isPassageBlock = false;

                String remain = line.replace(typeMatcher.group(0), "").trim();
                if (!remain.isEmpty()) {
                    if (currentType == QuestionType.INSTRUCTION) {
                        Map<String, Object> instruction = new HashMap<>();
                        instruction.put("id", idCounter++);
                        instruction.put("type", "INSTRUCTION");
                        instruction.put("text", remain);
                        questions.add(instruction);
                    } else {
                        line = remain; // Process remaining text as content
                    }
                } else {
                    continue;
                }
            }

            // 5. PASSAGE BLOCK
            if (PASSAGE_START.matcher(line).find()) { isPassageBlock = true; continue; }
            if (PASSAGE_END.matcher(line).find()) { isPassageBlock = false; continue; }
            if (isPassageBlock) { passageContent.append(line).append("\n"); continue; }

            // 6. INSTRUCTION (Implicit)
            if (INSTRUCTION_PATTERN.matcher(line).find() && !QUESTION_START_PATTERN.matcher(line).find()) {
                saveCurrentQuestion(questions, currentQuestion, currentOptions, correctIndices, currentLevel);
                currentQuestion = null;

                Map<String, Object> instruction = new HashMap<>();
                instruction.put("id", idCounter++);
                instruction.put("type", "INSTRUCTION");
                instruction.put("text", line);
                questions.add(instruction);
                continue;
            }

            // 7. QUESTION START
            Matcher qMatcher = QUESTION_START_PATTERN.matcher(line);
            boolean isFillBlankLine = currentType == QuestionType.FILL_BLANK && FILL_BLANK_CONTENT_PATTERN.matcher(line).matches();

            if (qMatcher.find() || (isFillBlankLine && currentQuestion == null)) {
                saveCurrentQuestion(questions, currentQuestion, currentOptions, correctIndices, currentLevel);

                currentQuestion = new HashMap<>();
                currentQuestion.put("id", idCounter++);
                currentQuestion.put("type", currentType.name());

                // [NEW] Gán Level hiện tại cho câu hỏi mới
                currentQuestion.put("level", currentLevel);

                String qText = qMatcher.matches() ? qMatcher.group(2).trim() : line;
                currentQuestion.put("text", qText);

                if (passageContent.length() > 0) currentQuestion.put("passage", passageContent.toString().trim());
                if (currentMediaSrc != null) currentQuestion.put("mediaSrc", currentMediaSrc);

                currentOptions = new ArrayList<>();
                correctIndices = new ArrayList<>();

                if (!qMatcher.matches() && isFillBlankLine) continue;
            }

            // 8. OPTIONS & KEYS
            if (currentQuestion != null) {
                // A. Options
                Matcher optMatcher = OPTION_PATTERN.matcher(line);
                if (optMatcher.find()) {
                    String optText = optMatcher.group(2).trim();
                    boolean isTrue = false;
                    Matcher trueMatcher = TRUE_FLAG_PATTERN.matcher(optText);
                    if (trueMatcher.find()) {
                        isTrue = true;
                        optText = optText.substring(0, optText.lastIndexOf('|')).trim();
                    }
                    if (currentOptions != null) {
                        currentOptions.add(optText);
                        if (isTrue && correctIndices != null) correctIndices.add(currentOptions.size() - 1);
                    }
                    continue;
                }

                // B. Key/Answer
                Matcher keyMatcher = KEY_PATTERN.matcher(line);
                if (keyMatcher.find()) {
                    String type = keyMatcher.group(1).toLowerCase();
                    String content = keyMatcher.group(2).trim();

                    if (type.startsWith("org")) {
                        currentQuestion.put("original_sentence", content);
                    } else if (type.startsWith("word")) {
                        currentQuestion.put("shuffled_words", Arrays.asList(content.split("/")));
                    } else {
                        currentQuestion.put("correct", content);
                    }
                    continue;
                }

                // C. Multiline Text Append
                boolean isKeyLine = KEY_PATTERN.matcher(line).find();
                boolean isOptionLine = OPTION_PATTERN.matcher(line).find();
                boolean isQLine = QUESTION_START_PATTERN.matcher(line).find();

                if (!isKeyLine && !isOptionLine && !isQLine) {
                    String oldText = (String) currentQuestion.get("text");
                    if (!line.equals(oldText) && !oldText.endsWith(line)) {
                        currentQuestion.put("text", oldText + "\n" + line);
                    }
                }
            }
        }

        saveCurrentQuestion(questions, currentQuestion, currentOptions, correctIndices, currentLevel);
        return questions;
    }

    private void saveCurrentQuestion(List<Map<String, Object>> questions, Map<String, Object> q, List<String> options, List<Integer> correctIndices, String level) {
        if (q != null) {
            // [NEW] Đảm bảo luôn có level trong Map trước khi lưu
            if (!q.containsKey("level")) {
                q.put("level", level);
            }

            // Xử lý FILL_BLANK như cũ
            if ("FILL_BLANK".equals(q.get("type"))) {
                String text = (String) q.get("text");
                List<String> extractedAnswers = new ArrayList<>();
                Matcher m = Pattern.compile("\\{([^}]+)}").matcher(text);
                StringBuffer sb = new StringBuffer();
                while (m.find()) {
                    extractedAnswers.add(m.group(1).trim());
                    m.appendReplacement(sb, "___");
                }
                m.appendTail(sb);

                q.put("text_processed", sb.toString());
                q.put("correct_blanks", extractedAnswers);
            }

            if (options != null && !options.isEmpty()) {
                q.put("options", new ArrayList<>(options));
            }
            if (correctIndices != null && !correctIndices.isEmpty()) {
                if (correctIndices.size() == 1) q.put("correct", correctIndices.get(0));
                else {
                    q.put("correct", correctIndices);
                    q.put("type", "QUIZ_MULTI"); // Tự động switch sang Multi nếu có nhiều đáp án đúng
                }
            }
            questions.add(q);
        }
    }
}