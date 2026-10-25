package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.entity.Badge;
import com.carbontrack.carbontrackbackend.entity.Goal;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.entity.UserBadge;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.BadgeRepository;
import com.carbontrack.carbontrackbackend.repository.GoalRepository;
import com.carbontrack.carbontrackbackend.repository.UserBadgeRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BadgeServiceTest {

    @Mock
    private BadgeRepository badgeRepository;

    @Mock
    private UserBadgeRepository userBadgeRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private UserRepository userRepository;

    private BadgeService badgeService;
    private User testUser;
    private Badge streakBadge;
    private Badge goalBadge;
    private Badge red10Badge;
    private Badge red25Badge;
    private Badge red50Badge;

    @BeforeEach
    void setUp() {
        badgeService = new BadgeService(
                badgeRepository,
                userBadgeRepository,
                activityLogRepository,
                goalRepository,
                userRepository
        );

        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 101L);
        testUser.setEmail("badgeuser@example.com");

        streakBadge = createBadge(1L, "STREAK_7_DAYS");
        goalBadge = createBadge(2L, "FIRST_GOAL_COMPLETED");
        red10Badge = createBadge(3L, "REDUCTION_10_KG");
        red25Badge = createBadge(4L, "REDUCTION_25_KG");
        red50Badge = createBadge(5L, "REDUCTION_50_KG");
    }

    private Badge createBadge(Long id, String name) {
        Badge b = new Badge();
        ReflectionTestUtils.setField(b, "id", id);
        b.setName(name);
        b.setDescription("Description for " + name);
        return b;
    }

    @Test
    void shouldAwardSevenDayStreakWhenUserHasSevenConsecutiveDays() {
        when(userRepository.findById(101L)).thenReturn(Optional.of(testUser));
        when(userBadgeRepository.findByUserId(101L)).thenReturn(Collections.emptyList());

        LocalDate today = LocalDate.now();
        List<LocalDate> dates = List.of(
                today,
                today.minusDays(1),
                today.minusDays(2),
                today.minusDays(3),
                today.minusDays(4),
                today.minusDays(5),
                today.minusDays(6)
        );

        when(activityLogRepository.findDistinctLogDatesByUserId(101L)).thenReturn(dates);
        when(badgeRepository.findByName("STREAK_7_DAYS")).thenReturn(Optional.of(streakBadge));
        when(userBadgeRepository.existsByUserIdAndBadgeId(101L, 1L)).thenReturn(false);

        List<String> awarded = badgeService.evaluateBadges(101L);

        assertTrue(awarded.contains("STREAK_7_DAYS"));
        verify(userBadgeRepository, times(1)).saveAndFlush(any(UserBadge.class));
    }

    @Test
    void shouldNotAwardStreakWhenUserHasFewerThanSevenDays() {
        when(userRepository.findById(101L)).thenReturn(Optional.of(testUser));
        when(userBadgeRepository.findByUserId(101L)).thenReturn(Collections.emptyList());

        LocalDate today = LocalDate.now();
        // Only 5 days
        List<LocalDate> dates = List.of(
                today,
                today.minusDays(1),
                today.minusDays(2),
                today.minusDays(3),
                today.minusDays(4)
        );

        when(activityLogRepository.findDistinctLogDatesByUserId(101L)).thenReturn(dates);

        List<String> awarded = badgeService.evaluateBadges(101L);

        assertFalse(awarded.contains("STREAK_7_DAYS"));
        verify(badgeRepository, never()).findByName("STREAK_7_DAYS");
    }

    @Test
    void shouldAwardFirstGoalCompletedWhenGoalIsCompleted() {
        when(userRepository.findById(101L)).thenReturn(Optional.of(testUser));
        when(userBadgeRepository.findByUserId(101L)).thenReturn(Collections.emptyList());
        when(activityLogRepository.findDistinctLogDatesByUserId(101L)).thenReturn(Collections.emptyList());

        Goal completedGoal = new Goal();
        completedGoal.setStatus("COMPLETED");

        when(goalRepository.findByUserId(101L)).thenReturn(List.of(completedGoal));
        when(badgeRepository.findByName("FIRST_GOAL_COMPLETED")).thenReturn(Optional.of(goalBadge));
        when(userBadgeRepository.existsByUserIdAndBadgeId(101L, 2L)).thenReturn(false);

        List<String> awarded = badgeService.evaluateBadges(101L);

        assertTrue(awarded.contains("FIRST_GOAL_COMPLETED"));
        verify(userBadgeRepository, times(1)).saveAndFlush(any(UserBadge.class));
    }

    @Test
    void shouldAward10KgAnd25KgReductionBadgesWhenCumulativeReductionIsExceeded() {
        when(userRepository.findById(101L)).thenReturn(Optional.of(testUser));
        when(userBadgeRepository.findByUserId(101L)).thenReturn(Collections.emptyList());
        when(activityLogRepository.findDistinctLogDatesByUserId(101L)).thenReturn(Collections.emptyList());

        Goal goal = new Goal();
        goal.setStatus("ACTIVE");
        goal.setBaselineCo2eKg(new BigDecimal("100.000"));
        goal.setStartDate(LocalDate.now().minusDays(15));
        goal.setEndDate(LocalDate.now().plusDays(15));

        // Actual emissions = 70.0 kg -> Reduction = 100 - 70 = 30.0 kg
        when(goalRepository.findByUserId(101L)).thenReturn(List.of(goal));
        when(activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(eq(101L), any(), any()))
                .thenReturn(new BigDecimal("70.000"));

        when(badgeRepository.findByName("REDUCTION_10_KG")).thenReturn(Optional.of(red10Badge));
        when(badgeRepository.findByName("REDUCTION_25_KG")).thenReturn(Optional.of(red25Badge));
        when(userBadgeRepository.existsByUserIdAndBadgeId(101L, 3L)).thenReturn(false);
        when(userBadgeRepository.existsByUserIdAndBadgeId(101L, 4L)).thenReturn(false);

        List<String> awarded = badgeService.evaluateBadges(101L);

        assertTrue(awarded.contains("REDUCTION_10_KG"));
        assertTrue(awarded.contains("REDUCTION_25_KG"));
        assertFalse(awarded.contains("REDUCTION_50_KG"), "50 kg badge should not be awarded for 30 kg reduction");
        verify(userBadgeRepository, times(2)).saveAndFlush(any(UserBadge.class));
    }

    @Test
    void shouldPreventDuplicateAwardsWhenUserAlreadyPossessesBadge() {
        when(userRepository.findById(101L)).thenReturn(Optional.of(testUser));

        UserBadge existingStreak = new UserBadge();
        existingStreak.setBadge(streakBadge);
        when(userBadgeRepository.findByUserId(101L)).thenReturn(List.of(existingStreak));

        // Even if streak condition holds, streak is already in existingBadges
        List<String> awarded = badgeService.evaluateBadges(101L);

        assertFalse(awarded.contains("STREAK_7_DAYS"));
        verify(badgeRepository, never()).findByName("STREAK_7_DAYS");
        verify(userBadgeRepository, never()).save(any(UserBadge.class));
    }
}
