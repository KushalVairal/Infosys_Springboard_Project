
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.analytics.CategoryOverviewDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationItemDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationResponseDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.StartActionRequestDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.entity.Goal;
import com.carbontrack.carbontrackbackend.entity.Recommendation;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.GoalRepository;
import com.carbontrack.carbontrackbackend.repository.RecommendationRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RecommendationRepository recommendationRepository;

    @Mock
    private GoalRepository goalRepository;

    @InjectMocks
    private RecommendationService recommendationService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        ReflectionTestUtils.setField(user, "id", 1L);
        user.setUsername("ecowarrior");
        user.setEmail("eco@example.com");
    }

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

    @Test
    void shouldGenerateRecommendationsAndPersistWithoutDuplicates() {
        when(userRepository.findByEmail("eco@example.com")).thenReturn(Optional.of(user));

        ActivityLog petrolLog = mock(ActivityLog.class);
        when(petrolLog.getActivityType()).thenReturn("CAR_PETROL");
        when(petrolLog.getCategory()).thenReturn("TRANSPORT");
        when(petrolLog.getCo2eKg()).thenReturn(new BigDecimal("45.0"));

        when(activityLogRepository.findActivitiesForWeeklyAggregation(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(petrolLog));

        when(recommendationRepository.existsByUserIdAndTitleAndStatusIn(eq(1L), anyString(), any()))
                .thenReturn(false);

        when(recommendationRepository.save(any(Recommendation.class))).thenAnswer(i -> {
            Recommendation r = i.getArgument(0);
            ReflectionTestUtils.setField(r, "id", 101L);
            return r;
        });

        when(recommendationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(1L, "ACTIVE"))
                .thenAnswer(i -> {
                    Recommendation rec = new Recommendation();
                    ReflectionTestUtils.setField(rec, "id", 101L);
                    rec.setUser(user);
                    rec.setCategory("TRANSPORT");
                    rec.setActivityType("CAR_PETROL");
                    rec.setTitle("Opt for Public Transit or Carpooling for Commutes");
                    rec.setObservation("Logged 45.0 kg CO2e from petrol car travel");
                    rec.setActionDescription("Replace 2 car trips/week");
                    rec.setEstimatedSavingsKg(new BigDecimal("9.00"));
                    rec.setStatus("ACTIVE");
                    return List.of(rec);
                });

        List<RecommendationDTO> result = recommendationService.getPersonalizedRecommendations("eco@example.com", "ALL", "ACTIVE");

        assertNotNull(result);
        assertFalse(result.isEmpty());
        RecommendationDTO item = result.get(0);
        assertEquals("TRANSPORT", item.category());
        assertEquals("ACTIVE", item.status());
        assertEquals(new BigDecimal("9.00"), item.estimatedSavingsKg());
        verify(recommendationRepository, atLeastOnce()).save(any(Recommendation.class));
    }

    @Test
    void shouldStartActionAndConnectGoalSuccessfully() {
        when(userRepository.findByEmail("eco@example.com")).thenReturn(Optional.of(user));

        Recommendation rec = new Recommendation();
        ReflectionTestUtils.setField(rec, "id", 50L);
        rec.setUser(user);
        rec.setCategory("ENERGY");
        rec.setTitle("Switch to LED bulbs");
        rec.setEstimatedSavingsKg(new BigDecimal("10.00"));
        rec.setStatus("ACTIVE");

        when(recommendationRepository.findByIdAndUserId(50L, 1L))
                .thenReturn(Optional.of(rec));

        when(goalRepository.save(any(Goal.class))).thenAnswer(i -> {
            Goal g = i.getArgument(0);
            ReflectionTestUtils.setField(g, "id", 77L);
            return g;
        });

        when(recommendationRepository.save(any(Recommendation.class))).thenAnswer(i -> i.getArgument(0));

        StartActionRequestDTO req = new StartActionRequestDTO(
                "Reduce Home Energy by 15kg",
                new BigDecimal("45.0"),
                "WEEKLY",
                14
        );

        RecommendationDTO updated = recommendationService.startAction("eco@example.com", 50L, req);

        assertEquals("IN_PROGRESS", updated.status());
        assertEquals(77L, updated.connectedGoalId());
        verify(goalRepository).save(any(Goal.class));
        verify(recommendationRepository).save(rec);
    }

    @Test
    void shouldUpdateRecommendationStatusToDismissed() {
        when(userRepository.findByEmail("eco@example.com")).thenReturn(Optional.of(user));

        Recommendation rec = new Recommendation();
        ReflectionTestUtils.setField(rec, "id", 60L);
        rec.setUser(user);
        rec.setStatus("ACTIVE");

        when(recommendationRepository.findByIdAndUserId(60L, 1L))
                .thenReturn(Optional.of(rec));
        when(recommendationRepository.save(any(Recommendation.class)))
                .thenAnswer(i -> i.getArgument(0));

        RecommendationDTO result = recommendationService.updateStatus("eco@example.com", 60L, "DISMISSED");

        assertEquals("DISMISSED", result.status());
        verify(recommendationRepository).save(rec);
    }

    @Test
    void shouldComputeCategoryOverviewAccurately() {
        when(userRepository.findByEmail("eco@example.com")).thenReturn(Optional.of(user));

        ActivityLog currLog = mock(ActivityLog.class);
        when(currLog.getCategory()).thenReturn("TRANSPORT");
        when(currLog.getCo2eKg()).thenReturn(new BigDecimal("50.0"));

        ActivityLog prevLog = mock(ActivityLog.class);
        when(prevLog.getCategory()).thenReturn("TRANSPORT");
        when(prevLog.getCo2eKg()).thenReturn(new BigDecimal("40.0"));

        when(activityLogRepository.findActivitiesForWeeklyAggregation(
                eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(currLog))
                .thenReturn(List.of(prevLog));

        when(goalRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());

        List<CategoryOverviewDTO> overview = recommendationService.getCategoryOverview("eco@example.com");

        assertNotNull(overview);
        assertFalse(overview.isEmpty());

        CategoryOverviewDTO transport = overview.stream()
                .filter(o -> "TRANSPORT".equals(o.category()))
                .findFirst()
                .orElse(null);

        assertNotNull(transport);
        assertEquals(new BigDecimal("50.000"), transport.currentPeriodCo2eKg());
        assertEquals(new BigDecimal("40.000"), transport.previousPeriodCo2eKg());
        assertEquals(new BigDecimal("25.0"), transport.trendPercentage()); // (50-40)/40 * 100 = 25%
        assertTrue(transport.isHighEmission());
        assertNotNull(transport.includedTypes());
        assertEquals(new BigDecimal("50.000"), transport.current30DayEmissionsKg());
        assertEquals(new BigDecimal("40.000"), transport.prior30DayEmissionsKg());
    }

    @Test
    void shouldReturnEmptyListForUnusedCategoryFilterWithoutError() {
        when(userRepository.findByEmail("eco@example.com")).thenReturn(Optional.of(user));
        when(activityLogRepository.findActivitiesForWeeklyAggregation(eq(1L), any(), any()))
                .thenReturn(List.of());

        when(recommendationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(1L, "ACTIVE"))
                .thenReturn(List.of());

        List<RecommendationDTO> result = recommendationService.getPersonalizedRecommendations(
                "eco@example.com", "WATER", "ACTIVE");

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void shouldNotRecreateDismissedRecommendationWhenChangingFilters() {
        when(userRepository.findByEmail("eco@example.com")).thenReturn(Optional.of(user));

        ActivityLog petrolLog = mock(ActivityLog.class);
        when(petrolLog.getActivityType()).thenReturn("CAR_PETROL");
        when(petrolLog.getCategory()).thenReturn("TRANSPORT");
        when(petrolLog.getCo2eKg()).thenReturn(new BigDecimal("45.0"));

        when(activityLogRepository.findActivitiesForWeeklyAggregation(eq(1L), any(), any()))
                .thenReturn(List.of(petrolLog));

        // When recommendations already exist as DISMISSED / COMPLETED, existsByUserIdAndTitleAndStatusIn returns true
        when(recommendationRepository.existsByUserIdAndTitleAndStatusIn(
                eq(1L), anyString(), any()))
                .thenReturn(true);

        when(recommendationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(1L, "ACTIVE"))
                .thenReturn(List.of());

        List<RecommendationDTO> activeRecs = recommendationService.getPersonalizedRecommendations(
                "eco@example.com", "TRANSPORT", "ACTIVE");

        assertNotNull(activeRecs);
        assertTrue(activeRecs.isEmpty());
        // Verify no new recommendation was saved
        verify(recommendationRepository, never()).save(any(Recommendation.class));
    }
}

