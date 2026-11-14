package com.carbontrack.carbontrackbackend.dto.recommendation;

import java.math.BigDecimal;

public record StartActionRequestDTO(
        String goalTitle,
        BigDecimal targetCo2eKg,
        String period,
        Integer durationDays
) {
}

