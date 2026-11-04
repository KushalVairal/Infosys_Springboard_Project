package com.carbontrack.carbontrackbackend.dto.emission;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmissionFactorResponseDTO(
        Long id,
        String activityType,
        String unit,
        BigDecimal kgCo2ePerUnit,
        String source,
        LocalDate effectiveDate
) {
}