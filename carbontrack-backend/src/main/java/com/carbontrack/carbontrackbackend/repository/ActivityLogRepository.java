package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    Page<ActivityLog> findByUserId(Long userId, Pageable pageable);

    Page<ActivityLog> findByUserIdAndCategory(Long userId, Category category, Pageable pageable);

    Page<ActivityLog> findByUserIdAndLogDateBetween(
            Long userId, LocalDate from, LocalDate to, Pageable pageable);

    Optional<ActivityLog> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT a FROM ActivityLog a WHERE a.user.id = :userId " +
           "AND (:category IS NULL OR a.category = :category) " +
           "AND (:from IS NULL OR a.logDate >= :from) " +
           "AND (:to IS NULL OR a.logDate <= :to)")
    Page<ActivityLog> findFiltered(@Param("userId") Long userId,
                                   @Param("category") Category category,
                                   @Param("from") LocalDate from,
                                   @Param("to") LocalDate to,
                                   Pageable pageable);
}