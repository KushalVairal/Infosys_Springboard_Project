
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationItemDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationResponseDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @InjectMocks
    private RecommendationService recommendationService;

    private ActivityLog activity(String type, String emissions) {
        ActivityLog activity = mock(ActivityLog.class);

        when(activity.getActivityType()).thenReturn(type);
        when(activity.getCo2eKg()).thenReturn(new BigDecimal(emissions));

        return activity;
    }

    private void mockActivities(List<ActivityLog> activities) {
        when(activityLogRepository.findActivitiesForWeeklyAggregation(
                eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(activities);
    }

    @Test
    void rankingChangesWhenEmissionTotalsChange() {
        List<ActivityLog> firstHistory = List.of(
                activity("ELECTRICITY", "20"),
                activity("CAR_PETROL", "10")
        );

        List<ActivityLog> secondHistory = List.of(
                activity("CAR_PETROL", "30"),
                activity("ELECTRICITY", "5")
        );

        when(activityLogRepository.findActivitiesForWeeklyAggregation(
                eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(firstHistory)
                .thenReturn(secondHistory);

        RecommendationResponseDTO first =
                recommendationService.getWeeklyRecommendations(1L);

        RecommendationResponseDTO second =
                recommendationService.getWeeklyRecommendations(1L);

        assertEquals(
                "ELECTRICITY",
                first.recommendations().get(0).activityType());

        assertEquals(
                "CAR_PETROL",
                second.recommendations().get(0).activityType());

        assertEquals(
                new BigDecimal("30"),
                second.recommendations().get(0).totalCo2eKg());
    }

    @Test
    void returnsOnlyTopThreeActivityTypes() {
        mockActivities(List.of(
                activity("TYPE_A", "10"),
                activity("TYPE_B", "50"),
                activity("TYPE_C", "30"),
                activity("TYPE_D", "20"),
                activity("TYPE_E", "5")
        ));

        RecommendationResponseDTO response =
                recommendationService.getWeeklyRecommendations(1L);

        assertEquals(3, response.recommendations().size());
        assertEquals(
                List.of("TYPE_B", "TYPE_C", "TYPE_D"),
                response.recommendations().stream()
                        .map(RecommendationItemDTO::activityType)
                        .toList());
    }

    @Test
    void returnsEmptyListWhenThereAreNoActivities() {
        mockActivities(List.of());

        RecommendationResponseDTO response =
                recommendationService.getWeeklyRecommendations(1L);

        assertEquals(30, response.periodDays());
        assertNotNull(response.recommendations());
        assertTrue(response.recommendations().isEmpty());
    }

    @Test
    void returnsOnlyAvailableActivityTypesWhenFewerThanThreeExist() {
        mockActivities(List.of(
                activity("ELECTRICITY", "7"),
                activity("CAR_PETROL", "5")
        ));

        RecommendationResponseDTO response =
                recommendationService.getWeeklyRecommendations(1L);

        assertEquals(2, response.recommendations().size());
        assertEquals(
                "ELECTRICITY",
                response.recommendations().get(0).activityType());
        assertEquals(
                "CAR_PETROL",
                response.recommendations().get(1).activityType());
    }

    @Test
    void foodVegetarianReceivesSpecificTips() {
        mockActivities(List.of(
                activity("FOOD_VEGETARIAN", "6.4")
        ));

        RecommendationResponseDTO response =
                recommendationService.getWeeklyRecommendations(1L);

        RecommendationItemDTO recommendation =
                response.recommendations().get(0);

        assertEquals("FOOD_VEGETARIAN", recommendation.activityType());
        assertFalse(recommendation.tips().isEmpty());
        assertTrue(recommendation.tips().stream().anyMatch(
                tip -> tip.toLowerCase().contains("food waste")));
        assertFalse(recommendation.tips().stream().anyMatch(
                tip -> tip.contains("Review this activity")));
    }
}

