
package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.dto.analytics.FootprintAggregateDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ActivityLogRepository
        extends JpaRepository<ActivityLog, Long> {

    // Existing activity history
    List<ActivityLog> findByUserIdOrderByLogDateDesc(Long userId);

    // Daily emissions grouped by date and category
    @Query("""
        SELECT new com.carbontrack.carbontrackbackend.dto.analytics.FootprintAggregateDTO(
            a.logDate,
            a.category,
            SUM(a.co2eKg)
        )
        FROM ActivityLog a
        WHERE a.user.id = :userId
          AND a.logDate BETWEEN :startDate AND :endDate
        GROUP BY a.logDate, a.category
        ORDER BY a.logDate ASC, a.category ASC
        """)
    List<FootprintAggregateDTO> aggregateDailyFootprint(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Fetch records for weekly and monthly grouping in Java
    @Query("""
        SELECT a
        FROM ActivityLog a
        WHERE a.user.id = :userId
          AND a.logDate BETWEEN :startDate AND :endDate
        ORDER BY a.logDate ASC
        """)
    List<ActivityLog> findActivitiesForWeeklyAggregation(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Calculate total CO2 emissions for a user within a date range
    @Query("""
    SELECT COALESCE(SUM(a.co2eKg), 0)
    FROM ActivityLog a
    WHERE a.user.id = :userId
      AND a.logDate BETWEEN :startDate AND :endDate
    """)
    BigDecimal sumCo2eKgByUserIdAndLogDateBetween(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
