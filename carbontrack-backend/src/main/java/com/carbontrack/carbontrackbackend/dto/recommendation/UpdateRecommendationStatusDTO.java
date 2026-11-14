package com.carbontrack.carbontrackbackend.dto.recommendation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateRecommendationStatusDTO(
        @NotBlank
        @Pattern(regexp = "ACTIVE|IN_PROGRESS|COMPLETED|DISMISSED", message = "Status must be ACTIVE, IN_PROGRESS, COMPLETED, or DISMISSED")
        String status
) {
}

