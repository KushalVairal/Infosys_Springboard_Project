package com.carbontrack.carbontrackbackend.dto.achievement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AchievementResponseDTO(
        Long id,
        String achievementType,
        String leaderboardPeriod,
        Integer rankAtClaim,
        BigDecimal emissionsKgAtClaim,
        LocalDate periodStartDate,
        LocalDate periodEndDate,
        LocalDateTime claimedAt
) {}