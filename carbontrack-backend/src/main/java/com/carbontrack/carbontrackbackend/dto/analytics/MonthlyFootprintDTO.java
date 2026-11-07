
package com.carbontrack.carbontrackbackend.dto.analytics;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

public class MonthlyFootprintDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private final LocalDate monthStartDate;
    private final String category;
    private final BigDecimal totalCo2eKg;

    public MonthlyFootprintDTO(
            LocalDate monthStartDate,
            String category,
            BigDecimal totalCo2eKg) {
        this.monthStartDate = monthStartDate;
        this.category = category;
        this.totalCo2eKg = totalCo2eKg;
    }

    public LocalDate getMonthStartDate() {
        return monthStartDate;
    }

    public String getCategory() {
        return category;
    }

    public BigDecimal getTotalCo2eKg() {
        return totalCo2eKg;
    }
}
