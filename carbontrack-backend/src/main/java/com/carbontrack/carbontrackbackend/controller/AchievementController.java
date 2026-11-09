package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.achievement.AchievementResponseDTO;
import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardPeriod;
import com.carbontrack.carbontrackbackend.service.AchievementService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
public class AchievementController {

    private final AchievementService achievementService;

    public AchievementController(AchievementService achievementService) {
        this.achievementService = achievementService;
    }

    @GetMapping("/me")
    public List<AchievementResponseDTO> getMyAchievements(
            Authentication authentication
    ) {
        return achievementService.getMyAchievements(authentication.getName());
    }

    @PostMapping("/claim")
    @ResponseStatus(HttpStatus.CREATED)
    public AchievementResponseDTO claimAchievement(
            @RequestParam LeaderboardPeriod period,
            Authentication authentication
    ) {
        return achievementService.claimAchievement(
                authentication.getName(),
                period
        );
    }
}