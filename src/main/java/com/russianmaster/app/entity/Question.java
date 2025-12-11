package com.russianmaster.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.russianmaster.app.enums.CEFRLevel;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    @JsonIgnore // Tránh loop khi serialize
    private Test test;

    @Column(columnDefinition = "TEXT")
    private String content; // Nội dung câu hỏi

    @Enumerated(EnumType.STRING)
    private CEFRLevel difficultyLevel; // A1, A2...

    private String type; // QUIZ_SINGLE, FILL_BLANK...

    // Lưu options và đáp án dưới dạng JSON để đơn giản hóa việc map từ code cũ
    @Column(columnDefinition = "TEXT")
    private String optionsJson; // ["A...", "B..."]

    @Column(columnDefinition = "TEXT")
    private String correctKey; // Index đúng (ví dụ "0") hoặc text đáp án

    private Double scoreWeight; // Điểm quy đổi (level.weight)
}