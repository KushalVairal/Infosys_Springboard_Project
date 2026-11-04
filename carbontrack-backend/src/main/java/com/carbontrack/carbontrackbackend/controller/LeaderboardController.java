package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardResponseDTO;
import com.carbontrack.carbontrackbackend.service.LeaderboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(
            LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping
    public LeaderboardResponseDTO getLeaderboard() {
        return leaderboardService.getLeaderboard();
    }
}