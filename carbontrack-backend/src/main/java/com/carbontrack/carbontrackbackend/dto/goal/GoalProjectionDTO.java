
package com.carbontrack.carbontrackbackend.dto.goal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class GoalProjectionDTO {

    private Long goalId;
    private String goalTitle;

    private BigDecimal targetCo2eKg;
    private BigDecimal currentCo2eKg;
    private BigDecimal remainingBudgetKg;
    private BigDecimal projectedEndCo2eKg;

    private BigDecimal averageWeeklyCo2eKg;
    private String recentTrend;
    private String projectionStatus;
    private String explanation;
    private String alertMessage;

    private LocalDate projectionDate;
    private List<WeeklyEmissionDTO> weeklyEmissions;

    public GoalProjectionDTO() {
    }

    public Long getGoalId() { return goalId; }
    public void setGoalId(Long goalId) { this.goalId = goalId; }

    public String getGoalTitle() { return goalTitle; }
    public void setGoalTitle(String goalTitle) {
        this.goalTitle = goalTitle;
    }

    public BigDecimal getTargetCo2eKg() { return targetCo2eKg; }
    public void setTargetCo2eKg(BigDecimal value) {
        this.targetCo2eKg = value;
    }

    public BigDecimal getCurrentCo2eKg() { return currentCo2eKg; }
    public void setCurrentCo2eKg(BigDecimal value) {
        this.currentCo2eKg = value;
    }

    public BigDecimal getRemainingBudgetKg() { return remainingBudgetKg; }
    public void setRemainingBudgetKg(BigDecimal value) {
        this.remainingBudgetKg = value;
    }

    public BigDecimal getProjectedEndCo2eKg() {
        return projectedEndCo2eKg;
    }
    public void setProjectedEndCo2eKg(BigDecimal value) {
        this.projectedEndCo2eKg = value;
    }

    public BigDecimal getAverageWeeklyCo2eKg() {
        return averageWeeklyCo2eKg;
    }
    public void setAverageWeeklyCo2eKg(BigDecimal value) {
        this.averageWeeklyCo2eKg = value;
    }

    public String getRecentTrend() { return recentTrend; }
    public void setRecentTrend(String recentTrend) {
        this.recentTrend = recentTrend;
    }

    public String getProjectionStatus() { return projectionStatus; }
    public void setProjectionStatus(String value) {
        this.projectionStatus = value;
    }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getAlertMessage() { return alertMessage; }
    public void setAlertMessage(String alertMessage) {
        this.alertMessage = alertMessage;
    }

    public LocalDate getProjectionDate() { return projectionDate; }
    public void setProjectionDate(LocalDate projectionDate) {
        this.projectionDate = projectionDate;
    }

    public List<WeeklyEmissionDTO> getWeeklyEmissions() {
        return weeklyEmissions;
    }
    public void setWeeklyEmissions(List<WeeklyEmissionDTO> value) {
        this.weeklyEmissions = value;
    }

    public static class WeeklyEmissionDTO {
        private LocalDate weekStart;
        private LocalDate weekEnd;
        private BigDecimal totalCo2eKg;

        public WeeklyEmissionDTO() {
        }

        public WeeklyEmissionDTO(
                LocalDate weekStart,
                LocalDate weekEnd,
                BigDecimal totalCo2eKg) {
            this.weekStart = weekStart;
            this.weekEnd = weekEnd;
            this.totalCo2eKg = totalCo2eKg;
        }

        public LocalDate getWeekStart() { return weekStart; }
        public void setWeekStart(LocalDate value) {
            this.weekStart = value;
        }

        public LocalDate getWeekEnd() { return weekEnd; }
        public void setWeekEnd(LocalDate value) {
            this.weekEnd = value;
        }

        public BigDecimal getTotalCo2eKg() { return totalCo2eKg; }
        public void setTotalCo2eKg(BigDecimal value) {
            this.totalCo2eKg = value;
        }
    }
}
