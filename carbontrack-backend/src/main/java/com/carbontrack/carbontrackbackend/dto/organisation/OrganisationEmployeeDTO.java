package com.carbontrack.carbontrackbackend.dto.organisation;

import java.math.BigDecimal;

public record OrganisationEmployeeDTO(
        int rank,
        String username,
        String displayName,
        BigDecimal totalCo2eKg,
        long totalActivities,
        BigDecimal percentageOfOrgEmissions,
        String avatarSeed,
        String profileImageUrl
) {
    public OrganisationEmployeeDTO(
            int rank,
            String username,
            String displayName,
            BigDecimal totalCo2eKg,
            long totalActivities,
            BigDecimal percentageOfOrgEmissions
    ) {
        this(rank, username, displayName, totalCo2eKg, totalActivities, percentageOfOrgEmissions, null, null);
    }
}
