package com.russianmaster.app.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "practices")
public class Practice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;           // Ví dụ: Luyện nói chủ đề Gia đình
    private String type;            // LISTENING, SPEAKING, READING, WRITING
    @Column(length = 2000) private String description;

    @Column(columnDefinition = "TEXT")
    private String content;         // Nội dung bài đọc hoặc đề bài viết

    private String icon;            // Tên icon để Frontend render (Mic, Book, etc.)
    private String color;           // Mã màu (bg-blue-500)

    private String mediaUrl;        // File nghe (nếu có)
}