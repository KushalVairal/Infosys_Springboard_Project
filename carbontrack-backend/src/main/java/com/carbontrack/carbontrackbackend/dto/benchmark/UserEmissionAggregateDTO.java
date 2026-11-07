package com.carbontrack.carbontrackbackend.dto.benchmark;

import java.math.BigDecimal;

public record UserEmissionAggregateDTO(
        Long userId,
        BigDecimal totalCo2eKg
) {
}
