package com.carbontrack.carbontrackbackend.dto.leaderboard;

import java.math.BigDecimal;

public record LeaderboardUserAggregateDTO(
        Long userId,
        String username,
        BigDecimal totalCo2eKg,
        Long totalActivities
) {}
