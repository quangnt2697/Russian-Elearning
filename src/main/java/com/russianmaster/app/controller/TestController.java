package com.russianmaster.app.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.russianmaster.app.entity.Question;
import com.russianmaster.app.entity.Result;
import com.russianmaster.app.entity.Test;
import com.russianmaster.app.entity.User;
import com.russianmaster.app.enums.CEFRLevel;
import com.russianmaster.app.repository.ResultRepository;
import com.russianmaster.app.repository.TestRepository;
import com.russianmaster.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tests")
public class TestController {

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private ResultRepository resultRepository;

    @Autowired
    private UserRepository userRepository;

    // Lấy danh sách tất cả bài kiểm tra
    @GetMapping
    public List<Test> getAllTests() {
        return testRepository.findAll();
    }

    // Lấy chi tiết bài kiểm tra theo ID
    @GetMapping("/{id}")
    public Test getTestById(@PathVariable Long id) {
        return testRepository.findById(id).orElse(null);
    }

    // --- API MỚI: Lấy lịch sử làm bài của User đang đăng nhập ---
    // URL: GET /api/tests/history
    @GetMapping("/history")
    public ResponseEntity<?> getMyTestHistory() {
        try {
            // 1. Lấy thông tin user từ Security Context (Session)
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            // 2. Tìm User trong DB
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 3. Lấy danh sách kết quả thi của user này
            // Lưu ý: ResultRepository cần có hàm findByUser(User user)
            List<Result> history = resultRepository.findByUser(user);

            return ResponseEntity.ok(history);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi lấy lịch sử: " + e.getMessage());
        }
    }

    // API Nộp bài - Đã nâng cấp logic A1-C2
    @PostMapping("/submit")
    public ResponseEntity<?> submitTest(@RequestBody Map<String, Object> payload) {
        try {
            // 1. Xác thực User
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

            // 2. Parse dữ liệu từ payload
            Long testId = Long.parseLong(payload.get("testId").toString());

            Map<String, Object> userAnswersMap = (Map<String, Object>) payload.get("answers");

            Test test = testRepository.findById(testId)
                    .orElseThrow(() -> new RuntimeException("Bài kiểm tra không tồn tại ID: " + testId));

            int userWeightedScore = 0;
            int maxPossibleScore = 0;

            for (Question q : test.getQuestions()) {
                // Luôn cộng vào điểm tối đa
                maxPossibleScore += q.getDifficultyLevel().getWeight(); // A1=1, ..., C2=6

                String qId = String.valueOf(q.getId());
                if (userAnswersMap.containsKey(qId)) {
                    String userAns = userAnswersMap.get(qId).toString();
                    if (userAns.equalsIgnoreCase(q.getCorrectKey())) {
                        userWeightedScore += q.getDifficultyLevel().getWeight();
                    }
                }
            }

            // 3. Tính phần trăm (Tránh chia cho 0)
            double percentage = (maxPossibleScore > 0)
                    ? ((double) userWeightedScore / maxPossibleScore) * 100
                    : 0;

            // 3. XẾP LOẠI (Ranking Logic)
            CEFRLevel detectedLevel = calculateLevelByPercentage(percentage);

            // 4. Lưu kết quả
            Result result = new Result();
            result.setUser(user);
            result.setTest(test);
            result.setScore((double) userWeightedScore); // Số câu đúng thô
            result.setTotalWeightedScore(maxPossibleScore);
            result.setDetectedLevel(detectedLevel);
            result.setUserAnswers(new ObjectMapper().writeValueAsString(userAnswersMap));

            resultRepository.save(result);

            return ResponseEntity.ok(Map.of(
                    "message", "Nộp bài thành công",
                    "level", detectedLevel,
                    "score", maxPossibleScore
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    private CEFRLevel calculateLevelByPercentage(double percentage) {
        if (percentage < 20) return CEFRLevel.A1; // Hoặc tạo thêm Enum Pre_A1 nếu muốn
        if (percentage < 40) return CEFRLevel.A1;
        if (percentage < 60) return CEFRLevel.A2;
        if (percentage < 75) return CEFRLevel.B1; // Ngưỡng B1 thường rộng hơn
        if (percentage < 90) return CEFRLevel.B2;
        if (percentage < 97) return CEFRLevel.C1;
        return CEFRLevel.C2;
    }
}