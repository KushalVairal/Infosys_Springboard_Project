
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.goal.CreateGoalRequestDTO;
import com.carbontrack.carbontrackbackend.dto.goal.GoalResponseDTO;
import com.carbontrack.carbontrackbackend.dto.goal.UpdateGoalRequestDTO;
import com.carbontrack.carbontrackbackend.entity.Goal;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.GoalRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoalServiceTest {

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private UserRepository userRepository;

    private GoalService goalService;
    private User user;

    @BeforeEach
    void setUp() {
        goalService = new GoalService(
                goalRepository,
                activityLogRepository,
                userRepository
        );

        user = new User();
        ReflectionTestUtils.setField(user, "id", 101L);
        user.setUsername("targetsetter");
        user.setEmail("target@example.com");
    }

    private CreateGoalRequestDTO createRequest(
            String title,
            String description,
            String baseline,
            String reduction,
            LocalDate startDate,
            LocalDate endDate) {

        CreateGoalRequestDTO request = new CreateGoalRequestDTO();
        request.setTitle(title);
        request.setDescription(description);
        request.setBaselineCo2eKg(new BigDecimal(baseline));
        request.setReductionPercentage(new BigDecimal(reduction));
        request.setStartDate(startDate);
        request.setEndDate(endDate);
        return request;
    }

    private UpdateGoalRequestDTO updateRequest(
            String title,
            String description,
            String baseline,
            String reduction,
            LocalDate startDate,
            LocalDate endDate,
            String status) {

        UpdateGoalRequestDTO request = new UpdateGoalRequestDTO();
        request.setTitle(title);
        request.setDescription(description);
        request.setBaselineCo2eKg(new BigDecimal(baseline));
        request.setReductionPercentage(new BigDecimal(reduction));
        request.setStartDate(startDate);
        request.setEndDate(endDate);
        request.setStatus(status);
        return request;
    }

    private Goal createGoal(
            Long id,
            String title,
            String baseline,
            String reduction,
            String target,
            LocalDate startDate,
            LocalDate endDate) {

        Goal goal = new Goal();
        ReflectionTestUtils.setField(goal, "id", id);
        goal.setUser(user);
        goal.setTitle(title);
        goal.setBaselineCo2eKg(new BigDecimal(baseline));
        goal.setReductionPercentage(new BigDecimal(reduction));
        goal.setTargetCo2eKg(new BigDecimal(target));
        goal.setStartDate(startDate);
        goal.setEndDate(endDate);
        goal.setStatus("ACTIVE");

        return goal;
    }

    @Test
    void shouldCreateGoalSuccessfullyAndCalculateTarget() {
        when(userRepository.findByEmail("target@example.com"))
                .thenReturn(Optional.of(user));

        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> {
            Goal goal = invocation.getArgument(0);
            ReflectionTestUtils.setField(goal, "id", 1L);
            return goal;
        });

        CreateGoalRequestDTO request = createRequest(
                "Cut Electricity 20%",
                "Lower monthly home grid emissions",
                "100.000",
                "20.00",
                LocalDate.now(),
                LocalDate.now().plusMonths(1)
        );

        GoalResponseDTO response = goalService.createGoal(
                "target@example.com",
                request
        );

        assertNotNull(response);
        assertEquals("Cut Electricity 20%", response.getTitle());
        assertEquals(new BigDecimal("100.000"), response.getBaselineCo2eKg());
        assertEquals(new BigDecimal("20.00"), response.getReductionPercentage());
        assertEquals(new BigDecimal("80.000"), response.getTargetCo2eKg());
        assertEquals("ACTIVE", response.getStatus());

        verify(goalRepository).save(any(Goal.class));
    }

    @Test
    void shouldRejectWhenEndDateIsBeforeStartDate() {
        CreateGoalRequestDTO request = createRequest(
                "Invalid Dates Goal",
                null,
                "100.000",
                "20.00",
                LocalDate.of(2026, 6, 15),
                LocalDate.of(2026, 6, 1)
        );

        assertThrows(ResponseStatusException.class, () ->
                goalService.createGoal("target@example.com", request)
        );

        verify(goalRepository, never()).save(any(Goal.class));
    }

    @Test
    void shouldCalculateProgressFromActivities() {
        // Baseline 125 kg, reduction target 20% => target 100 kg.
        // Current emissions 112.5 kg means 50% of the required
        // 25 kg reduction has been achieved.
        Goal goal = createGoal(
                1L,
                "Monthly Budget",
                "125.000",
                "20.00",
                "100.000",
                LocalDate.now().minusDays(10),
                LocalDate.now().plusDays(20)
        );

        when(userRepository.findByEmail("target@example.com"))
                .thenReturn(Optional.of(user));

        when(goalRepository.findByUserIdOrderByCreatedAtDesc(101L))
                .thenReturn(List.of(goal));

        when(activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(
                eq(101L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("112.500"));

        List<GoalResponseDTO> goals =
                goalService.getMyGoals("target@example.com");

        assertEquals(1, goals.size());

        GoalResponseDTO response = goals.get(0);

        assertEquals(new BigDecimal("112.500"), response.getCurrentCo2eKg());
        assertEquals(50.0, response.getProgressPercentage());
        assertEquals("EXCEEDED", response.getStatus());
        assertFalse(response.isCompleted());
        assertFalse(response.isOverdue());
    }

    @Test
    void shouldMarkPastGoalAsCompletedWhenWithinTarget() {
        Goal goal = createGoal(
                2L,
                "Past Month Target",
                "125.000",
                "20.00",
                "100.000",
                LocalDate.now().minusMonths(2),
                LocalDate.now().minusMonths(1)
        );

        when(activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(
                eq(101L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("82.000"));

        GoalResponseDTO response = goalService.convertToDTO(goal);

        assertEquals(new BigDecimal("82.000"), response.getCurrentCo2eKg());
        assertTrue(response.isCompleted());
        assertFalse(response.isOverdue());
        assertEquals("COMPLETED", response.getStatus());
    }

    @Test
    void shouldMarkPastGoalAsOverdueWhenTargetIsExceeded() {
        Goal goal = createGoal(
                3L,
                "Past Month Target Exceeded",
                "125.000",
                "20.00",
                "100.000",
                LocalDate.now().minusMonths(2),
                LocalDate.now().minusMonths(1)
        );

        when(activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(
                eq(101L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("125.000"));

        GoalResponseDTO response = goalService.convertToDTO(goal);

        assertFalse(response.isCompleted());
        assertTrue(response.isOverdue());
        assertEquals("OVERDUE", response.getStatus());
    }

    @Test
    void shouldUpdateGoalFieldsAndRecalculateTarget() {
        Goal goal = createGoal(
                5L,
                "Original Title",
                "100.000",
                "20.00",
                "80.000",
                LocalDate.now(),
                LocalDate.now().plusWeeks(2)
        );

        when(userRepository.findByEmail("target@example.com"))
                .thenReturn(Optional.of(user));

        when(goalRepository.findByIdAndUserId(5L, 101L))
                .thenReturn(Optional.of(goal));

        when(goalRepository.save(any(Goal.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UpdateGoalRequestDTO request = updateRequest(
                "Updated Title",
                "New Description",
                "100.000",
                "40.00",
                LocalDate.now(),
                LocalDate.now().plusWeeks(3),
                "ACTIVE"
        );

        GoalResponseDTO response = goalService.updateGoal(
                "target@example.com",
                5L,
                request
        );

        assertEquals("Updated Title", response.getTitle());
        assertEquals("New Description", response.getDescription());
        assertEquals(new BigDecimal("100.000"), response.getBaselineCo2eKg());
        assertEquals(new BigDecimal("40.00"), response.getReductionPercentage());
        assertEquals(new BigDecimal("60.000"), response.getTargetCo2eKg());
    }

    @Test
    void shouldThrowNotFoundWhenUpdatingAnotherUsersGoal() {
        when(userRepository.findByEmail("target@example.com"))
                .thenReturn(Optional.of(user));

        when(goalRepository.findByIdAndUserId(999L, 101L))
                .thenReturn(Optional.empty());

        UpdateGoalRequestDTO request = updateRequest(
                "Title",
                null,
                "100.000",
                "20.00",
                LocalDate.now(),
                LocalDate.now().plusDays(1),
                "ACTIVE"
        );

        assertThrows(ResponseStatusException.class, () ->
                goalService.updateGoal("target@example.com", 999L, request)
        );

        verify(goalRepository, never()).save(any(Goal.class));
    }
}
