package com.carbontrack.carbontrackbackend.dto.notification;

import java.time.LocalDateTime;

public record NotificationDTO(
        Long id,
        String notificationType,
        String title,
        String message,
        Long relatedEntityId,
        boolean isRead,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {}

