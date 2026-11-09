package com.carbontrack.carbontrackbackend.dto.chat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChatRequestDTO(
        @NotNull @Size(min = 1, max = 20) List<@Valid ChatMessageDTO> messages
) {
}
