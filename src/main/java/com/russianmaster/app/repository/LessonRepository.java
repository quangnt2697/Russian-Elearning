package com.russianmaster.app.repository;
import com.russianmaster.app.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
public interface LessonRepository extends JpaRepository<Lesson, Long> {}