package com.carbontrack.carbontrackbackend.dto.goal;

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

    @NotNull(message = "Target CO2e emissions budget is required")
    @DecimalMin(value = "0.001", message = "Target CO2e emissions must be greater than zero")
    private BigDecimal targetCo2eKg;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    public CreateGoalRequestDTO() {
    }

    public CreateGoalRequestDTO(String title, String description, BigDecimal targetCo2eKg, LocalDate startDate, LocalDate endDate) {
        this.title = title;
        this.description = description;
        this.targetCo2eKg = targetCo2eKg;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getTargetCo2eKg() {
        return targetCo2eKg;
    }

    public void setTargetCo2eKg(BigDecimal targetCo2eKg) {
        this.targetCo2eKg = targetCo2eKg;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}
