package com.carbontrack.carbontrackbackend.dto.organisation;

import java.time.LocalDateTime;

public record OrganisationMemberDTO(
        Long userId,
        String username,
        String email,
        String fullName,
        String role,
        LocalDateTime joinedAt,
        String avatarSeed
) {
    public OrganisationMemberDTO(
            Long userId,
            String username,
            String email,
            String fullName,
            String role,
            LocalDateTime joinedAt) {
        this(userId, username, email, fullName, role, joinedAt, null);
    }
}

