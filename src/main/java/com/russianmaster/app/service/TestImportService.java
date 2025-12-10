package com.russianmaster.app.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.russianmaster.app.entity.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TestImportService {

    @Autowired
    private ContentService contentService;

    public enum QuestionType {
        QUIZ_SINGLE, QUIZ_MULTI, READING, ARRANGE, REWRITE, ERROR_CHECK, LISTENING,
        INSTRUCTION, FILL_BLANK, AUDIO
    }

    // --- REGEX PATTERNS ---
    private static final Pattern META_TITLE_PATTERN = Pattern.compile("^#EXAM_TITLE:\\s*(.*)", Pattern.CASE_INSENSITIVE);

    // [UPDATED] Type pattern: Bắt tag [TYPE:...]
    private static final Pattern TYPE_TAG_PATTERN = Pattern.compile("\\[TYPE:\\s*(\\w+)]", Pattern.CASE_INSENSITIVE);

    // [UPDATED] Src pattern: Bắt tag [SRC:...]
    private static final Pattern SRC_TAG_PATTERN = Pattern.compile("\\[SRC:\\s*(.*)]", Pattern.CASE_INSENSITIVE);

    private static final Pattern INSTRUCTION_PATTERN = Pattern.compile(
            "^\\s*(Bài|Phần|Part|Task|Exercise)\\s*\\d+.*|^\\s*(Mark the letter|Read the following|Choose the word|Read the passage|Hoàn thành|Điền vào).*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // [UPDATED] Regex bắt đầu câu hỏi: Hỗ trợ cả ngoặc tròn (1) hoặc số không 1. 1:
    private static final Pattern QUESTION_START_PATTERN = Pattern.compile("^(\\{Q\\d+}|Câu \\d+[:.]|Question \\d+[:.]|\\d+[:.])\\s*(.*)", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    // [UPDATED] Regex Fill Blank: Tìm chuỗi có dạng {text} để xác nhận dòng này có lỗ hổng
    private static final Pattern FILL_BLANK_CONTENT_PATTERN = Pattern.compile(".*\\{.+}.*", Pattern.DOTALL);

    private static final Pattern OPTION_PATTERN = Pattern.compile("^([A-D])[:.)]\\s*(.*)", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRUE_FLAG_PATTERN = Pattern.compile("\\|\\s*True$", Pattern.CASE_INSENSITIVE);

    // [UPDATED] Key pattern: Bắt đầu dòng hoặc sau tag {Qx}
    private static final Pattern KEY_PATTERN = Pattern.compile("(?:^|\\s)(Key|Answer|Đáp án|Org|Words)[:.]\\s*(.*)", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final Pattern PASSAGE_START = Pattern.compile("^\\[PASSAGE]", Pattern.CASE_INSENSITIVE);
    private static final Pattern PASSAGE_END = Pattern.compile("^\\[/PASSAGE]", Pattern.CASE_INSENSITIVE);

    public Test importFromStream(MultipartFile file, String title, Integer duration) throws Exception {
        String text = contentService.extractTextFromFile(file);
        Map<String, String> metadata = new HashMap<>();

        List<Map<String, Object>> questions = parseCustomFormat(text, metadata);

        if (questions.isEmpty()) {
            throw new RuntimeException("Không tìm thấy nội dung hợp lệ. Vui lòng kiểm tra file.");
        }

        Test test = new Test();
        test.setTitle(metadata.getOrDefault("title", title));
        test.setDuration(duration);
        test.setDescription("Imported custom format.");
        test.setQuestionsData(new ObjectMapper().writeValueAsString(questions));

        // Nếu có audio chung từ Metadata
        if (metadata.containsKey("audio")) {
            test.setAudioUrl(metadata.get("audio"));
        }

        return test;
    }

    private List<Map<String, Object>> parseCustomFormat(String text, Map<String, String> metadata) {
        List<Map<String, Object>> questions = new ArrayList<>();
        // Split lines but keep empty lines to identify blocks if needed (though trim() handles it)
        String[] lines = text.split("\\r?\\n");

        QuestionType currentType = QuestionType.QUIZ_SINGLE;
        Map<String, Object> currentQuestion = null;
        List<String> currentOptions = null;
        List<Integer> correctIndices = null;

        StringBuilder passageContent = new StringBuilder();
        boolean isPassageBlock = false;
        String currentMediaSrc = null; // Audio riêng cho từng nhóm câu hỏi

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

            // 2. MEDIA SRC (Audio)
            // [UPDATED] Xử lý SRC trước, có thể nằm cùng dòng với TYPE
            Matcher srcMatcher = SRC_TAG_PATTERN.matcher(line);
            if (srcMatcher.find()) {
                currentMediaSrc = srcMatcher.group(1).trim();
                // Xóa tag SRC khỏi line để xử lý tiếp phần còn lại (nếu có TYPE)
                line = line.replace(srcMatcher.group(0), "").trim();
            }

            // 3. TYPE TAG
            Matcher typeMatcher = TYPE_TAG_PATTERN.matcher(line);
            if (typeMatcher.find()) {
                // Lưu câu hỏi cũ trước khi chuyển type
                saveCurrentQuestion(questions, currentQuestion, currentOptions, correctIndices);
                currentQuestion = null;

                try {
                    currentType = QuestionType.valueOf(typeMatcher.group(1).toUpperCase());
                } catch (Exception e) {
                    currentType = QuestionType.QUIZ_SINGLE;
                }

                // Reset state cục bộ
                passageContent.setLength(0);
                isPassageBlock = false;
                // Nếu type là AUDIO, SRC đã được bắt ở bước 2, giữ nguyên currentMediaSrc
                // Nếu type khác, và không có SRC dòng này, giữ nguyên mediaSrc cũ (cho nhóm)
                // hoặc reset nếu logic của bạn là mỗi nhóm có src riêng. Ở đây ta giữ logic media theo block.

                // [UPDATED] Xử lý nội dung còn lại trên dòng (Ví dụ: [TYPE: INSTRUCTION] Bài 1...)
                String remain = line.replace(typeMatcher.group(0), "").trim();
                if (!remain.isEmpty()) {
                    if (currentType == QuestionType.INSTRUCTION) {
                        Map<String, Object> instruction = new HashMap<>();
                        instruction.put("id", idCounter++);
                        instruction.put("type", "INSTRUCTION");
                        instruction.put("text", remain);
                        questions.add(instruction);
                    } else {
                        // Nếu còn dư text ở các type khác (ví dụ FILL_BLANK), đẩy lại line để xử lý ở bước QUESTION
                        line = remain;
                        // Fallthrough to Question check
                    }
                } else {
                    continue;
                }
            }

            // 4. PASSAGE BLOCK
            if (PASSAGE_START.matcher(line).find()) { isPassageBlock = true; continue; }
            if (PASSAGE_END.matcher(line).find()) { isPassageBlock = false; continue; }
            if (isPassageBlock) { passageContent.append(line).append("\n"); continue; }

            // 5. INSTRUCTION (Nếu không có tag TYPE nhưng khớp pattern Instruction)
            if (INSTRUCTION_PATTERN.matcher(line).find() && !QUESTION_START_PATTERN.matcher(line).find()) {
                saveCurrentQuestion(questions, currentQuestion, currentOptions, correctIndices);
                currentQuestion = null;

                Map<String, Object> instruction = new HashMap<>();
                instruction.put("id", idCounter++);
                instruction.put("type", "INSTRUCTION");
                instruction.put("text", line);
                questions.add(instruction);
                continue;
            }

            // 6. QUESTION START
            Matcher qMatcher = QUESTION_START_PATTERN.matcher(line);
            boolean isFillBlankLine = currentType == QuestionType.FILL_BLANK && FILL_BLANK_CONTENT_PATTERN.matcher(line).matches();

            // Logic: Bắt đầu câu hỏi nếu khớp Pattern Q HOẶC (đang ở mode FillBlank và dòng này chứa {...})
            if (qMatcher.find() || (isFillBlankLine && currentQuestion == null)) {
                saveCurrentQuestion(questions, currentQuestion, currentOptions, correctIndices);

                currentQuestion = new HashMap<>();
                currentQuestion.put("id", idCounter++);
                currentQuestion.put("type", currentType.name());

                String qText;
                if (qMatcher.matches()) { // Dòng bắt đầu bằng {Qx}
                    qText = qMatcher.group(2).trim();
                } else {
                    // Trường hợp FillBlank không có {Qx} ở đầu
                    qText = line;
                }

                // [UPDATED] Xử lý Key/Org nằm ngay trên dòng câu hỏi (VD: {Q1} Org: ...)
                // Tách text và các thành phần khác nếu cần thiết, ở đây ta lưu nguyên text
                // Frontend sẽ xử lý hiển thị Org/Key nếu type là REWRITE
                currentQuestion.put("text", qText);

                if (passageContent.length() > 0) currentQuestion.put("passage", passageContent.toString().trim());
                if (currentMediaSrc != null) currentQuestion.put("mediaSrc", currentMediaSrc);

                currentOptions = new ArrayList<>();
                correctIndices = new ArrayList<>();

                // Nếu là FillBlank, ta không continue mà để nó chạy tiếp xuống logic (dù dòng này coi như xong text)
                // Nhưng với QUIZ, dòng này chỉ là text, options ở dưới.
                if (!qMatcher.matches() && isFillBlankLine) continue;
            }

            // 7. DETAILS (Options, Keys)
            if (currentQuestion != null) {
                // A. Option A, B, C...
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

                // B. Key/Answer (Tự luận, Rewrite, Error Check)
                Matcher keyMatcher = KEY_PATTERN.matcher(line);
                if (keyMatcher.find()) {
                    String type = keyMatcher.group(1).toLowerCase(); // Key, Org...
                    String content = keyMatcher.group(2).trim();

                    if (type.startsWith("org")) {
                        currentQuestion.put("original_sentence", content);
                        // Nếu dòng hiện tại chính là dòng Org (trong {Q1} Org:...), cập nhật lại text hiển thị
                        // Để Frontend hiển thị đẹp hơn
                        if (currentQuestion.get("text").toString().startsWith("Org:")) {
                            currentQuestion.put("text", "Rewrite the following sentence:");
                        }
                    } else if (type.startsWith("word")) {
                        currentQuestion.put("shuffled_words", Arrays.asList(content.split("/")));
                    } else {
                        currentQuestion.put("correct", content);
                    }
                    continue;
                }

                // C. Nối text (multiline question)
                // Chỉ nối nếu dòng này không phải option, không phải key, và không phải dòng vừa tạo question
                boolean isKeyLine = KEY_PATTERN.matcher(line).find();
                boolean isOptionLine = OPTION_PATTERN.matcher(line).find();
                boolean isQLine = QUESTION_START_PATTERN.matcher(line).find();

                if (!isKeyLine && !isOptionLine && !isQLine) {
                    // Logic nối chuỗi
                    String oldText = (String) currentQuestion.get("text");
                    if (!line.equals(oldText) && !oldText.endsWith(line)) { // Tránh lặp
                        currentQuestion.put("text", oldText + "\n" + line);
                    }
                }
            }
        }

        saveCurrentQuestion(questions, currentQuestion, currentOptions, correctIndices);
        return questions;
    }

    private void saveCurrentQuestion(List<Map<String, Object>> questions, Map<String, Object> q, List<String> options, List<Integer> correctIndices) {
        if (q != null) {
            // [UPDATED] Xử lý đặc biệt cho FILL_BLANK: Tự động trích xuất đáp án từ {answer}
            if ("FILL_BLANK".equals(q.get("type"))) {
                String text = (String) q.get("text");
                List<String> extractedAnswers = new ArrayList<>();
                Matcher m = Pattern.compile("\\{([^}]+)}").matcher(text);
                StringBuffer sb = new StringBuffer();
                while (m.find()) {
                    extractedAnswers.add(m.group(1).trim());
                    m.appendReplacement(sb, "___"); // Thay thế bằng placeholder để Frontend render input
                }
                m.appendTail(sb);

                q.put("text_processed", sb.toString()); // Text đã che đáp án
                q.put("correct_blanks", extractedAnswers); // List đáp án đúng
            }

            if (options != null && !options.isEmpty()) {
                q.put("options", new ArrayList<>(options));
            }
            if (correctIndices != null && !correctIndices.isEmpty()) {
                if (correctIndices.size() == 1) q.put("correct", correctIndices.get(0));
                else {
                    q.put("correct", correctIndices);
                    q.put("type", "QUIZ_MULTI");
                }
            }
            questions.add(q);
        }
    }
}