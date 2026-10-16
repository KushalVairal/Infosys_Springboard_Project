package com.carbontrack.carbontrackbackend.dto.goal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class GoalResponseDTO {

    private Long id;
    private String title;
    private String description;
    private BigDecimal targetCo2eKg;
    private BigDecimal currentCo2eKg;
    private Double progressPercentage;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private boolean completed;
    private boolean overdue;
    private LocalDateTime createdAt;

    public GoalResponseDTO() {
    }

    public GoalResponseDTO(
            Long id,
            String title,
            String description,
            BigDecimal targetCo2eKg,
            BigDecimal currentCo2eKg,
            Double progressPercentage,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            boolean completed,
            boolean overdue,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.targetCo2eKg = targetCo2eKg;
        this.currentCo2eKg = currentCo2eKg;
        this.progressPercentage = progressPercentage;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.completed = completed;
        this.overdue = overdue;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public BigDecimal getCurrentCo2eKg() {
        return currentCo2eKg;
    }

    public void setCurrentCo2eKg(BigDecimal currentCo2eKg) {
        this.currentCo2eKg = currentCo2eKg;
    }

    public Double getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(Double progressPercentage) {
        this.progressPercentage = progressPercentage;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public boolean isOverdue() {
        return overdue;
    }

    public void setOverdue(boolean overdue) {
        this.overdue = overdue;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
