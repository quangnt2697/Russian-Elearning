package com.russianmaster.app.controller;

import com.russianmaster.app.entity.Document;
import com.russianmaster.app.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentRepository documentRepository;

    // API lấy danh sách tài liệu (Public cho học viên)
    @GetMapping
    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }

    // API lấy chi tiết tài liệu
    @GetMapping("/{id}")
    public Document getDocumentById(@PathVariable Long id) {
        return documentRepository.findById(id).orElse(null);
    }
}