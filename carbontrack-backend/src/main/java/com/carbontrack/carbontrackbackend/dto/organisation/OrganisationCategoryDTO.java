package com.carbontrack.carbontrackbackend.dto.organisation;

import java.math.BigDecimal;

public record OrganisationCategoryDTO(
        String category,
        BigDecimal totalCo2eKg,
        BigDecimal percentage,
        long activityCount
) {}

