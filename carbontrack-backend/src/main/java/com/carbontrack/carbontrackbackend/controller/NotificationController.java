package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.notification.NotificationDTO;
import com.carbontrack.carbontrackbackend.dto.notification.NotificationPreferenceDTO;
import com.carbontrack.carbontrackbackend.dto.notification.UnreadCountDTO;
import com.carbontrack.carbontrackbackend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationDTO> getMyNotifications(Authentication authentication) {
        return notificationService.getMyNotifications(authentication.getName());
    }

    @GetMapping("/unread-count")
    public UnreadCountDTO getUnreadCount(Authentication authentication) {
        return notificationService.getUnreadCount(authentication.getName());
    }

    @PatchMapping("/{id}/read")
    public NotificationDTO markAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        return notificationService.markAsRead(authentication.getName(), id);
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {
        notificationService.deleteNotification(authentication.getName(), id);
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }

    @GetMapping("/preferences")
    public NotificationPreferenceDTO getPreferences(Authentication authentication) {
        return notificationService.getPreferences(authentication.getName());
    }

    @PutMapping("/preferences")
    public NotificationPreferenceDTO updatePreferences(
            @RequestBody NotificationPreferenceDTO dto,
            Authentication authentication) {
        return notificationService.updatePreferences(authentication.getName(), dto);
    }
}

