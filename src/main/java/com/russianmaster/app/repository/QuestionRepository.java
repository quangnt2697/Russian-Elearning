package com.russianmaster.app.repository;

import com.russianmaster.app.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    // Tìm câu hỏi theo Test ID
    List<Question> findByTestId(Long testId);

    // [Optional] API lấy câu hỏi ngẫu nhiên để làm bài test đầu vào (Placement Test)
    // Cần bật nativeQuery = true vì cú pháp RANDOM() là của PostgreSQL
    @Query(value = "SELECT * FROM questions q WHERE q.difficulty_level = :level ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomQuestionsByLevel(String level, int limit);
}