package com.carbontrack.carbontrackbackend.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatMessageDTO(
        @NotBlank @Size(max = 16) String role,
        @NotBlank @Size(max = 4000) String content
) {
}
