package com.carbontrack.carbontrackbackend.dto.recommendation;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RecommendationDTO(
        Long id,
        String category,
        String activityType,
        String title,
        String observation,
        String actionDescription,
        String priority,
        String difficulty,
        BigDecimal estimatedSavingsKg,
        String savingsAssumptions,
        String timeframe,
        String status,
        Long connectedGoalId,
        LocalDateTime createdAt
) {
}

