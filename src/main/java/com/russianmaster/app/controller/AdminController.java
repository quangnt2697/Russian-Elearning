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

    // --- REPOSITORIES ---
    @Autowired private UserRepository userRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private TestRepository testRepository;
    @Autowired private ResultRepository resultRepository;
    @Autowired private PracticeSubmissionRepository practiceSubmissionRepository;
    @Autowired private PracticeRepository practiceRepository;
    @Autowired private DocumentRepository documentRepository;

    // --- SERVICES ---
    @Autowired private ContentService contentService;
    @Autowired private TestImportService testImportService;
    @Autowired private SupabaseStorageService storageService;

    // ==========================================
    // 1. DASHBOARD STATISTICS
    // ==========================================
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getDashboardStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalTests", testRepository.count());
        stats.put("totalLessons", lessonRepository.count());
        stats.put("totalDocs", documentRepository.count());
        return ResponseEntity.ok(stats);
    }

    // ==========================================
    // 2. USER MANAGEMENT
    // ==========================================
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

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

    // ==========================================
    // 3. FEEDBACK SYSTEM
    // ==========================================
    @PostMapping("/feedback/result/{id}")
    public ResponseEntity<?> feedbackResult(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Result r = resultRepository.findById(id).orElseThrow(() -> new RuntimeException("Result not found"));
        r.setAdminFeedback(payload.get("feedback"));
        r.setReviewed(true);
        resultRepository.save(r);
        return ResponseEntity.ok("Feedback saved");
    }

    @PostMapping("/feedback/practice/{id}")
    public ResponseEntity<?> feedbackPractice(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        PracticeSubmission p = practiceSubmissionRepository.findById(id).orElseThrow(() -> new RuntimeException("Submission not found"));
        p.setFeedback(payload.get("feedback"));
        p.setReviewed(true);
        practiceSubmissionRepository.save(p);
        return ResponseEntity.ok("Feedback saved");
    }

    // ==========================================
    // 4. CONTENT UPLOAD & IMPORT
    // ==========================================

    // A. TẠO BÀI LUYỆN TẬP (PRACTICE)
    @PostMapping("/practices")
    public ResponseEntity<?> createPractice(@RequestBody Practice practice) {
        try {
            return ResponseEntity.ok(practiceRepository.save(practice));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // B. IMPORT BÀI GIẢNG (LESSON)
    @PostMapping(value = "/lessons/import", consumes = "multipart/form-data")
    public ResponseEntity<?> importLesson(@RequestParam("file") MultipartFile file,
                                          @RequestParam(value="audio", required=false) MultipartFile audio,
                                          @RequestParam("title") String title,
                                          @RequestParam("description") String description) {
        try {
            // 1. Upload file gốc lên Supabase để lấy URL
            String fileUrl = storageService.uploadFile(file);

            // 2. Xác định loại file
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.lastIndexOf(".") > 0) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            }

            String fileType = "UNKNOWN";
            if (List.of("DOC", "DOCX").contains(extension)) fileType = "DOCX";
            else if (List.of("PPT", "PPTX").contains(extension)) fileType = "PPTX";
            else if (List.of("PDF").contains(extension)) fileType = "PDF";
            else if (List.of("XLS", "XLSX").contains(extension)) fileType = "XLSX";
            else if (List.of("MP4", "WEBM").contains(extension)) fileType = "VIDEO";

            // 3. Trích xuất text (nếu là PDF/DOCX) để lưu vào theory (dùng cho search/preview text)
            // Nếu là PPTX thì text extraction có thể phức tạp, tạm thời để trống hoặc chỉ extract nếu hỗ trợ
            String textContent = "";
            try {
                if (fileType.equals("PDF") || fileType.equals("DOCX") || fileType.equals("DOC")) {
                    textContent = contentService.extractTextFromFile(file);
                } else {
                    textContent = "Nội dung trình chiếu Powerpoint. Vui lòng xem file đính kèm.";
                }
            } catch (Exception ex) {
                System.out.println("Text extraction failed (non-critical): " + ex.getMessage());
            }

            Lesson l = new Lesson();
            l.setTitle(title);
            l.setDescription(description);
            l.setTheory(textContent);
            l.setFileUrl(fileUrl);   // [NEW] Lưu URL file
            l.setFileType(fileType); // [NEW] Lưu loại file (PPTX, PDF...)

            if(audio != null) {
                l.setAudioUrl(storageService.uploadFile(audio));
            }
            lessonRepository.save(l);
            return ResponseEntity.ok("Lesson Imported Successfully with File Source");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // C. IMPORT ĐỀ THI (TEST) - HỖ TRỢ NHIỀU DẠNG CÂU HỎI
    @PostMapping(value = "/tests/import", consumes = "multipart/form-data")
    public ResponseEntity<?> importTest(@RequestParam("file") MultipartFile file,
                                        @RequestParam(value="audio", required=false) MultipartFile audio,
                                        @RequestParam("title") String title,
                                        @RequestParam("duration") Integer duration) {
        try {
            // Sử dụng TestImportService để parse file phức tạp (Reading, Quiz, Arrange...)
            Test t = testImportService.importFromStream(file, title, duration);

            // Upload audio đề thi (nếu có) - Dùng chung cho bài nghe
            if(audio != null) {
                t.setAudioUrl(storageService.uploadFile(audio));
            }

            testRepository.save(t);
            return ResponseEntity.ok("Test Imported Successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi import đề thi: " + e.getMessage());
        }
    }

    // D. IMPORT TÀI LIỆU (DOCUMENT)
    @PostMapping(value = "/documents/import", consumes = "multipart/form-data")
    public ResponseEntity<?> importDocument(@RequestParam("file") MultipartFile file,
                                            @RequestParam("title") String title,
                                            @RequestParam("description") String description,
                                            @RequestParam("type") String type) {
        try {
            // Upload file lên Supabase Storage
            String fileUrl = storageService.uploadFile(file);

            Document doc = new Document();
            doc.setTitle(title);
            doc.setDescription(description);
            doc.setType(type); // PDF, DOCX, AUDIO
            doc.setFileUrl(fileUrl);

            documentRepository.save(doc);
            return ResponseEntity.ok("Document Imported");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error uploading document: " + e.getMessage());
        }
    }

    // E. IMPORT LUYỆN TẬP (PRACTICE)
    @PostMapping(value = "/practices/import", consumes = "multipart/form-data")
    public ResponseEntity<?> importPractice(@RequestParam("file") MultipartFile file,
                                            @RequestParam(value="audio", required=false) MultipartFile audio,
                                            @RequestParam("title") String title,
                                            @RequestParam("type") String type,
                                            @RequestParam("description") String description) {
        try {
            // 1. Sử dụng lại logic parse của TestImportService để lấy cấu trúc câu hỏi
            // Lưu ý: TestImportService trả về đối tượng Test, ta sẽ lấy field questionsData từ đó
            Test tempTest = testImportService.importFromStream(file, title, 0);
            String jsonContent = tempTest.getQuestionsData();

            // 2. Tạo đối tượng Practice
            Practice practice = new Practice();
            practice.setTitle(title);
            practice.setType(type);
            practice.setDescription(description);
            // QUAN TRỌNG: Lưu nội dung là JSON câu hỏi, không phải URL file
            practice.setContent(jsonContent);

            // 3. Upload Audio nếu có
            if(audio != null) {
                practice.setMediaUrl(storageService.uploadFile(audio));
            }

            return ResponseEntity.ok(practiceRepository.save(practice));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi import bài tập: " + e.getMessage());
        }
    }

    // ==========================================
    // 5. DELETE CONTENT
    // ==========================================
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

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        documentRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}