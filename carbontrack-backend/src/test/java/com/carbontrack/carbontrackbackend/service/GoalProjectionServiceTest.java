
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

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoalProjectionServiceTest {

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GoalAlertRepository goalAlertRepository;

    @InjectMocks
    private GoalProjectionService goalProjectionService;

    private User user;
    private Goal goal;

    private final LocalDate today = LocalDate.now();

    @BeforeEach
    void setUp() {
        user = mock(User.class);
        when(user.getId()).thenReturn(3L);

        goal = mock(Goal.class);

        when(goal.getId()).thenReturn(8L);
        when(goal.getTitle()).thenReturn("Test goal");

        when(goal.getTargetCo2eKg())
                .thenReturn(new BigDecimal("36.000"));

        when(goal.getStartDate())
                .thenReturn(today.minusDays(20));

        when(goal.getEndDate())
                .thenReturn(today.plusDays(10));

        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(user));

        when(goalRepository.findByIdAndUserId(8L, 3L))
                .thenReturn(Optional.of(goal));

        lenient().when(
        activityLogRepository.findActivitiesForWeeklyAggregation(
                eq(3L),
                any(LocalDate.class),
                any(LocalDate.class)))
        .thenReturn(List.of());
    }

    @Test
    void shouldReturnInsufficientDataForShortGoalPeriod() {
        when(goal.getStartDate())
                .thenReturn(today.minusDays(2));

        GoalProjectionDTO result =
                goalProjectionService.getProjection(
                        "test@example.com",
                        8L
                );

        assertEquals(
                "INSUFFICIENT_DATA",
                result.getProjectionStatus()
        );

        assertEquals(
                "INSUFFICIENT_DATA",
                result.getRecentTrend()
        );

        assertNull(result.getAlertMessage());

        verify(goalAlertRepository, never())
                .save(any(GoalAlert.class));
    }

    @Test
    void shouldReturnOnTrackAndSaveEncouragementAfterEnoughDays() {
        when(goal.getTargetCo2eKg())
                .thenReturn(new BigDecimal("100.000"));

        when(goalAlertRepository.findByGoalIdAndAlertType(
                8L,
                "ON_TRACK"))
                .thenReturn(Optional.empty());

        GoalProjectionDTO result =
                goalProjectionService.getProjection(
                        "test@example.com",
                        8L
                );

        assertEquals(
                "ON_TRACK",
                result.getProjectionStatus()
        );

        assertNotNull(result.getAlertMessage());

        verify(goalAlertRepository)
                .save(any(GoalAlert.class));
    }

    @Test
    void shouldReturnAtRiskAndSaveAlert() {
        when(goal.getTargetCo2eKg())
                .thenReturn(new BigDecimal("10.000"));

        List<ActivityLog> logs = List.of(
                activity(today.minusDays(10), "3.500"),
                activity(today.minusDays(3), "3.500")
        );

        when(activityLogRepository.findActivitiesForWeeklyAggregation(
                eq(3L),
                any(LocalDate.class),
                any(LocalDate.class)))
                .thenReturn(logs);

        when(goalAlertRepository.findByGoalIdAndAlertType(
                8L,
                "AT_RISK"))
                .thenReturn(Optional.empty());

        GoalProjectionDTO result =
                goalProjectionService.getProjection(
                        "test@example.com",
                        8L
                );

        assertEquals(
                "AT_RISK",
                result.getProjectionStatus()
        );

        assertNotNull(result.getAlertMessage());

        verify(goalAlertRepository)
                .save(any(GoalAlert.class));
    }

    @Test
    void shouldReturnOffTrackAndSaveAlert() {
        when(goal.getTargetCo2eKg())
                .thenReturn(new BigDecimal("5.000"));

        List<ActivityLog> logs = List.of(
                activity(today.minusDays(10), "10.000"),
                activity(today.minusDays(3), "10.000")
        );

        when(activityLogRepository.findActivitiesForWeeklyAggregation(
                eq(3L),
                any(LocalDate.class),
                any(LocalDate.class)))
                .thenReturn(logs);

        when(goalAlertRepository.findByGoalIdAndAlertType(
                8L,
                "OFF_TRACK"))
                .thenReturn(Optional.empty());

        GoalProjectionDTO result =
                goalProjectionService.getProjection(
                        "test@example.com",
                        8L
                );

        assertEquals(
                "OFF_TRACK",
                result.getProjectionStatus()
        );

        assertNotNull(result.getAlertMessage());

        verify(goalAlertRepository)
                .save(any(GoalAlert.class));
    }

    @Test
    void shouldNotSaveDuplicateAlert() {
        when(goal.getTargetCo2eKg())
                .thenReturn(new BigDecimal("100.000"));

        GoalAlert existingAlert = mock(GoalAlert.class);

        when(goalAlertRepository.findByGoalIdAndAlertType(
                8L,
                "ON_TRACK"))
                .thenReturn(Optional.of(existingAlert));

        GoalProjectionDTO result =
                goalProjectionService.getProjection(
                        "test@example.com",
                        8L
                );

        assertEquals(
                "ON_TRACK",
                result.getProjectionStatus()
        );

        assertNotNull(result.getAlertMessage());

        verify(goalAlertRepository, never())
                .save(any(GoalAlert.class));
    }

    private ActivityLog activity(
            LocalDate date,
            String emissions
    ) {
        ActivityLog log = mock(ActivityLog.class);

        doReturn(date)
                .when(log)
                .getLogDate();

        doReturn(new BigDecimal(emissions))
                .when(log)
                .getCo2eKg();

        return log;
    }
}
