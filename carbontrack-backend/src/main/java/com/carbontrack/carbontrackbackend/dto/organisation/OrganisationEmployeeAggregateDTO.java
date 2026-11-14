package com.carbontrack.carbontrackbackend.dto.organisation;

import java.math.BigDecimal;

public record OrganisationEmployeeAggregateDTO(
        Long userId,
        String username,
        String fullName,
        BigDecimal totalCo2eKg,
        long totalActivities
) {}

