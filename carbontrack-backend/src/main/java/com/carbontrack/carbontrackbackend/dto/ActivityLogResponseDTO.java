
package com.carbontrack.carbontrackbackend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ActivityLogResponseDTO {

    private Long id;
    private String category;
    private String activityType;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal co2eKg;
    private LocalDate logDate;

    public ActivityLogResponseDTO(
            Long id,
            String category,
            String activityType,
            BigDecimal quantity,
            String unit,
            BigDecimal co2eKg,
            LocalDate logDate) {
        this.id = id;
        this.category = category;
        this.activityType = activityType;
        this.quantity = quantity;
        this.unit = unit;
        this.co2eKg = co2eKg;
        this.logDate = logDate;
    }

    public Long getId() {
        return id;
    }

    public String getCategory() {
        return category;
    }

    public String getActivityType() {
        return activityType;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public String getUnit() {
        return unit;
    }

    public BigDecimal getCo2eKg() {
        return co2eKg;
    }

    public LocalDate getLogDate() {
        return logDate;
    }
}
