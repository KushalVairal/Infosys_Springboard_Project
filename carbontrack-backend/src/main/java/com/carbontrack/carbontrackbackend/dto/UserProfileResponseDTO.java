
package com.carbontrack.carbontrackbackend.dto;

import java.time.LocalDateTime;

public record UserProfileResponseDTO(
        Long id,
        String username,
        String email,
        String role,
        String preferredUnit,
        Boolean goalVisibility,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}