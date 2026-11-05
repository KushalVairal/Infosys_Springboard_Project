package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardPeriod;
import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardResponseDTO;
import com.carbontrack.carbontrackbackend.service.LeaderboardService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping
    public LeaderboardResponseDTO getLeaderboard(
            Authentication authentication,
            @RequestParam(defaultValue = "MONTHLY") LeaderboardPeriod period) {
        return leaderboardService.getLeaderboard(authentication.getName(), period);
    }
}
