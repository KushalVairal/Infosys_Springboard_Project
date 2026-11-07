
package com.carbontrack.carbontrackbackend.dto.analytics;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

public class WeeklyFootprintDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private final LocalDate weekStartDate;
    private final String category;
    private final BigDecimal totalCo2eKg;

    public WeeklyFootprintDTO(
            LocalDate weekStartDate,
            String category,
            BigDecimal totalCo2eKg) {
        this.weekStartDate = weekStartDate;
        this.category = category;
        this.totalCo2eKg = totalCo2eKg;
    }

    public LocalDate getWeekStartDate() {
        return weekStartDate;
    }

    public String getCategory() {
        return category;
    }

    public BigDecimal getTotalCo2eKg() {
        return totalCo2eKg;
    }
}
