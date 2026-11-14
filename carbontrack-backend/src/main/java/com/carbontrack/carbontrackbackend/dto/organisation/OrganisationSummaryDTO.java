package com.carbontrack.carbontrackbackend.dto.organisation;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OrganisationSummaryDTO(
        Long organisationId,
        String organisationName,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal totalCo2eKg,
        long activeEmployees,
        long totalEmployees,
        long totalActivities,
        BigDecimal currentMonthCo2eKg,
        BigDecimal previousMonthCo2eKg,
        BigDecimal monthOverMonthChangePercentage
) {}

