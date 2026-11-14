package com.carbontrack.carbontrackbackend.dto.organisation;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateInvitationRequestDTO(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email
) {}

