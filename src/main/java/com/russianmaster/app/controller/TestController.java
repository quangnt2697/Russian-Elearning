package com.russianmaster.app.controller;

import com.russianmaster.app.entity.Result;
import com.russianmaster.app.entity.Test;
import com.russianmaster.app.entity.User;
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

    // Nộp bài kiểm tra
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
            Double score = Double.valueOf(payload.get("score").toString());
            String userAnswers = payload.get("userAnswers").toString();

            // 3. Tìm bài Test gốc
            Test test = testRepository.findById(testId)
                    .orElseThrow(() -> new RuntimeException("Bài kiểm tra không tồn tại ID: " + testId));

            // 4. Lưu kết quả
            Result result = new Result();
            result.setUser(user);
            result.setTest(test);
            result.setScore(score);
            result.setUserAnswers(userAnswers);
            result.setReviewed(false);

            resultRepository.save(result);

            return ResponseEntity.ok("Nộp bài thành công!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi nộp bài: " + e.getMessage());
        }
    }
}