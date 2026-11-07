package com.carbontrack.carbontrackbackend.dto.recommendation;

import java.util.List;

public record RecommendationResponseDTO(
        int periodDays,
        List<RecommendationItemDTO> recommendations
) {
}