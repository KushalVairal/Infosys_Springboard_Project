package com.carbontrack.carbontrackbackend.dto.organisation;

import java.time.LocalDateTime;

public record OrganisationInvitationDTO(
        Long id,
        Long organisationId,
        String organisationName,
        String inviteeEmail,
        String status,
        String invitedByUsername,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        LocalDateTime respondedAt
) {}

