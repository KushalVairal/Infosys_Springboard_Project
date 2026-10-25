package com.carbontrack.carbontrackbackend.event;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ActivityLoggedEvent(
        Long userId,
        Long activityId,
        LocalDate logDate,
        BigDecimal co2eKg
) {
}
