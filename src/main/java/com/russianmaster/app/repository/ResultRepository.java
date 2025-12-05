package com.russianmaster.app.repository;
import com.russianmaster.app.entity.Result;
import com.russianmaster.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResultRepository extends JpaRepository<Result, Long> {
    List<Result> findByUser(User user); // Thêm dòng này
}