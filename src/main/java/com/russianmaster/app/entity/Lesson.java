package com.russianmaster.app.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "lessons")
public class Lesson {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(length = 2000) private String description;
    @Column(columnDefinition = "TEXT") private String theory;
    private String icon;
    private String color;
    private String audioUrl; // URL file audio
}