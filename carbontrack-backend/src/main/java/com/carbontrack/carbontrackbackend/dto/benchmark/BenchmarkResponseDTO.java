package com.carbontrack.carbontrackbackend.dto.benchmark;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BenchmarkResponseDTO(
        int periodDays,
        LocalDate startDate,
        LocalDate endDate,
        int cohortSize,
        BigDecimal userTotalCo2eKg,
        BigDecimal platformAverageCo2eKg,
        Double ecoPercentile,
        String status,
        String message,
        List<CategoryBenchmarkDTO> categoryBenchmarks
) {
}
