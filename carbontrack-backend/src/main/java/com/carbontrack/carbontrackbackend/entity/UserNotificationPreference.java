package com.carbontrack.carbontrackbackend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_notification_preferences")
public class UserNotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "browser_notifications_enabled", nullable = false)
    private boolean browserNotificationsEnabled = false;

    @Column(name = "email_notifications_enabled", nullable = false)
    private boolean emailNotificationsEnabled = true;

    @Column(name = "invitation_alerts", nullable = false)
    private boolean invitationAlerts = true;

    @Column(name = "badge_alerts", nullable = false)
    private boolean badgeAlerts = true;

    @Column(name = "achievement_alerts", nullable = false)
    private boolean achievementAlerts = true;

    @Column(name = "leaderboard_alerts", nullable = false)
    private boolean leaderboardAlerts = true;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public UserNotificationPreference() {}

    public UserNotificationPreference(User user) {
        this.user = user;
        this.browserNotificationsEnabled = false;
        this.emailNotificationsEnabled = true;
        this.invitationAlerts = true;
        this.badgeAlerts = true;
        this.achievementAlerts = true;
        this.leaderboardAlerts = true;
    }

    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public boolean isBrowserNotificationsEnabled() { return browserNotificationsEnabled; }
    public void setBrowserNotificationsEnabled(boolean browserNotificationsEnabled) {
        this.browserNotificationsEnabled = browserNotificationsEnabled;
    }

    public boolean isEmailNotificationsEnabled() { return emailNotificationsEnabled; }
    public void setEmailNotificationsEnabled(boolean emailNotificationsEnabled) {
        this.emailNotificationsEnabled = emailNotificationsEnabled;
    }

    public boolean isInvitationAlerts() { return invitationAlerts; }
    public void setInvitationAlerts(boolean invitationAlerts) { this.invitationAlerts = invitationAlerts; }

    public boolean isBadgeAlerts() { return badgeAlerts; }
    public void setBadgeAlerts(boolean badgeAlerts) { this.badgeAlerts = badgeAlerts; }

    public boolean isAchievementAlerts() { return achievementAlerts; }
    public void setAchievementAlerts(boolean achievementAlerts) { this.achievementAlerts = achievementAlerts; }

    public boolean isLeaderboardAlerts() { return leaderboardAlerts; }
    public void setLeaderboardAlerts(boolean leaderboardAlerts) { this.leaderboardAlerts = leaderboardAlerts; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

