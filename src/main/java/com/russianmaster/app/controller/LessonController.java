package com.russianmaster.app.controller;

import com.russianmaster.app.entity.Lesson;
import com.russianmaster.app.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    @Autowired
    private LessonRepository lessonRepository;

    // API lấy toàn bộ danh sách bài học
    // URL: http://localhost:8080/api/lessons
    @GetMapping
    public List<Lesson> getAllLessons() {
        return lessonRepository.findAll();
    }

    // API lấy chi tiết 1 bài học (nếu cần mở rộng sau này)
    @GetMapping("/{id}")
    public Lesson getLessonById(@PathVariable Long id) {
        return lessonRepository.findById(id).orElse(null);
    }
}