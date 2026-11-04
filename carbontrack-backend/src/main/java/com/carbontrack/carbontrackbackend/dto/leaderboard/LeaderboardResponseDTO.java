package com.carbontrack.carbontrackbackend.dto.leaderboard;

import java.time.LocalDate;
import java.util.List;

public record LeaderboardResponseDTO(
        int periodDays,
        LocalDate startDate,
        LocalDate endDate,
        int totalParticipants,
        List<LeaderboardEntryDTO> leaderboard
) {}