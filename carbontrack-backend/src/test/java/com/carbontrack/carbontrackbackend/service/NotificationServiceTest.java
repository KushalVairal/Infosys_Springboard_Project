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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserNotificationPreferenceRepository preferenceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private NotificationService notificationService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        ReflectionTestUtils.setField(user, "id", 1L);
        user.setEmail("user@example.com");
        user.setUsername("testuser");
    }

    @Test
    @DisplayName("getMyNotifications returns list of user notifications")
    void shouldReturnNotifications() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        Notification n = new Notification(user, "BADGE_EARNED", "Badge!", "You earned a badge", 10L);
        ReflectionTestUtils.setField(n, "id", 100L);
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(n));

        List<NotificationDTO> result = notificationService.getMyNotifications("user@example.com");

        assertEquals(1, result.size());
        assertEquals("BADGE_EARNED", result.get(0).notificationType());
        assertEquals("Badge!", result.get(0).title());
    }

    @Test
    @DisplayName("getUnreadCount returns correct unread count")
    void shouldReturnUnreadCount() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(notificationRepository.countByRecipientIdAndIsReadFalse(1L)).thenReturn(5L);

        UnreadCountDTO result = notificationService.getUnreadCount("user@example.com");

        assertEquals(5L, result.unreadCount());
    }

    @Test
    @DisplayName("markAsRead updates notification read status")
    void shouldMarkAsRead() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        Notification n = new Notification(user, "BADGE_EARNED", "Badge!", "Msg", 10L);
        ReflectionTestUtils.setField(n, "id", 100L);
        assertFalse(n.isRead());

        when(notificationRepository.findByIdAndRecipientId(100L, 1L)).thenReturn(Optional.of(n));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        NotificationDTO result = notificationService.markAsRead("user@example.com", 100L);

        assertTrue(result.isRead());
        assertNotNull(result.readAt());
    }

    @Test
    @DisplayName("deleteNotification deletes the notification")
    void shouldDeleteNotification() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        Notification n = new Notification(user, "BADGE_EARNED", "Badge!", "Msg", 10L);
        ReflectionTestUtils.setField(n, "id", 100L);
        when(notificationRepository.findByIdAndRecipientId(100L, 1L)).thenReturn(Optional.of(n));

        notificationService.deleteNotification("user@example.com", 100L);

        verify(notificationRepository).delete(n);
    }

    @Test
    @DisplayName("getPreferences creates default preferences if missing")
    void shouldReturnOrCreatePreferences() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(preferenceRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(preferenceRepository.save(any(UserNotificationPreference.class))).thenAnswer(i -> i.getArgument(0));

        NotificationPreferenceDTO prefs = notificationService.getPreferences("user@example.com");

        assertNotNull(prefs);
        assertTrue(prefs.emailNotificationsEnabled());
        assertFalse(prefs.browserNotificationsEnabled());
    }

    @Test
    @DisplayName("updatePreferences updates settings")
    void shouldUpdatePreferences() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        UserNotificationPreference existing = new UserNotificationPreference(user);
        when(preferenceRepository.findByUserId(1L)).thenReturn(Optional.of(existing));
        when(preferenceRepository.save(any(UserNotificationPreference.class))).thenAnswer(i -> i.getArgument(0));

        NotificationPreferenceDTO update = new NotificationPreferenceDTO(true, false, false, true, true, true);
        NotificationPreferenceDTO result = notificationService.updatePreferences("user@example.com", update);

        assertTrue(result.browserNotificationsEnabled());
        assertFalse(result.emailNotificationsEnabled());
        assertFalse(result.invitationAlerts());
    }

    @Test
    @DisplayName("createNotification saves in-app notification and skips email when badge alerts disabled")
    void shouldRespectPreferencesWhenCreatingNotification() {
        UserNotificationPreference pref = new UserNotificationPreference(user);
        pref.setBadgeAlerts(false);
        when(preferenceRepository.findByUserId(1L)).thenReturn(Optional.of(pref));

        notificationService.createNotification(user, "BADGE_EARNED", "New Badge Earned: Eco Warrior", "You earned Eco Warrior", 5L);

        // In-app notification must always be saved
        verify(notificationRepository).save(any(Notification.class));
        // Email must not be sent
        verify(emailService, never()).sendBadgeEarnedEmail(any(), any(), any(), any());
    }

    @Test
    @DisplayName("createNotification sends email when preferences allow")
    void shouldSendEmailWhenPreferencesEnabled() {
        UserNotificationPreference pref = new UserNotificationPreference(user);
        pref.setEmailNotificationsEnabled(true);
        pref.setBadgeAlerts(true);
        when(preferenceRepository.findByUserId(1L)).thenReturn(Optional.of(pref));

        notificationService.createNotification(user, "BADGE_EARNED", "New Badge Earned: Eco Warrior", "You earned Eco Warrior", 5L);

        verify(notificationRepository).save(any(Notification.class));
        verify(emailService).sendBadgeEarnedEmail(eq("user@example.com"), eq("testuser"), eq("Eco Warrior"), eq("You earned Eco Warrior"));
    }

    @Test
    @DisplayName("createNotification skips email when emailNotificationsEnabled is false")
    void shouldSkipEmailWhenMasterEmailPreferenceDisabled() {
        UserNotificationPreference pref = new UserNotificationPreference(user);
        pref.setEmailNotificationsEnabled(false);
        pref.setBadgeAlerts(true);
        when(preferenceRepository.findByUserId(1L)).thenReturn(Optional.of(pref));

        notificationService.createNotification(user, "BADGE_EARNED", "New Badge Earned: Eco Warrior", "You earned Eco Warrior", 5L);

        verify(notificationRepository).save(any(Notification.class));
        verify(emailService, never()).sendBadgeEarnedEmail(any(), any(), any(), any());
    }
}

