package com.russianmaster.app.controller;

import com.russianmaster.app.entity.Practice;
import com.russianmaster.app.entity.PracticeSubmission;
import com.russianmaster.app.entity.User;
import com.russianmaster.app.repository.PracticeRepository;
import com.russianmaster.app.repository.PracticeSubmissionRepository;
import com.russianmaster.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PracticeController {

    @Autowired
    private PracticeRepository practiceRepository;

    @Autowired
    private PracticeSubmissionRepository submissionRepository;

    @Autowired
    private UserRepository userRepository;

    // --- API PUBLIC: Lấy danh sách đề luyện tập ---
    @GetMapping("/practices")
    public List<Practice> getAllPractices() {
        return practiceRepository.findAll();
    }

    // --- API MỚI: Lấy lịch sử bài luyện tập của User đang đăng nhập ---
    // URL: GET /api/practices/history
    @GetMapping("/practices/history")
    public ResponseEntity<?> getMyPracticeHistory() {
        try {
            // 1. Xác thực User từ Session
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            // 2. Tìm User trong DB
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found: " + username));

            // 3. Lấy danh sách bài nộp của user này
            // Lưu ý: PracticeSubmissionRepository phải có hàm findByUser(User user)
            List<PracticeSubmission> history = submissionRepository.findByUser(user);

            return ResponseEntity.ok(history);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi lấy lịch sử: " + e.getMessage());
        }
    }

    // --- API USER: Nộp bài luyện tập ---
    @PostMapping("/practices/submit")
    public ResponseEntity<?> submitPractice(@RequestBody Map<String, String> payload) {
        try {
            System.out.println("DEBUG: --- START SUBMIT PRACTICE ---");

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            PracticeSubmission sub = new PracticeSubmission();
            sub.setUser(user);
            sub.setTitle(payload.get("title"));
            sub.setType(payload.get("type"));
            sub.setContent(payload.get("content"));
            sub.setReviewed(false);

            submissionRepository.save(sub);
            System.out.println("DEBUG: Practice saved with ID: " + sub.getId());

            return ResponseEntity.ok(sub);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi nộp bài: " + e.getMessage());
        }
    }
}