package com.carbontrack.carbontrackbackend.dto.leaderboard;

import java.math.BigDecimal;
import java.util.List;

public record LeaderboardEntryDTO(
        int rank,
        String username,
        BigDecimal totalCo2eKg,
        Long totalActivities,
        List<LeaderboardBadgeDTO> badges,
        List<CategoryStrengthDTO> categoryStrengths,
        List<String> habitTips
) {}
