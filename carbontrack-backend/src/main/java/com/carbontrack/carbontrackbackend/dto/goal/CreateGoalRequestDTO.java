
package com.carbontrack.carbontrackbackend.dto.goal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateGoalRequestDTO {

    @NotBlank(message = "Goal title is required")
    @Size(max = 150, message = "Goal title cannot exceed 150 characters")
    private String title;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotNull(message = "Baseline CO2e is required")
    @DecimalMin(value = "0.001", message = "Baseline must be greater than zero")
    private BigDecimal baselineCo2eKg;

    @NotNull(message = "Reduction percentage is required")
    @DecimalMin(value = "0.01", message = "Reduction must be at least 0.01%")
    @DecimalMax(value = "100.00", message = "Reduction cannot exceed 100%")
    private BigDecimal reductionPercentage;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    public CreateGoalRequestDTO() {
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getBaselineCo2eKg() { return baselineCo2eKg; }
    public void setBaselineCo2eKg(BigDecimal baselineCo2eKg) {
        this.baselineCo2eKg = baselineCo2eKg;
    }

    public BigDecimal getReductionPercentage() {
        return reductionPercentage;
    }
    public void setReductionPercentage(BigDecimal reductionPercentage) {
        this.reductionPercentage = reductionPercentage;
    }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}
