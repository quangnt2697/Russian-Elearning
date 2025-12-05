package com.russianmaster.app.controller;

import com.russianmaster.app.entity.*;
import com.russianmaster.app.repository.*;
import com.russianmaster.app.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired private UserRepository userRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private TestRepository testRepository;
    @Autowired private ResultRepository resultRepository;
    @Autowired private PracticeSubmissionRepository practiceSubmissionRepository;
    @Autowired private PracticeRepository practiceRepository;

    @Autowired private ContentService contentService;
    @Autowired private TestImportService testImportService;

    // Inject Service mới
    @Autowired private SupabaseStorageService storageService;

    // --- QUẢN LÝ USER ---
    @GetMapping("/users")
    public List<User> getAllUsers() { return userRepository.findAll(); }

    @GetMapping("/users/{id}/results")
    public List<Result> getUserResults(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        return resultRepository.findByUser(user);
    }

    @GetMapping("/users/{id}/practices")
    public List<PracticeSubmission> getUserPractices(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        return practiceSubmissionRepository.findByUser(user);
    }

    // --- FEEDBACK ---
    @PostMapping("/feedback/result/{id}")
    public ResponseEntity<?> feedbackResult(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Result r = resultRepository.findById(id).orElseThrow();
        r.setAdminFeedback(payload.get("feedback"));
        r.setReviewed(true);
        resultRepository.save(r);
        return ResponseEntity.ok("Feedback saved");
    }

    @PostMapping("/feedback/practice/{id}")
    public ResponseEntity<?> feedbackPractice(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        PracticeSubmission p = practiceSubmissionRepository.findById(id).orElseThrow();
        p.setFeedback(payload.get("feedback"));
        p.setReviewed(true);
        practiceSubmissionRepository.save(p);
        return ResponseEntity.ok("Feedback saved");
    }

    // --- TẠO PRACTICE ---
    @PostMapping("/practices")
    public ResponseEntity<?> createPractice(@RequestBody Practice practice) {
        try {
            return ResponseEntity.ok(practiceRepository.save(practice));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // --- IMPORT NỘI DUNG ---
    @PostMapping(value = "/lessons/import", consumes = "multipart/form-data")
    public ResponseEntity<?> importLesson(@RequestParam("file") MultipartFile file,
                                          @RequestParam(value="audio", required=false) MultipartFile audio,
                                          @RequestParam("title") String title,
                                          @RequestParam("description") String description) {
        try {
            String text = contentService.extractTextFromFile(file);
            Lesson l = contentService.parseLesson(text, title, description);

            // Nếu có audio, upload lên Supabase
            if(audio != null) {
                String audioUrl = storageService.uploadFile(audio);
                l.setAudioUrl(audioUrl);
            }

            lessonRepository.save(l);
            return ResponseEntity.ok("Lesson Imported");
        } catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PostMapping(value = "/tests/import", consumes = "multipart/form-data")
    public ResponseEntity<?> importTest(@RequestParam("file") MultipartFile file,
                                        @RequestParam(value="audio", required=false) MultipartFile audio,
                                        @RequestParam("title") String title,
                                        @RequestParam("duration") Integer duration) {
        try {
            Test t = testImportService.importFromStream(file, title, duration);

            // Nếu có audio, upload lên Supabase
            if(audio != null) {
                String audioUrl = storageService.uploadFile(audio);
                t.setAudioUrl(audioUrl);
            }

            testRepository.save(t);
            return ResponseEntity.ok("Test Imported");
        } catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    // --- DELETE API ---
    @DeleteMapping("/tests/{id}")
    public ResponseEntity<?> deleteTest(@PathVariable Long id) {
        testRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

    @DeleteMapping("/practices/{id}")
    public ResponseEntity<?> deletePractice(@PathVariable Long id) {
        practiceRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<?> deleteLesson(@PathVariable Long id) {
        lessonRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}