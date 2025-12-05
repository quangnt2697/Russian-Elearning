//package com.russianmaster.app.service;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.russianmaster.app.entity.Test;
//import org.apache.pdfbox.Loader;
//import org.apache.pdfbox.pdmodel.PDDocument;
//import org.apache.pdfbox.text.PDFTextStripper;
//import org.apache.poi.xwpf.usermodel.*;
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//import java.io.IOException;
//import java.util.*;
//
//@Service
//public class TestImportService {
//    public Test importFromStream(MultipartFile file, String title, Integer duration) throws IOException {
//        String content = "";
//        String fileName = file.getOriginalFilename();
//        if (fileName != null && fileName.endsWith(".pdf")) {
//            try (PDDocument document = Loader.loadPDF(file.getBytes())) {
//                content = new PDFTextStripper().getText(document);
//            }
//        } else if (fileName != null && fileName.endsWith(".docx")) {
//            try (XWPFDocument document = new XWPFDocument(file.getInputStream())) {
//                StringBuilder sb = new StringBuilder();
//                for (XWPFParagraph para : document.getParagraphs()) sb.append(para.getText()).append("\n");
//                content = sb.toString();
//            }
//        }
//
//        Test test = new Test();
//        test.setTitle(title);
//        test.setDuration(duration);
//        test.setDescription("Imported from " + fileName);
//
//        // Tạo câu hỏi giả lập (vì logic parse text phức tạp cần regex cụ thể)
//        List<Map<String, Object>> questions = new ArrayList<>();
//        Map<String, Object> q = new HashMap<>();
//        q.put("id", 1);
//        q.put("text", "Nội dung trích xuất: " + (content.length() > 50 ? content.substring(0, 50) + "..." : content));
//        q.put("options", Arrays.asList("A", "B", "C", "D"));
//        q.put("correct", 0);
//        questions.add(q);
//
//        test.setQuestionsData(new ObjectMapper().writeValueAsString(questions));
//        return test;
//    }
//}

package com.russianmaster.app.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.russianmaster.app.entity.Test;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TestImportService {

    // Regex để bắt các pattern: "Câu 1:", "1.", "Bài 1:"
    private static final Pattern QUESTION_START_PATTERN = Pattern.compile("^(Câu|Bài|Question)?\\s*\\d+[:.]\\s*(.*)", Pattern.CASE_INSENSITIVE);
    // Regex bắt đáp án: "A.", "a)", "A)"
    private static final Pattern OPTION_PATTERN = Pattern.compile("^([A-D])[:.)]\\s*(.*)", Pattern.CASE_INSENSITIVE);
    // Regex bắt dòng đáp án đúng: "Đáp án: A", "Key: A"
    private static final Pattern ANSWER_KEY_PATTERN = Pattern.compile("^(Đáp án|Key|Answer)[:.]\\s*([A-D])", Pattern.CASE_INSENSITIVE);

    public Test importFromStream(MultipartFile file, String title, Integer duration) throws IOException {
        String content = extractText(file);

        // Parse nội dung text thành cấu trúc câu hỏi
        List<Map<String, Object>> questions = parseQuestionsFromText(content);

        Test test = new Test();
        test.setTitle(title);
        test.setDuration(duration);
        test.setDescription("Đề thi được import tự động từ file: " + file.getOriginalFilename());

        // Chuyển List câu hỏi thành JSON String để lưu vào DB
        ObjectMapper mapper = new ObjectMapper();
        test.setQuestionsData(mapper.writeValueAsString(questions));

        return test;
    }

    private String extractText(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        if (fileName != null && fileName.endsWith(".pdf")) {
            try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                return new PDFTextStripper().getText(document);
            }
        } else if (fileName != null && fileName.endsWith(".docx")) {
            try (XWPFDocument document = new XWPFDocument(file.getInputStream())) {
                StringBuilder sb = new StringBuilder();
                for (XWPFParagraph para : document.getParagraphs()) {
                    sb.append(para.getText()).append("\n");
                }
                return sb.toString();
            }
        }
        return "";
    }

    private List<Map<String, Object>> parseQuestionsFromText(String text) {
        List<Map<String, Object>> questions = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");

        Map<String, Object> currentQuestion = null;
        List<String> currentOptions = new ArrayList<>();
        int questionIndex = 1;

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            Matcher qMatcher = QUESTION_START_PATTERN.matcher(line);
            Matcher optMatcher = OPTION_PATTERN.matcher(line);
            Matcher keyMatcher = ANSWER_KEY_PATTERN.matcher(line);

            if (qMatcher.find()) {
                // Lưu câu hỏi cũ nếu có
                if (currentQuestion != null) {
                    finalizeQuestion(currentQuestion, currentOptions);
                    questions.add(currentQuestion);
                }

                // Tạo câu hỏi mới
                currentQuestion = new HashMap<>();
                currentQuestion.put("id", questionIndex++);
                currentQuestion.put("text", qMatcher.group(2)); // Lấy nội dung sau "Câu 1:"
                currentQuestion.put("type", "quiz");
                currentOptions = new ArrayList<>();

            } else if (optMatcher.find() && currentQuestion != null) {
                // Là dòng lựa chọn (A, B, C, D)
                currentOptions.add(optMatcher.group(2));

            } else if (keyMatcher.find() && currentQuestion != null) {
                // Là dòng đáp án đúng (Key: A)
                String keyChar = keyMatcher.group(2).toUpperCase(); // A, B, C, D
                int correctIndex = keyChar.charAt(0) - 'A'; // A->0, B->1...
                currentQuestion.put("correct", correctIndex);

            } else {
                // Dòng text thường, có thể là nội dung tiếp theo của câu hỏi
                if (currentQuestion != null && currentOptions.isEmpty()) {
                    String currentText = (String) currentQuestion.get("text");
                    currentQuestion.put("text", currentText + " " + line);
                }
            }
        }

        // Lưu câu hỏi cuối cùng
        if (currentQuestion != null) {
            finalizeQuestion(currentQuestion, currentOptions);
            questions.add(currentQuestion);
        }

        return questions;
    }

    private void finalizeQuestion(Map<String, Object> question, List<String> options) {
        question.put("options", new ArrayList<>(options));
        // Nếu không tìm thấy đáp án đúng trong file, mặc định là A (0) để tránh lỗi
        if (!question.containsKey("correct")) {
            question.put("correct", 0);
        }
    }
}