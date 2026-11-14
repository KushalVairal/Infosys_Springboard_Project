package com.carbontrack.carbontrackbackend.dto.organisation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateOrganisationRequestDTO(
        @NotBlank(message = "Organisation name is required")
        @Size(min = 2, max = 150, message = "Organisation name must be between 2 and 150 characters")
        String name,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description,

        @Pattern(regexp = "(?i)^(PUBLIC|PRIVATE)$", message = "Visibility must be PUBLIC or PRIVATE")
        String visibility
) {
}

