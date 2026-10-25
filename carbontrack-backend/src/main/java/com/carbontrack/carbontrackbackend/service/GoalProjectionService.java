package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.goal.GoalProjectionDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.entity.Goal;
import com.carbontrack.carbontrackbackend.entity.GoalAlert;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.GoalAlertRepository;
import com.carbontrack.carbontrackbackend.repository.GoalRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class GoalProjectionService {

    private final GoalRepository goalRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final GoalAlertRepository goalAlertRepository;

    public GoalProjectionService(
            GoalRepository goalRepository,
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository,
            GoalAlertRepository goalAlertRepository) {

        this.goalRepository = goalRepository;
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.goalAlertRepository = goalAlertRepository;
    }

    @Transactional
    public GoalProjectionDTO getProjection(String email, Long goalId) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Goal goal = goalRepository.findByIdAndUserId(
                        goalId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Goal not found"));

        LocalDate today = LocalDate.now();
        LocalDate startDate = goal.getStartDate();
        LocalDate endDate = goal.getEndDate();

        GoalProjectionDTO result = new GoalProjectionDTO();

        result.setGoalId(goal.getId());
        result.setGoalTitle(goal.getTitle());
        result.setTargetCo2eKg(goal.getTargetCo2eKg());
        result.setProjectionDate(today);

        BigDecimal target = goal.getTargetCo2eKg();
        BigDecimal zero = BigDecimal.ZERO.setScale(
                3, RoundingMode.HALF_UP);

        // Goal has not started yet
        if (today.isBefore(startDate)) {

            result.setCurrentCo2eKg(zero);
            result.setRemainingBudgetKg(
                    target.setScale(3, RoundingMode.HALF_UP));
            result.setProjectedEndCo2eKg(null);
            result.setAverageWeeklyCo2eKg(null);
            result.setRecentTrend("INSUFFICIENT_DATA");
            result.setProjectionStatus("INSUFFICIENT_DATA");
            result.setExplanation(
                    "The goal has not started yet. A projection is not available.");
            result.setAlertMessage(null);
            result.setWeeklyEmissions(new ArrayList<>());

            return result;
        }

        // Do not count activities beyond the goal's end date
        LocalDate observedEnd =
                today.isBefore(endDate) ? today : endDate;

        List<ActivityLog> activities =
                activityLogRepository.findActivitiesForWeeklyAggregation(
                        user.getId(), startDate, observedEnd);

        BigDecimal current = zero;

        Map<LocalDate, BigDecimal> dailyTotals = new TreeMap<>();

        for (ActivityLog activity : activities) {

            BigDecimal emission = activity.getCo2eKg() == null
                    ? BigDecimal.ZERO
                    : activity.getCo2eKg();

            current = current.add(emission);

            dailyTotals.merge(
                    activity.getLogDate(),
                    emission,
                    BigDecimal::add);
        }

        current = current.setScale(3, RoundingMode.HALF_UP);

        result.setCurrentCo2eKg(current);

        result.setRemainingBudgetKg(
                target.subtract(current)
                        .setScale(3, RoundingMode.HALF_UP));

        long elapsedDays =
                ChronoUnit.DAYS.between(startDate, observedEnd) + 1;

        // Weekly emissions
        List<GoalProjectionDTO.WeeklyEmissionDTO> weeks =
                buildWeeklyEmissions(
                        startDate, observedEnd, dailyTotals);

        result.setWeeklyEmissions(weeks);

        // Average emissions per week
        BigDecimal averageDaily = current.divide(
                BigDecimal.valueOf(elapsedDays),
                6,
                RoundingMode.HALF_UP);

        BigDecimal averageWeekly = averageDaily
                .multiply(BigDecimal.valueOf(7))
                .setScale(3, RoundingMode.HALF_UP);

        result.setAverageWeeklyCo2eKg(averageWeekly);

        // Project total emissions by the end of the goal period
        long remainingDays = Math.max(
                0,
                ChronoUnit.DAYS.between(observedEnd, endDate));

        BigDecimal projected = current.add(
                averageDaily.multiply(
                        BigDecimal.valueOf(remainingDays)));

        projected = projected.setScale(
                3, RoundingMode.HALF_UP);

        result.setProjectedEndCo2eKg(projected);

        // Recent trend
        String trend = calculateRecentTrend(
                startDate, observedEnd, dailyTotals);

        result.setRecentTrend(trend);

        String status;
        String explanation;
        String alertMessage = null;

        // Require at least 14 days in the goal period
        if (elapsedDays < 14) {

            status = "INSUFFICIENT_DATA";

            explanation =
                    "At least 14 days of goal-period data are needed to assess the recent trend reliably.";

        } else if (target.compareTo(BigDecimal.ZERO) == 0) {

            if (projected.compareTo(BigDecimal.ZERO) <= 0) {

                status = "ON_TRACK";
                explanation =
                        "Your projected emissions are within the zero-emission target.";

                alertMessage =
                        "Great progress! Keep recording your activities and maintaining your low-emission habits.";

            } else {

                status = "OFF_TRACK";
                explanation =
                        "The projected emissions exceed the zero-emission target.";

                alertMessage =
                        "Your projected emissions exceed your target. Review recent activities and consider lower-emission alternatives.";
            }

        } else {

            BigDecimal riskLimit = target.multiply(
                    new BigDecimal("1.10"));

            if (projected.compareTo(target) <= 0) {

                status = "ON_TRACK";

                explanation =
                        "Estimated emissions are within the goal target.";

                alertMessage =
                        "Great work! Your current projection is within your target. Keep up your progress and continue tracking your activities.";

            } else if (projected.compareTo(riskLimit) <= 0) {

                status = "AT_RISK";

                explanation =
                        "Estimated emissions may exceed the target. Consider reducing high-emission activities.";

                alertMessage =
                        "Your current trend may put your goal at risk. Review recent activities and consider lower-emission alternatives.";

            } else {

                status = "OFF_TRACK";

                explanation =
                        "Estimated emissions are more than 10% above the target. A meaningful reduction in future emissions may be needed.";

                alertMessage =
                        "Your projected emissions are significantly above your target. Review your recent activities and adjust your plan.";
            }
        }

        result.setProjectionStatus(status);
        result.setExplanation(explanation);
        result.setAlertMessage(alertMessage);

        // Save one alert per goal and alert type
        if (alertMessage != null) {
            saveAlertIfAbsent(goal, status, alertMessage);
        }

        return result;
    }

    private void saveAlertIfAbsent(
            Goal goal,
            String alertType,
            String message) {

        boolean alreadyExists =
                goalAlertRepository
                        .findByGoalIdAndAlertType(
                                goal.getId(), alertType)
                        .isPresent();

        if (!alreadyExists) {

            GoalAlert alert = new GoalAlert(
                    goal, alertType, message);

            goalAlertRepository.save(alert);
        }
    }

    private List<GoalProjectionDTO.WeeklyEmissionDTO>
    buildWeeklyEmissions(
            LocalDate startDate,
            LocalDate observedEnd,
            Map<LocalDate, BigDecimal> dailyTotals) {

        List<GoalProjectionDTO.WeeklyEmissionDTO> result =
                new ArrayList<>();

        LocalDate weekStart = startDate;

        while (!weekStart.isAfter(observedEnd)) {

            LocalDate weekEnd = weekStart.plusDays(6);

            if (weekEnd.isAfter(observedEnd)) {
                weekEnd = observedEnd;
            }

            BigDecimal total = BigDecimal.ZERO;

            for (Map.Entry<LocalDate, BigDecimal> entry
                    : dailyTotals.entrySet()) {

                LocalDate date = entry.getKey();

                if (!date.isBefore(weekStart)
                        && !date.isAfter(weekEnd)) {

                    total = total.add(entry.getValue());
                }
            }

            result.add(
                    new GoalProjectionDTO.WeeklyEmissionDTO(
                            weekStart,
                            weekEnd,
                            total.setScale(
                                    3, RoundingMode.HALF_UP)));

            weekStart = weekEnd.plusDays(1);
        }

        return result;
    }

    private String calculateRecentTrend(
            LocalDate startDate,
            LocalDate observedEnd,
            Map<LocalDate, BigDecimal> dailyTotals) {

        long elapsedDays =
                ChronoUnit.DAYS.between(
                        startDate, observedEnd) + 1;

        if (elapsedDays < 14) {
            return "INSUFFICIENT_DATA";
        }

        LocalDate recentStart = observedEnd.minusDays(6);
        LocalDate previousStart = observedEnd.minusDays(13);
        LocalDate previousEnd = observedEnd.minusDays(7);

        BigDecimal recent = sumBetween(
                dailyTotals, recentStart, observedEnd);

        BigDecimal previous = sumBetween(
                dailyTotals, previousStart, previousEnd);

        if (previous.compareTo(BigDecimal.ZERO) == 0) {

            if (recent.compareTo(BigDecimal.ZERO) == 0) {
                return "STABLE";
            }

            return "INCREASING";
        }

        BigDecimal changePercent = recent
                .subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        if (changePercent.compareTo(
                new BigDecimal("5")) > 0) {
            return "INCREASING";
        }

        if (changePercent.compareTo(
                new BigDecimal("-5")) < 0) {
            return "DECREASING";
        }

        return "STABLE";
    }

    private BigDecimal sumBetween(
            Map<LocalDate, BigDecimal> dailyTotals,
            LocalDate start,
            LocalDate end) {

        BigDecimal total = BigDecimal.ZERO;

        for (Map.Entry<LocalDate, BigDecimal> entry
                : dailyTotals.entrySet()) {

            LocalDate date = entry.getKey();

            if (!date.isBefore(start)
                    && !date.isAfter(end)) {

                total = total.add(entry.getValue());
            }
        }

        return total;
    }
}
