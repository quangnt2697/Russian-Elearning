package com.russianmaster.app.repository;
import com.russianmaster.app.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
public interface TestRepository extends JpaRepository<Test, Long> {}