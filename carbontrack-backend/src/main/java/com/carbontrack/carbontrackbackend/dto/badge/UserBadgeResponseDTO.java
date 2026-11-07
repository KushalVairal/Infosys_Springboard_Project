package com.carbontrack.carbontrackbackend.dto.badge;

import java.time.LocalDateTime;

public record UserBadgeResponseDTO(
        Long badgeId,
        String name,
        String description,
        String iconUrl,
        LocalDateTime awardedAt
) {
}
