package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.achievement.AchievementResponseDTO;
import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardPeriod;
import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardResponseDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.entity.UserAchievement;
import com.carbontrack.carbontrackbackend.repository.UserAchievementRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AchievementService {

    private final UserAchievementRepository achievementRepository;
    private final UserRepository userRepository;
    private final LeaderboardService leaderboardService;

    public AchievementService(
            UserAchievementRepository achievementRepository,
            UserRepository userRepository,
            LeaderboardService leaderboardService
    ) {
        this.achievementRepository = achievementRepository;
        this.userRepository = userRepository;
        this.leaderboardService = leaderboardService;
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

        User user = getUser(authenticatedEmail);

        // Recalculate the leaderboard using the authenticated user's ID.
        LeaderboardResponseDTO leaderboard =
                leaderboardService.buildLeaderboard(user.getId(), period);

        Integer rank = leaderboard.myRank();

        if (rank == null || rank < 1 || rank > 3) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You must be in the top 3 to claim an achievement."
            );
        }

        // Prevent duplicate claims for the same reporting period.
        boolean alreadyClaimed =
                achievementRepository
                        .existsByUserIdAndLeaderboardPeriodAndPeriodStartDate(
                                user.getId(),
                                period.name(),
                                leaderboard.startDate()
                        );

        if (alreadyClaimed) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You have already claimed an achievement for this period."
            );
        }

        String achievementType = switch (rank) {
            case 1 -> "GOLD_LEAF";
            case 2 -> "SILVER_LEAF";
            case 3 -> "BRONZE_LEAF";
            default -> throw new IllegalStateException("Invalid leaderboard rank");
        };

        UserAchievement achievement = new UserAchievement();

        achievement.setUser(user);
        achievement.setAchievementType(achievementType);
        achievement.setLeaderboardPeriod(period.name());
        achievement.setRankAtClaim(rank);
        achievement.setEmissionsKgAtClaim(leaderboard.myEmissionsKg());
        achievement.setPeriodStartDate(leaderboard.startDate());
        achievement.setPeriodEndDate(leaderboard.endDate());

        UserAchievement saved = achievementRepository.save(achievement);

        return toResponse(saved);
    }

    private User getUser(String authenticatedEmail) {
        return userRepository.findByEmail(authenticatedEmail)
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
                achievement.getClaimedAt()
        );
    }
}