package com.carbontrack.carbontrackbackend.dto.leaderboard;

import java.time.LocalDateTime;

public record LeaderboardBadgeDTO(
        Long badgeId,
        String name,
        String description,
        String iconUrl,
        LocalDateTime awardedAt
) {}
