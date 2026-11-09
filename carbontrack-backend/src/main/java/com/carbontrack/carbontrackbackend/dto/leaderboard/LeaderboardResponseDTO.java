
package com.carbontrack.carbontrackbackend.dto.leaderboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record LeaderboardResponseDTO(
        LeaderboardPeriod period,
        Integer periodDays,
        LocalDate startDate,
        LocalDate endDate,
        int totalParticipants,
        Integer myRank,
        BigDecimal myEmissionsKg,
        boolean isTopThree,
        List<LeaderboardEntryDTO> leaderboard
) {
}
