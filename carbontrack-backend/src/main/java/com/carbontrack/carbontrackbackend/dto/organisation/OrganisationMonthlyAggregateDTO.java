package com.carbontrack.carbontrackbackend.dto.organisation;

import java.math.BigDecimal;

public record OrganisationMonthlyAggregateDTO(
        Integer year,
        Integer month,
        BigDecimal totalCo2eKg,
        long activeEmployees,
        long totalActivities
) {}

