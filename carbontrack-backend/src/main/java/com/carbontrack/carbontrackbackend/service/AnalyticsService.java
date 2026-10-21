
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.analytics.FootprintAggregateDTO;
import com.carbontrack.carbontrackbackend.dto.analytics.MonthlyFootprintDTO;
import com.carbontrack.carbontrackbackend.dto.analytics.WeeklyFootprintDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class AnalyticsService {

    private final ActivityLogRepository activityLogRepository;

    public AnalyticsService(
            ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @Cacheable(
            cacheNames = "dailyFootprint",
            key = "#userId + ':' + #startDate + ':' + #endDate"
    )
    @Transactional(readOnly = true)
    public List<FootprintAggregateDTO> getDailyFootprint(
            Long userId,
            LocalDate startDate,
            LocalDate endDate) {

        validateRequest(userId, startDate, endDate);

        return activityLogRepository.aggregateDailyFootprint(
                userId, startDate, endDate);
    }

    @Cacheable(
            cacheNames = "weeklyFootprint",
            key = "#userId + ':' + #startDate + ':' + #endDate"
    )
    @Transactional(readOnly = true)
    public List<WeeklyFootprintDTO> getWeeklyFootprint(
            Long userId,
            LocalDate startDate,
            LocalDate endDate) {

        validateRequest(userId, startDate, endDate);

        List<ActivityLog> activities =
                activityLogRepository.findActivitiesForWeeklyAggregation(
                        userId, startDate, endDate);

        Map<String, BigDecimal> totals = new TreeMap<>();

        for (ActivityLog activity : activities) {
            LocalDate weekStart = activity.getLogDate()
                    .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

            String key = weekStart + "|" + activity.getCategory();

            totals.merge(
                    key,
                    activity.getCo2eKg(),
                    BigDecimal::add);
        }

        return totals.entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split("\\|", 2);

                    return new WeeklyFootprintDTO(
                            LocalDate.parse(parts[0]),
                            parts[1],
                            entry.getValue());
                })
                .toList();
    }

    @Cacheable(
            cacheNames = "monthlyFootprint",
            key = "#userId + ':' + #startDate + ':' + #endDate"
    )
    @Transactional(readOnly = true)
    public List<MonthlyFootprintDTO> getMonthlyFootprint(
            Long userId,
            LocalDate startDate,
            LocalDate endDate) {

        validateRequest(userId, startDate, endDate);

        List<ActivityLog> activities =
                activityLogRepository.findActivitiesForWeeklyAggregation(
                        userId, startDate, endDate);

        Map<String, BigDecimal> totals = new TreeMap<>();

        for (ActivityLog activity : activities) {
            LocalDate monthStart = activity.getLogDate()
                    .withDayOfMonth(1);

            String key = monthStart + "|" + activity.getCategory();

            totals.merge(
                    key,
                    activity.getCo2eKg(),
                    BigDecimal::add);
        }

        return totals.entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split("\\|", 2);

                    return new MonthlyFootprintDTO(
                            LocalDate.parse(parts[0]),
                            parts[1],
                            entry.getValue());
                })
                .toList();
    }

    private void validateRequest(
            Long userId,
            LocalDate startDate,
            LocalDate endDate) {

        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException(
                    "A valid user ID is required.");
        }

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException(
                    "Start date and end date are required.");
        }

        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "Start date must not be after end date.");
        }
    }
}
