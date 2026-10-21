
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationItemDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationResponseDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class RecommendationService {

    private static final int PERIOD_DAYS = 30;
    private static final int MAX_RECOMMENDATIONS = 3;

    private final ActivityLogRepository activityLogRepository;

    public RecommendationService(
            ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional(readOnly = true)
    public RecommendationResponseDTO getWeeklyRecommendations(
            Long userId) {

        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException(
                    "A valid user ID is required.");
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(PERIOD_DAYS - 1);

        List<ActivityLog> activities =
                activityLogRepository.findActivitiesForWeeklyAggregation(
                        userId, startDate, endDate);

        Map<String, BigDecimal> emissionsByActivityType =
                new HashMap<>();

        for (ActivityLog activity : activities) {
            String activityType = activity.getActivityType();

            if (activityType == null || activity.getCo2eKg() == null) {
                continue;
            }

            activityType = activityType.trim()
                    .toUpperCase(Locale.ROOT);

            if (activityType.isBlank()) {
                continue;
            }

            emissionsByActivityType.merge(
                    activityType,
                    activity.getCo2eKg(),
                    BigDecimal::add);
        }

        List<RecommendationItemDTO> recommendations =
                new ArrayList<>();

        emissionsByActivityType.entrySet().stream()
                .sorted(
                        Map.Entry.<String, BigDecimal>comparingByValue(
                                        Comparator.reverseOrder())
                                .thenComparing(Map.Entry::getKey))
                .limit(MAX_RECOMMENDATIONS)
                .forEach(entry -> recommendations.add(
                        new RecommendationItemDTO(
                                entry.getKey(),
                                entry.getValue(),
                                getTips(entry.getKey()))));

        return new RecommendationResponseDTO(
                PERIOD_DAYS,
                recommendations);
    }

    private List<String> getTips(String activityType) {
        return switch (activityType) {
            case "CAR_PETROL", "CAR_DIESEL", "CAR_GASOLINE" ->
                    List.of(
                            "Consider public transport for suitable regular journeys.",
                            "Combine nearby errands into one trip.",
                            "Consider walking or cycling for short, safe journeys."
                    );

            case "MOTORCYCLE", "MOTORBIKE" ->
                    List.of(
                            "Combine nearby errands to reduce separate trips.",
                            "Consider walking, cycling, or public transport for suitable journeys."
                    );

            case "ELECTRICITY", "ELECTRICITY_CONSUMPTION" ->
                    List.of(
                            "Switch off lights and appliances when they are not needed.",
                            "Use energy-efficient lighting and appliances where practical.",
                            "Reduce unnecessary heating and cooling."
                    );

            case "FLIGHT", "AIR_TRAVEL" ->
                    List.of(
                            "Consider rail or virtual meetings when practical alternatives exist.",
                            "Combine trips when possible to avoid separate journeys."
                    );

            case "BUS", "PUBLIC_TRANSPORT", "TRAIN" ->
                    List.of(
                            "Continue considering public transport for suitable journeys.",
                            "Combine errands to reduce the number of trips."
                    );


            case "MEAT", "BEEF", "FOOD", "FOOD_CONSUMPTION",
                 "FOOD_VEGETARIAN" ->
                    List.of(
                            "Plan meals to reduce avoidable food waste.",
                            "Choose seasonal foods when practical.",
                            "Consider locally available foods when suitable."
                    );


            case "SHOPPING", "CLOTHING", "ELECTRONICS" ->
                    List.of(
                            "Consider repairing or reusing items before replacing them.",
                            "Choose durable products that meet your needs.",
                            "Consider second-hand items when suitable."
                    );

            default -> List.of(
                    "Review this activity to identify practical ways to reduce its environmental impact.",
                    "Consider lower-emission alternatives where they are suitable."
            );
        };
    }
}
