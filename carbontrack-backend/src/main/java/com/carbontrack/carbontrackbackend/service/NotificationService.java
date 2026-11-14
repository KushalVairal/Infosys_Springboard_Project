package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.notification.NotificationDTO;
import com.carbontrack.carbontrackbackend.dto.notification.NotificationPreferenceDTO;
import com.carbontrack.carbontrackbackend.dto.notification.UnreadCountDTO;
import com.carbontrack.carbontrackbackend.entity.Notification;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.entity.UserNotificationPreference;
import com.carbontrack.carbontrackbackend.repository.NotificationRepository;
import com.carbontrack.carbontrackbackend.repository.UserNotificationPreferenceRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserNotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Autowired
    public NotificationService(
            NotificationRepository notificationRepository,
            UserNotificationPreferenceRepository preferenceRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.notificationRepository = notificationRepository;
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public NotificationService(
            NotificationRepository notificationRepository,
            UserNotificationPreferenceRepository preferenceRepository,
            UserRepository userRepository) {
        this(notificationRepository, preferenceRepository, userRepository, null);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getMyNotifications(String email) {
        User user = getUser(email);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountDTO getUnreadCount(String email) {
        User user = getUser(email);
        long count = notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
        return new UnreadCountDTO(count);
    }

    @Transactional
    public NotificationDTO markAsRead(String email, Long notificationId) {
        User user = getUser(email);
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }
        return toDTO(notification);
    }

    @Transactional
    public void markAllAsRead(String email) {
        User user = getUser(email);
        notificationRepository.markAllAsReadForRecipient(user.getId(), LocalDateTime.now());
    }

    @Transactional
    public void deleteNotification(String email, Long notificationId) {
        User user = getUser(email);
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        notificationRepository.delete(notification);
    }

    @Transactional
    public NotificationPreferenceDTO getPreferences(String email) {
        User user = getUser(email);
        UserNotificationPreference pref = preferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> preferenceRepository.save(new UserNotificationPreference(user)));
        return toPreferenceDTO(pref);
    }

    @Transactional
    public NotificationPreferenceDTO updatePreferences(String email, NotificationPreferenceDTO dto) {
        User user = getUser(email);
        UserNotificationPreference pref = preferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> new UserNotificationPreference(user));

        pref.setBrowserNotificationsEnabled(dto.browserNotificationsEnabled());
        pref.setEmailNotificationsEnabled(dto.emailNotificationsEnabled());
        pref.setInvitationAlerts(dto.invitationAlerts());
        pref.setBadgeAlerts(dto.badgeAlerts());
        pref.setAchievementAlerts(dto.achievementAlerts());
        pref.setLeaderboardAlerts(dto.leaderboardAlerts());

        pref = preferenceRepository.save(pref);
        return toPreferenceDTO(pref);
    }

    @Transactional
    public void createNotification(User recipient, String type, String title, String message, Long relatedEntityId) {
        if (recipient == null) return;

        // 1. Always persist in-app notification
        Notification notification = new Notification(recipient, type, title, message, relatedEntityId);
        notificationRepository.save(notification);
        log.info("Saved in-app notification [{}] for user ID {}", type, recipient.getId());

        // 2. Phase 4: Respect user notification preferences for outgoing emails
        if (emailService == null || recipient.getEmail() == null || recipient.getEmail().isBlank()) {
            return;
        }

        UserNotificationPreference pref = preferenceRepository.findByUserId(recipient.getId())
                .orElse(null);

        // Check master email notification toggle
        if (pref != null && !pref.isEmailNotificationsEnabled()) {
            log.debug("Email notifications disabled for user ID {}; skipping email dispatch.", recipient.getId());
            return;
        }

        // Check category-specific notification alert toggles
        if (pref != null) {
            if (("ORGANISATION_INVITATION".equals(type) || "INVITATION_ACCEPTED".equals(type)) && !pref.isInvitationAlerts()) {
                log.debug("Invitation email alerts disabled for user ID {}; skipping email dispatch.", recipient.getId());
                return;
            }
            if ("BADGE_EARNED".equals(type) && !pref.isBadgeAlerts()) {
                log.debug("Badge email alerts disabled for user ID {}; skipping email dispatch.", recipient.getId());
                return;
            }
            if ("ACHIEVEMENT_UNLOCKED".equals(type) && !pref.isAchievementAlerts()) {
                log.debug("Achievement email alerts disabled for user ID {}; skipping email dispatch.", recipient.getId());
                return;
            }
            if ("LEADERBOARD_POSITION".equals(type) && !pref.isLeaderboardAlerts()) {
                log.debug("Leaderboard email alerts disabled for user ID {}; skipping email dispatch.", recipient.getId());
                return;
            }
        }

        // 3. Dispatch branded HTML email with plain text fallback
        try {
            String displayName = (recipient.getFullName() != null && !recipient.getFullName().isBlank())
                    ? recipient.getFullName()
                    : recipient.getUsername();

            switch (type) {
                case "BADGE_EARNED" -> {
                    String badgeName = title.startsWith("New Badge Earned: ") ? title.substring("New Badge Earned: ".length()) : title;
                    emailService.sendBadgeEarnedEmail(recipient.getEmail(), displayName, badgeName, message);
                }
                case "ACHIEVEMENT_UNLOCKED" -> {
                    String medalName = title.startsWith("Achievement Unlocked: ") ? title.substring("Achievement Unlocked: ".length()) : title;
                    emailService.sendAchievementUnlockedEmail(recipient.getEmail(), displayName, medalName, message);
                }
                case "ORGANISATION_INVITATION" -> {
                    String orgName = title.startsWith("Invitation to Join ") ? title.substring("Invitation to Join ".length()) : "Organisation";
                    emailService.sendOrganisationInvitationEmail(recipient.getEmail(), displayName, orgName, "Your Organisation Admin", null, 7);
                }
                case "INVITATION_ACCEPTED" -> {
                    emailService.sendGeneralNotificationEmail(recipient.getEmail(), displayName, title, message, "View Organisation", "/organisation");
                }
                case "LEADERBOARD_POSITION" -> {
                    emailService.sendLeaderboardAlertEmail(recipient.getEmail(), displayName, "Community", 1, "Monthly");
                }
                case "GOAL_PROGRESS", "GOAL_EXCEEDED" -> {
                    emailService.sendGoalAlertEmail(recipient.getEmail(), displayName, title, "All", 100.0, type);
                }
                default -> {
                    emailService.sendGeneralNotificationEmail(recipient.getEmail(), displayName, title, message, "View Notifications", "/notifications");
                }
            }
        } catch (Exception ex) {
            log.error("Failed to deliver notification email to {}: {}", recipient.getEmail(), ex.getMessage());
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .or(() -> userRepository.findByUsername(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private NotificationDTO toDTO(Notification n) {
        return new NotificationDTO(
                n.getId(),
                n.getNotificationType(),
                n.getTitle(),
                n.getMessage(),
                n.getRelatedEntityId(),
                n.isRead(),
                n.getCreatedAt(),
                n.getReadAt()
        );
    }

    private NotificationPreferenceDTO toPreferenceDTO(UserNotificationPreference p) {
        return new NotificationPreferenceDTO(
                p.isBrowserNotificationsEnabled(),
                p.isEmailNotificationsEnabled(),
                p.isInvitationAlerts(),
                p.isBadgeAlerts(),
                p.isAchievementAlerts(),
                p.isLeaderboardAlerts()
        );
    }
}

