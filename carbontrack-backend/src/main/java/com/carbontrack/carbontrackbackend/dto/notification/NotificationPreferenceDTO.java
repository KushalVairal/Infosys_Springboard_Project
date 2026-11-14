package com.carbontrack.carbontrackbackend.dto.notification;

public record NotificationPreferenceDTO(
        boolean browserNotificationsEnabled,
        boolean emailNotificationsEnabled,
        boolean invitationAlerts,
        boolean badgeAlerts,
        boolean achievementAlerts,
        boolean leaderboardAlerts
) {}

