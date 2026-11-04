package com.carbontrack.carbontrackbackend.dto.leaderboard;

import java.math.BigDecimal;

public record LeaderboardCategoryAggregateDTO(
        Long userId,
        String category,
        BigDecimal totalCo2eKg
) {}