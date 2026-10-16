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
        goalService = new GoalService(goalRepository, activityLogRepository, userRepository);

        user = new User();
        ReflectionTestUtils.setField(user, "id", 101L);
        user.setUsername("targetsetter");
        user.setEmail("target@example.com");
    }

    @Test
    void shouldCreateGoalSuccessfully() {
        when(userRepository.findByEmail("target@example.com")).thenReturn(Optional.of(user));
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> {
            Goal g = invocation.getArgument(0);
            ReflectionTestUtils.setField(g, "id", 1L);
            return g;
        });

        CreateGoalRequestDTO req = new CreateGoalRequestDTO(
                "Cut Electricity 20%",
                "Lower monthly home grid emissions",
                new BigDecimal("80.000"),
                LocalDate.now(),
                LocalDate.now().plusMonths(1)
        );

        GoalResponseDTO res = goalService.createGoal("target@example.com", req);

        assertNotNull(res);
        assertEquals("Cut Electricity 20%", res.getTitle());
        assertEquals(new BigDecimal("80.000"), res.getTargetCo2eKg());
        assertEquals("ACTIVE", res.getStatus());
    }

    @Test
    void shouldRejectWhenEndDateIsBeforeStartDate() {
        when(userRepository.findByEmail("target@example.com")).thenReturn(Optional.of(user));

        CreateGoalRequestDTO req = new CreateGoalRequestDTO(
                "Invalid Dates Goal",
                null,
                new BigDecimal("50.000"),
                LocalDate.of(2026, 6, 15),
                LocalDate.of(2026, 6, 1)
        );

        assertThrows(ResponseStatusException.class, () ->
                goalService.createGoal("target@example.com", req)
        );
    }

    @Test
    void shouldCalculateProgressAccuratelyFromActivities() {
        Goal goal = new Goal();
        ReflectionTestUtils.setField(goal, "id", 1L);
        goal.setUser(user);
        goal.setTitle("Monthly Budget");
        goal.setTargetCo2eKg(new BigDecimal("100.000"));
        goal.setStartDate(LocalDate.now().minusDays(10));
        goal.setEndDate(LocalDate.now().plusDays(20));
        goal.setStatus("ACTIVE");

        when(userRepository.findByEmail("target@example.com")).thenReturn(Optional.of(user));
        when(goalRepository.findByUserIdOrderByCreatedAtDesc(101L)).thenReturn(List.of(goal));
        when(activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(eq(101L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("45.500"));

        List<GoalResponseDTO> goals = goalService.getMyGoals("target@example.com");

        assertEquals(1, goals.size());
        GoalResponseDTO g = goals.get(0);
        assertEquals(new BigDecimal("45.500"), g.getCurrentCo2eKg());
        assertEquals(45.5, g.getProgressPercentage());
        assertEquals("ACTIVE", g.getStatus());
        assertFalse(g.isCompleted());
        assertFalse(g.isOverdue());
    }

    @Test
    void shouldMarkPastGoalAsCompletedWhenWithinBudget() {
        Goal goal = new Goal();
        ReflectionTestUtils.setField(goal, "id", 2L);
        goal.setUser(user);
        goal.setTitle("Past Month Target");
        goal.setTargetCo2eKg(new BigDecimal("100.000"));
        goal.setStartDate(LocalDate.now().minusMonths(2));
        goal.setEndDate(LocalDate.now().minusMonths(1));
        goal.setStatus("ACTIVE");

        when(activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(eq(101L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("82.000"));

        GoalResponseDTO dto = goalService.convertToDTO(goal);

        assertTrue(dto.isCompleted());
        assertFalse(dto.isOverdue());
        assertEquals("COMPLETED", dto.getStatus());
    }

    @Test
    void shouldMarkPastGoalAsOverdueWhenExceededBudget() {
        Goal goal = new Goal();
        ReflectionTestUtils.setField(goal, "id", 3L);
        goal.setUser(user);
        goal.setTitle("Past Month Target Exceeded");
        goal.setTargetCo2eKg(new BigDecimal("100.000"));
        goal.setStartDate(LocalDate.now().minusMonths(2));
        goal.setEndDate(LocalDate.now().minusMonths(1));
        goal.setStatus("ACTIVE");

        when(activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(eq(101L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("125.000"));

        GoalResponseDTO dto = goalService.convertToDTO(goal);

        assertFalse(dto.isCompleted());
        assertTrue(dto.isOverdue());
        assertEquals("OVERDUE", dto.getStatus());
    }

    @Test
    void shouldUpdateGoalFields() {
        Goal goal = new Goal();
        ReflectionTestUtils.setField(goal, "id", 5L);
        goal.setUser(user);
        goal.setTitle("Original Title");
        goal.setTargetCo2eKg(new BigDecimal("50.000"));
        goal.setStartDate(LocalDate.now());
        goal.setEndDate(LocalDate.now().plusWeeks(2));
        goal.setStatus("ACTIVE");

        when(userRepository.findByEmail("target@example.com")).thenReturn(Optional.of(user));
        when(goalRepository.findByIdAndUserId(5L, 101L)).thenReturn(Optional.of(goal));
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateGoalRequestDTO updateReq = new UpdateGoalRequestDTO(
                "Updated Title",
                "New Description",
                new BigDecimal("60.000"),
                LocalDate.now(),
                LocalDate.now().plusWeeks(3),
                "ACTIVE"
        );

        GoalResponseDTO updated = goalService.updateGoal("target@example.com", 5L, updateReq);

        assertEquals("Updated Title", updated.getTitle());
        assertEquals("New Description", updated.getDescription());
        assertEquals(new BigDecimal("60.000"), updated.getTargetCo2eKg());
    }

    @Test
    void shouldThrowNotFoundWhenUpdatingGoalOfAnotherUser() {
        when(userRepository.findByEmail("target@example.com")).thenReturn(Optional.of(user));
        when(goalRepository.findByIdAndUserId(999L, 101L)).thenReturn(Optional.empty());

        UpdateGoalRequestDTO updateReq = new UpdateGoalRequestDTO(
                "Title", null, new BigDecimal("50.000"), LocalDate.now(), LocalDate.now().plusDays(1), "ACTIVE"
        );

        assertThrows(ResponseStatusException.class, () ->
                goalService.updateGoal("target@example.com", 999L, updateReq)
        );
    }
}
