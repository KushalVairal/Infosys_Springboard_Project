
package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserAchievementRepository
        extends JpaRepository<UserAchievement, Long> {

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
}
