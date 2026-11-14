package com.carbontrack.carbontrackbackend.dto.organisation;

import java.time.LocalDateTime;

public record PublicOrganisationDTO(
        Long id,
        String name,
        String description,
        String creatorUsername,
        long memberCount,
        LocalDateTime createdAt
) {
}

