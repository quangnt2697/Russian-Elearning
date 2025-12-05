package com.russianmaster.app.repository;
import com.russianmaster.app.entity.PracticeSubmission;
import com.russianmaster.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PracticeSubmissionRepository extends JpaRepository<PracticeSubmission, Long> {
    List<PracticeSubmission> findByUser(User user); // Thêm dòng này
}