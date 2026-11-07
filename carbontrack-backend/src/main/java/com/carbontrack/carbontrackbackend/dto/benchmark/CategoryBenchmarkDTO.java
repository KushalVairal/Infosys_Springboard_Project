package com.carbontrack.carbontrackbackend.dto.benchmark;

import java.math.BigDecimal;

public record CategoryBenchmarkDTO(
        String category,
        BigDecimal userCo2eKg,
        BigDecimal platformAverageCo2eKg
) {
}
