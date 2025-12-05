package com.russianmaster.app.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "practice_submissions")
public class PracticeSubmission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id") private User user;
    private String title;
    private String type;
    @Column(columnDefinition = "TEXT") private String content;
    @Column(columnDefinition = "TEXT") private String feedback;
    private boolean isReviewed;
    private LocalDateTime date = LocalDateTime.now();
}