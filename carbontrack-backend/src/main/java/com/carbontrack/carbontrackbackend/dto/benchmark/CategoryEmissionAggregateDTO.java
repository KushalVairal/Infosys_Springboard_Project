package com.carbontrack.carbontrackbackend.dto.benchmark;

import java.math.BigDecimal;

public record CategoryEmissionAggregateDTO(
        String category,
        BigDecimal totalCo2eKg
) {
}
