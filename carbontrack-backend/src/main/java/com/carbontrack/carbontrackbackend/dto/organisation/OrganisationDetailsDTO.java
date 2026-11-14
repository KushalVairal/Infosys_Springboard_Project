package com.carbontrack.carbontrackbackend.dto.organisation;

import java.time.LocalDateTime;

public record OrganisationDetailsDTO(
        Long id,
        String name,
        String description,
        String visibility,
        Long creatorUserId,
        String creatorUsername,
        boolean isCreator,
        boolean isAdmin,
        long memberCount,
        LocalDateTime createdAt
) {
}

