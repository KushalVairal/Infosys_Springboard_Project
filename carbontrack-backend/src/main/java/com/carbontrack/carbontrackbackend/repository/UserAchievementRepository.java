package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {

    List<UserAchievement> findByUserIdOrderByClaimedAtDesc(Long userId);

    Optional<UserAchievement> findByUserIdAndLeaderboardPeriodAndPeriodStartDate(
            Long userId,
            String leaderboardPeriod,
            LocalDate periodStartDate
    );

    boolean existsByUserIdAndLeaderboardPeriodAndPeriodStartDate(
            Long userId,
            String leaderboardPeriod,
            LocalDate periodStartDate
    );

    Optional<UserAchievement> findByUserIdAndLeaderboardPeriodAndPeriodStartDateAndScope(
            Long userId,
            String leaderboardPeriod,
            LocalDate periodStartDate,
            String scope
    );

    boolean existsByUserIdAndLeaderboardPeriodAndPeriodStartDateAndScope(
            Long userId,
            String leaderboardPeriod,
            LocalDate periodStartDate,
            String scope
    );
}
