package com.russianmaster.app.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
@Table(name = "tests")
public class Test {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(columnDefinition = "TEXT") private String description;
    private Integer duration;
    private String audioUrl; // URL file audio đề thi
    @Column(columnDefinition = "TEXT") private String questionsData; // JSON câu hỏi
    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Question> questions;
}