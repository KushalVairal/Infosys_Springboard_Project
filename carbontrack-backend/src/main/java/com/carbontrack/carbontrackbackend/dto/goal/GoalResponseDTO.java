
package com.carbontrack.carbontrackbackend.dto.goal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class GoalResponseDTO {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String period;
    private BigDecimal baselineCo2eKg;
    private BigDecimal reductionPercentage;
    private BigDecimal targetCo2eKg;
    private BigDecimal currentCo2eKg;
    private BigDecimal remainingAllowanceKg;
    private Double percentageConsumed;
    private Double progressPercentage;
    private boolean isWithinLimit;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private boolean completed;
    private boolean overdue;
    private String includedCategories;
    private LocalDateTime createdAt;

    public GoalResponseDTO() {
    }

    public GoalResponseDTO(
            Long id,
            String title,
            String description,
            BigDecimal baselineCo2eKg,
            BigDecimal reductionPercentage,
            BigDecimal targetCo2eKg,
            BigDecimal currentCo2eKg,
            Double progressPercentage,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            boolean completed,
            boolean overdue,
            LocalDateTime createdAt) {
        this(id, title, description, "ALL", "CUSTOM", baselineCo2eKg, reductionPercentage, targetCo2eKg,
                currentCo2eKg, targetCo2eKg != null && currentCo2eKg != null ? targetCo2eKg.subtract(currentCo2eKg) : BigDecimal.ZERO,
                targetCo2eKg != null && targetCo2eKg.compareTo(BigDecimal.ZERO) > 0 && currentCo2eKg != null
                        ? currentCo2eKg.divide(targetCo2eKg, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue() : 0.0,
                progressPercentage,
                targetCo2eKg != null && currentCo2eKg != null && currentCo2eKg.compareTo(targetCo2eKg) <= 0,
                startDate, endDate, status, completed, overdue, "All Categories", createdAt);
    }

    public GoalResponseDTO(
            Long id,
            String title,
            String description,
            String category,
            String period,
            BigDecimal baselineCo2eKg,
            BigDecimal reductionPercentage,
            BigDecimal targetCo2eKg,
            BigDecimal currentCo2eKg,
            BigDecimal remainingAllowanceKg,
            Double percentageConsumed,
            Double progressPercentage,
            boolean isWithinLimit,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            boolean completed,
            boolean overdue,
            String includedCategories,
            LocalDateTime createdAt) {

        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category != null ? category : "ALL";
        this.period = period != null ? period : "CUSTOM";
        this.baselineCo2eKg = baselineCo2eKg;
        this.reductionPercentage = reductionPercentage;
        this.targetCo2eKg = targetCo2eKg;
        this.currentCo2eKg = currentCo2eKg;
        this.remainingAllowanceKg = remainingAllowanceKg;
        this.percentageConsumed = percentageConsumed;
        this.progressPercentage = progressPercentage;
        this.isWithinLimit = isWithinLimit;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.completed = completed;
        this.overdue = overdue;
        this.includedCategories = includedCategories;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public BigDecimal getRemainingAllowanceKg() { return remainingAllowanceKg; }
    public void setRemainingAllowanceKg(BigDecimal remainingAllowanceKg) { this.remainingAllowanceKg = remainingAllowanceKg; }

    public Double getPercentageConsumed() { return percentageConsumed; }
    public void setPercentageConsumed(Double percentageConsumed) { this.percentageConsumed = percentageConsumed; }

    public boolean isWithinLimit() { return isWithinLimit; }
    public void setWithinLimit(boolean withinLimit) { isWithinLimit = withinLimit; }

    public String getIncludedCategories() { return includedCategories; }
    public void setIncludedCategories(String includedCategories) { this.includedCategories = includedCategories; }

    public BigDecimal getBaselineCo2eKg() { return baselineCo2eKg; }
    public void setBaselineCo2eKg(BigDecimal value) {
        this.baselineCo2eKg = value;
    }

    public BigDecimal getReductionPercentage() {
        return reductionPercentage;
    }
    public void setReductionPercentage(BigDecimal value) {
        this.reductionPercentage = value;
    }

    public BigDecimal getTargetCo2eKg() { return targetCo2eKg; }
    public void setTargetCo2eKg(BigDecimal value) {
        this.targetCo2eKg = value;
    }

    public BigDecimal getCurrentCo2eKg() { return currentCo2eKg; }
    public void setCurrentCo2eKg(BigDecimal value) {
        this.currentCo2eKg = value;
    }

    public Double getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Double value) {
        this.progressPercentage = value;
    }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public boolean isOverdue() { return overdue; }
    public void setOverdue(boolean overdue) {
        this.overdue = overdue;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
