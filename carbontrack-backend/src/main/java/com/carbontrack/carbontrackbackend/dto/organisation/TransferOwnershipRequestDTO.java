package com.carbontrack.carbontrackbackend.dto.organisation;

import jakarta.validation.constraints.NotNull;

public record TransferOwnershipRequestDTO(
        @NotNull(message = "New owner user ID is required")
        Long newOwnerUserId
) {
}

