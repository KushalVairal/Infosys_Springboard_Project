package com.carbontrack.carbontrackbackend.dto.analytics;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public record CategoryOverviewDTO(
        String category,
        String displayName,
        BigDecimal currentPeriodCo2eKg,
        BigDecimal previousPeriodCo2eKg,
        BigDecimal trendPercentage,
        String trendStatus,
        long activityCount,
        BigDecimal configuredGoalTargetKg,
        BigDecimal activeGoalRemainingKg,
        String goalStatus,
        boolean isHighEmission,
        String highEmissionReason,
        String reductionOpportunity,
        boolean hasActiveGoal,
        Long activeGoalId,
        String includedTypes
) {
    // Aliases to guarantee backward and cross-component frontend compatibility
    @JsonProperty("current30DayEmissionsKg")
    public BigDecimal current30DayEmissionsKg() {
        return currentPeriodCo2eKg != null ? currentPeriodCo2eKg : BigDecimal.ZERO;
    }

    @JsonProperty("prior30DayEmissionsKg")
    public BigDecimal prior30DayEmissionsKg() {
        return previousPeriodCo2eKg != null ? previousPeriodCo2eKg : BigDecimal.ZERO;
    }

    @JsonProperty("activeGoalTargetKg")
    public BigDecimal activeGoalTargetKg() {
        return configuredGoalTargetKg;
    }
}
