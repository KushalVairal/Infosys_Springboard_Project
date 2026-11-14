package com.carbontrack.carbontrackbackend.dto.organisation;

import java.math.BigDecimal;

public record OrganisationCategoryAggregateDTO(
        String category,
        BigDecimal totalCo2eKg,
        long activityCount
) {}

