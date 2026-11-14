package com.carbontrack.carbontrackbackend.dto.organisation;

import java.math.BigDecimal;

public record OrganisationTrendDTO(
        int year,
        int month,
        String periodLabel,
        BigDecimal totalCo2eKg,
        long activeEmployees,
        long totalActivities,
        BigDecimal changePercentage
) {}

