package com.carbontrack.carbontrackbackend.dto;

import com.carbontrack.carbontrackbackend.entity.Category;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateActivityRequest {

    @NotNull(message = "Category is required")
    private Category category;

    @NotBlank(message = "Activity type is required")
    @Size(max = 50)
    private String activityType;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    @Digits(integer = 8, fraction = 4, message = "Quantity must have at most 8 integer and 4 decimal digits")
    private BigDecimal quantity;

    @NotBlank(message = "Unit is required")
    @Size(max = 20)
    private String unit;

    @NotNull(message = "Log date is required")
    @PastOrPresent(message = "Log date cannot be in the future")
    private LocalDate logDate;

    @Size(max = 255)
    private String notes;

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}