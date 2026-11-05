package com.carbontrack.carbontrackbackend.dto.leaderboard;

import java.math.BigDecimal;

public record CategoryStrengthDTO(
        String category,
        BigDecimal totalCo2eKg,
        boolean belowCommunityAverage
) {}
