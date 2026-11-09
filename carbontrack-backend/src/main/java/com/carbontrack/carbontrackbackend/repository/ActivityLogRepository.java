package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.dto.analytics.FootprintAggregateDTO;
import com.carbontrack.carbontrackbackend.dto.benchmark.CategoryEmissionAggregateDTO;
import com.carbontrack.carbontrackbackend.dto.benchmark.UserEmissionAggregateDTO;
import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardCategoryAggregateDTO;
import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardUserAggregateDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByUserIdOrderByLogDateDesc(Long userId);

    @Query("""
        SELECT new com.carbontrack.carbontrackbackend.dto.analytics.FootprintAggregateDTO(
            a.logDate, a.category, SUM(a.co2eKg)
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

    @Query("""
        SELECT a FROM ActivityLog a
        WHERE a.user.id = :userId
          AND a.logDate BETWEEN :startDate AND :endDate
        ORDER BY a.logDate ASC
        """)
    List<ActivityLog> findActivitiesForWeeklyAggregation(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
        SELECT COALESCE(SUM(a.co2eKg), 0)
        FROM ActivityLog a
        WHERE a.user.id = :userId
          AND a.logDate BETWEEN :startDate AND :endDate
        """)
    BigDecimal sumCo2eKgByUserIdAndLogDateBetween(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
        SELECT new com.carbontrack.carbontrackbackend.dto.benchmark.UserEmissionAggregateDTO(
            a.user.id, SUM(a.co2eKg)
        )
        FROM ActivityLog a
        WHERE a.logDate BETWEEN :startDate AND :endDate
        GROUP BY a.user.id
        """)
    List<UserEmissionAggregateDTO> findUserTotalEmissionsBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
        SELECT new com.carbontrack.carbontrackbackend.dto.benchmark.CategoryEmissionAggregateDTO(
            UPPER(TRIM(a.category)), SUM(a.co2eKg)
        )
        FROM ActivityLog a
        WHERE a.logDate BETWEEN :startDate AND :endDate
        GROUP BY UPPER(TRIM(a.category))
        """)
    List<CategoryEmissionAggregateDTO> findCategoryTotalEmissionsBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
        SELECT new com.carbontrack.carbontrackbackend.dto.benchmark.CategoryEmissionAggregateDTO(
            UPPER(TRIM(a.category)), SUM(a.co2eKg)
        )
        FROM ActivityLog a
        WHERE a.user.id = :userId
          AND a.logDate BETWEEN :startDate AND :endDate
        GROUP BY UPPER(TRIM(a.category))
        """)
    List<CategoryEmissionAggregateDTO> findUserCategoryTotalsBetween(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
        SELECT DISTINCT a.logDate
        FROM ActivityLog a
        WHERE a.user.id = :userId
        ORDER BY a.logDate DESC
        """)
    List<LocalDate> findDistinctLogDatesByUserId(@Param("userId") Long userId);

    // Leaderboard: period-based totals. Users without a log in the period are not participants.
    @Query("""
        SELECT new com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardUserAggregateDTO(
            a.user.id, a.user.username, SUM(a.co2eKg), COUNT(a.id)
        )
        FROM ActivityLog a
        WHERE a.logDate BETWEEN :startDate AND :endDate
        GROUP BY a.user.id, a.user.username
        ORDER BY SUM(a.co2eKg) ASC, a.user.username ASC
        """)
    List<LeaderboardUserAggregateDTO> findLeaderboardTotalsBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
        SELECT new com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardUserAggregateDTO(
            a.user.id, a.user.username, SUM(a.co2eKg), COUNT(a.id)
        )
        FROM ActivityLog a
        GROUP BY a.user.id, a.user.username
        ORDER BY SUM(a.co2eKg) ASC, a.user.username ASC
        """)
    List<LeaderboardUserAggregateDTO> findLeaderboardTotalsAllTime();

    @Query("""
        SELECT new com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardCategoryAggregateDTO(
            a.user.id, UPPER(TRIM(a.category)), SUM(a.co2eKg)
        )
        FROM ActivityLog a
        WHERE a.user.id IN :userIds
          AND a.logDate BETWEEN :startDate AND :endDate
        GROUP BY a.user.id, UPPER(TRIM(a.category))
        """)
    List<LeaderboardCategoryAggregateDTO> findLeaderboardCategoryTotalsBetween(
            @Param("userIds") List<Long> userIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
        SELECT new com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardCategoryAggregateDTO(
            a.user.id, UPPER(TRIM(a.category)), SUM(a.co2eKg)
        )
        FROM ActivityLog a
        WHERE a.user.id IN :userIds
        GROUP BY a.user.id, UPPER(TRIM(a.category))
        """)
    List<LeaderboardCategoryAggregateDTO> findLeaderboardCategoryTotalsAllTime(
            @Param("userIds") List<Long> userIds);
}
