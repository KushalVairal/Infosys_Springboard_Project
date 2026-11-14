package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.achievement.AchievementResponseDTO;
import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardPeriod;
import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardResponseDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.entity.UserAchievement;
import com.carbontrack.carbontrackbackend.repository.UserAchievementRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AchievementService {

    private static final Logger log = LoggerFactory.getLogger(AchievementService.class);

    private final UserAchievementRepository achievementRepository;
    private final UserRepository userRepository;
    private final LeaderboardService leaderboardService;
    private final NotificationService notificationService;

    public AchievementService(
            UserAchievementRepository achievementRepository,
            UserRepository userRepository,
            LeaderboardService leaderboardService,
            NotificationService notificationService
    ) {
        this.achievementRepository = achievementRepository;
        this.userRepository = userRepository;
        this.leaderboardService = leaderboardService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<AchievementResponseDTO> getMyAchievements(String authenticatedEmail) {
        User user = getUser(authenticatedEmail);

        return achievementRepository
                .findByUserIdOrderByClaimedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AchievementResponseDTO claimAchievement(
            String authenticatedEmail,
            LeaderboardPeriod period
    ) {
        return claimAchievement(authenticatedEmail, period, "OVERALL");
    }

    @Transactional
    public AchievementResponseDTO claimAchievement(
            String authenticatedEmail,
            LeaderboardPeriod period,
            String scope
    ) {
        String effectiveScope = (scope != null && !scope.isBlank()) ? scope.trim().toUpperCase() : "OVERALL";
        User user = getUser(authenticatedEmail);

        // Recalculate leaderboard with the authenticated user and exact scope (OVERALL or ORGANISATION)
        LeaderboardResponseDTO leaderboard =
                leaderboardService.getLeaderboard(authenticatedEmail, period, effectiveScope);

        Integer rank = leaderboard.myRank();

        if (rank == null || rank < 1 || rank > 3) {
            String scopeLabel = "ORGANISATION".equals(effectiveScope) ? "organisation" : "community";
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You must be in the top 3 of the " + scopeLabel + " leaderboard to claim an achievement (your current rank is #" + (rank == null ? "unranked" : rank) + ")."
            );
        }

        // Prevent duplicate claims for the same reporting period, start date, and scope
        boolean alreadyClaimed =
                achievementRepository
                        .existsByUserIdAndLeaderboardPeriodAndPeriodStartDateAndScope(
                                user.getId(),
                                period.name(),
                                leaderboard.startDate(),
                                effectiveScope
                        );

        if (alreadyClaimed) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You have already claimed this achievement for this reporting period."
            );
        }

        String achievementType = switch (rank) {
            case 1 -> "GOLD_LEAF";
            case 2 -> "SILVER_LEAF";
            case 3 -> "BRONZE_LEAF";
            default -> throw new IllegalStateException("Invalid leaderboard rank: " + rank);
        };

        UserAchievement achievement = new UserAchievement();
        achievement.setUser(user);
        achievement.setAchievementType(achievementType);
        achievement.setLeaderboardPeriod(period.name());
        achievement.setScope(effectiveScope);
        achievement.setRankAtClaim(rank);
        achievement.setEmissionsKgAtClaim(leaderboard.myEmissionsKg());
        achievement.setPeriodStartDate(leaderboard.startDate());
        achievement.setPeriodEndDate(leaderboard.endDate());

        UserAchievement saved = achievementRepository.save(achievement);

        try {
            String medalName = switch (rank) {
                case 1 -> "Gold Leaf";
                case 2 -> "Silver Leaf";
                case 3 -> "Bronze Leaf";
                default -> "Leaf";
            };
            String scopeTitle = "ORGANISATION".equals(effectiveScope) ? "Organisation" : "Community";
            notificationService.createNotification(
                    user,
                    "ACHIEVEMENT_UNLOCKED",
                    "Achievement Unlocked: " + medalName,
                    "Congratulations! You claimed the " + medalName + " achievement for the " + period.name().toLowerCase() + " " + scopeTitle + " Leaderboard (Rank #" + rank + ").",
                    saved.getId()
            );
        } catch (Exception ex) {
            log.warn("Failed to create achievement notification for user {}: {}", user.getId(), ex.getMessage());
        }

        return toResponse(saved);
    }

    private User getUser(String authenticatedEmail) {
        return userRepository.findByEmail(authenticatedEmail)
                .or(() -> userRepository.findByUsername(authenticatedEmail))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user not found."
                ));
    }

    private AchievementResponseDTO toResponse(UserAchievement achievement) {
        return new AchievementResponseDTO(
                achievement.getId(),
                achievement.getAchievementType(),
                achievement.getLeaderboardPeriod(),
                achievement.getRankAtClaim(),
                achievement.getEmissionsKgAtClaim(),
                achievement.getPeriodStartDate(),
                achievement.getPeriodEndDate(),
                achievement.getClaimedAt(),
                achievement.getScope()
        );
    }
}
