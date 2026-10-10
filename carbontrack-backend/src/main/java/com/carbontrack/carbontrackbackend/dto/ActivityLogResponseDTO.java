
package com.carbontrack.carbontrackbackend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ActivityLogResponseDTO(
        Long id,
        String category,
        String activityType,
        BigDecimal quantity,
        String unit,
        BigDecimal co2eKg,
        LocalDate logDate,
        LocalDateTime createdAt
) {}