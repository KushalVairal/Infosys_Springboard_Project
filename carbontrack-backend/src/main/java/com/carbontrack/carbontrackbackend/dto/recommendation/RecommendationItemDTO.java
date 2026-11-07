package com.carbontrack.carbontrackbackend.dto.recommendation;

import java.math.BigDecimal;
import java.util.List;

public record RecommendationItemDTO(
        String activityType,
        BigDecimal totalCo2eKg,
        List<String> tips
) {
}