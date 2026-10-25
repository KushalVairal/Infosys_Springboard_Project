package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.badge.UserBadgeResponseDTO;
import com.carbontrack.carbontrackbackend.entity.Badge;
import com.carbontrack.carbontrackbackend.entity.Goal;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.entity.UserBadge;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.BadgeRepository;
import com.carbontrack.carbontrackbackend.repository.GoalRepository;
import com.carbontrack.carbontrackbackend.repository.UserBadgeRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BadgeService {

    private static final Logger log = LoggerFactory.getLogger(BadgeService.class);

    public static final String BADGE_STREAK_7_DAYS = "STREAK_7_DAYS";
    public static final String BADGE_FIRST_GOAL_COMPLETED = "FIRST_GOAL_COMPLETED";
    public static final String BADGE_REDUCTION_10_KG = "REDUCTION_10_KG";
    public static final String BADGE_REDUCTION_25_KG = "REDUCTION_25_KG";
    public static final String BADGE_REDUCTION_50_KG = "REDUCTION_50_KG";

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final ActivityLogRepository activityLogRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public BadgeService(
            BadgeRepository badgeRepository,
            UserBadgeRepository userBadgeRepository,
            ActivityLogRepository activityLogRepository,
            GoalRepository goalRepository,
            UserRepository userRepository) {
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.activityLogRepository = activityLogRepository;
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserBadgeResponseDTO> getMyBadges(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        List<UserBadge> userBadges = userBadgeRepository.findByUserIdWithBadge(user.getId());

        return userBadges.stream()
                .map(ub -> new UserBadgeResponseDTO(
                        ub.getBadge().getId(),
                        ub.getBadge().getName(),
                        ub.getBadge().getDescription(),
                        ub.getBadge().getIconUrl(),
                        ub.getAwardedAt()
                ))
                .toList();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<String> evaluateBadges(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return Collections.emptyList();
        }

        List<UserBadge> existingBadges = userBadgeRepository.findByUserId(userId);
        Set<String> earnedBadgeNames = existingBadges.stream()
                .map(ub -> ub.getBadge().getName())
                .collect(Collectors.toSet());

        List<String> newlyAwarded = new ArrayList<>();

        // 1. Rule: 7-Day Consecutive Activity Logging Streak
        if (!earnedBadgeNames.contains(BADGE_STREAK_7_DAYS)) {
            if (checkSevenDayStreak(userId)) {
                if (awardBadgeSafely(user, BADGE_STREAK_7_DAYS)) {
                    newlyAwarded.add(BADGE_STREAK_7_DAYS);
                }
            }
        }

        // 2. Rule: First Genuinely Completed Goal
        List<Goal> userGoals = goalRepository.findByUserId(userId);

        if (!earnedBadgeNames.contains(BADGE_FIRST_GOAL_COMPLETED)) {
            if (checkFirstGoalCompleted(userId, userGoals)) {
                if (awardBadgeSafely(user, BADGE_FIRST_GOAL_COMPLETED)) {
                    newlyAwarded.add(BADGE_FIRST_GOAL_COMPLETED);
                }
            }
        }

        // 3. Rules: 10 kg, 25 kg, and 50 kg Cumulative Carbon Reduction
        boolean needs10 = !earnedBadgeNames.contains(BADGE_REDUCTION_10_KG);
        boolean needs25 = !earnedBadgeNames.contains(BADGE_REDUCTION_25_KG);
        boolean needs50 = !earnedBadgeNames.contains(BADGE_REDUCTION_50_KG);

        if (needs10 || needs25 || needs50) {
            BigDecimal totalReduction = calculateCumulativeReduction(userId, userGoals);

            if (needs10 && totalReduction.compareTo(BigDecimal.valueOf(10.0)) >= 0) {
                if (awardBadgeSafely(user, BADGE_REDUCTION_10_KG)) {
                    newlyAwarded.add(BADGE_REDUCTION_10_KG);
                }
            }
            if (needs25 && totalReduction.compareTo(BigDecimal.valueOf(25.0)) >= 0) {
                if (awardBadgeSafely(user, BADGE_REDUCTION_25_KG)) {
                    newlyAwarded.add(BADGE_REDUCTION_25_KG);
                }
            }
            if (needs50 && totalReduction.compareTo(BigDecimal.valueOf(50.0)) >= 0) {
                if (awardBadgeSafely(user, BADGE_REDUCTION_50_KG)) {
                    newlyAwarded.add(BADGE_REDUCTION_50_KG);
                }
            }
        }

        return newlyAwarded;
    }

    private boolean checkSevenDayStreak(Long userId) {
        List<LocalDate> dates = activityLogRepository.findDistinctLogDatesByUserId(userId);
        if (dates == null || dates.size() < 7) {
            return false;
        }

        int consecutive = 1;
        for (int i = 0; i < dates.size() - 1; i++) {
            LocalDate current = dates.get(i);
            LocalDate previous = dates.get(i + 1);

            if (current.minusDays(1).equals(previous)) {
                consecutive++;
                if (consecutive >= 7) {
                    return true;
                }
            } else {
                consecutive = 1;
            }
        }

        return false;
    }

    private boolean checkFirstGoalCompleted(Long userId, List<Goal> userGoals) {
        if (userGoals == null || userGoals.isEmpty()) {
            return false;
        }

        LocalDate today = LocalDate.now();
        for (Goal goal : userGoals) {
            if ("COMPLETED".equalsIgnoreCase(goal.getStatus())) {
                return true;
            }

            // Check dynamic completion semantics
            boolean pastEndDate = today.isAfter(goal.getEndDate());
            if (pastEndDate && !"CANCELLED".equalsIgnoreCase(goal.getStatus())) {
                BigDecimal current = activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(
                        userId, goal.getStartDate(), goal.getEndDate());
                if (current == null) current = BigDecimal.ZERO;

                BigDecimal target = goal.getTargetCo2eKg();
                if (target != null && current.compareTo(target) <= 0) {
                    return true;
                }
            }
        }

        return false;
    }

    private BigDecimal calculateCumulativeReduction(Long userId, List<Goal> userGoals) {
        if (userGoals == null || userGoals.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal totalReduction = BigDecimal.ZERO;

        for (Goal goal : userGoals) {
            BigDecimal baseline = goal.getBaselineCo2eKg();
            if (baseline == null || baseline.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal current = activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(
                    userId, goal.getStartDate(), goal.getEndDate());
            if (current == null) {
                current = BigDecimal.ZERO;
            }

            // Reduction achieved = baseline - actual emissions
            if (baseline.compareTo(current) > 0) {
                BigDecimal reduction = baseline.subtract(current);
                totalReduction = totalReduction.add(reduction);
            }
        }

        return totalReduction;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean awardBadgeSafely(User user, String badgeName) {
        Optional<Badge> badgeOpt = badgeRepository.findByName(badgeName);
        if (badgeOpt.isEmpty()) {
            log.warn("Badge '{}' definition not found in database. Skipping award.", badgeName);
            return false;
        }

        Badge badge = badgeOpt.get();

        if (userBadgeRepository.existsByUserIdAndBadgeId(user.getId(), badge.getId())) {
            return false;
        }

        try {
            UserBadge userBadge = new UserBadge();
            userBadge.setUser(user);
            userBadge.setBadge(badge);
            userBadgeRepository.saveAndFlush(userBadge);
            log.info("Awarded badge '{}' to user ID {}", badgeName, user.getId());
            return true;
        } catch (DataIntegrityViolationException ex) {
            log.debug("Concurrent badge award attempt prevented by database constraint: {}", ex.getMessage());
            return false;
        }
    }
}
