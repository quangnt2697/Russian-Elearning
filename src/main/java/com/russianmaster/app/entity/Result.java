package com.russianmaster.app.entity;

import com.russianmaster.app.enums.CEFRLevel;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "results")
public class Result {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id") private User user;
    @ManyToOne @JoinColumn(name = "test_id") private Test test;
    private Double score;
    @Column(columnDefinition = "TEXT") private String userAnswers;
    @Column(columnDefinition = "TEXT") private String adminFeedback;
    private boolean isReviewed;
    private LocalDateTime createdAt = LocalDateTime.now();
    private Integer totalWeightedScore; // Tổng điểm trọng số (Ví dụ: 85)
    @Enumerated(EnumType.STRING)
    private CEFRLevel detectedLevel; // Kết quả xếp loại: B1
}