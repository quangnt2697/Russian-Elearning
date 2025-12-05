package com.russianmaster.app.controller;

import com.russianmaster.app.service.SupabaseStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    @Autowired
    private SupabaseStorageService storageService;

    @PostMapping("/audio")
    public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) {
        try {
            // Upload lên Supabase và nhận về URL
            String publicUrl = storageService.uploadFile(file);
            return ResponseEntity.ok(publicUrl);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Upload Error: " + e.getMessage());
        }
    }
}