package com.carbontrack.carbontrackbackend.dto.leaderboard;

import java.math.BigDecimal;

public record LeaderboardActivityAggregateDTO(
        Long userId,
        String activityType,
        BigDecimal totalCo2eKg
) {}