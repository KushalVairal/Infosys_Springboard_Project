
package com.carbontrack.carbontrackbackend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ActivityLogRequestDTO(
        String category,
        String activityType,
        BigDecimal quantity,
        String unit,
        LocalDate logDate
) {}