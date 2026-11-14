package com.carbontrack.carbontrackbackend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EmailTemplateServiceTest {

    private EmailTemplateService templateService;

    @BeforeEach
    void setUp() {
        templateService = new EmailTemplateService();
    }

    @Test
    @DisplayName("Password reset email contains OTP, expiration, direct link and escapes malicious input")
    void shouldBuildPasswordResetEmailWithEscaping() {
        String xssPayload = "<script>alert('xss')</script>";
        String otp = "654321";
        String resetUrl = "http://localhost:5173/forgot-password";
        int expiryMinutes = 5;

        EmailTemplateService.HtmlAndText result = templateService.buildPasswordResetEmail(
                xssPayload, otp, resetUrl, expiryMinutes);

        assertNotNull(result);
        assertNotNull(result.html());
        assertNotNull(result.text());

        // Ensure XSS payload is safely escaped
        assertFalse(result.html().contains("<script>"));
        assertTrue(result.html().contains("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"));

        // Ensure critical fields are rendered
        assertTrue(result.html().contains(otp));
        assertTrue(result.html().contains("5 minutes"));
        assertTrue(result.html().contains("Reset Password"));
        assertTrue(result.html().contains(resetUrl));
        assertTrue(result.html().contains("Security Notice:"));

        // Text fallback
        assertTrue(result.text().contains("Your verification code is: " + otp));
        assertTrue(result.text().contains("5 minutes"));
        assertTrue(result.text().contains(resetUrl));
    }

    @Test
    @DisplayName("Organisation invitation email renders details and action button")
    void shouldBuildOrganisationInvitationEmail() {
        String invitee = "Alex Taylor";
        String orgName = "Green Energy Corp";
        String admin = "Sarah Connor";
        String acceptUrl = "http://localhost:5173/notifications";
        int expiryDays = 7;

        EmailTemplateService.HtmlAndText result = templateService.buildOrganisationInvitationEmail(
                invitee, orgName, admin, acceptUrl, expiryDays);

        assertTrue(result.html().contains("Alex Taylor"));
        assertTrue(result.html().contains("Green Energy Corp"));
        assertTrue(result.html().contains("Sarah Connor"));
        assertTrue(result.html().contains("Accept Invitation &amp; Join Team"));
        assertTrue(result.html().contains(acceptUrl));
        assertTrue(result.html().contains("7 days"));

        assertTrue(result.text().contains("Alex Taylor"));
        assertTrue(result.text().contains("Green Energy Corp"));
        assertTrue(result.text().contains(acceptUrl));
    }

    @Test
    @DisplayName("Invitation accepted email notifies admin")
    void shouldBuildInvitationAcceptedEmail() {
        EmailTemplateService.HtmlAndText result = templateService.buildInvitationAcceptedEmail(
                "Admin Jane", "John Doe", "john@example.com", "Eco Team", "http://localhost:5173/organisation");

        assertTrue(result.html().contains("Admin Jane"));
        assertTrue(result.html().contains("John Doe"));
        assertTrue(result.html().contains("john@example.com"));
        assertTrue(result.html().contains("Eco Team"));
        assertTrue(result.html().contains("View Organisation Dashboard"));

        assertTrue(result.text().contains("John Doe"));
        assertTrue(result.text().contains("john@example.com"));
    }

    @Test
    @DisplayName("Badge earned email displays badge title and description")
    void shouldBuildBadgeEarnedEmail() {
        EmailTemplateService.HtmlAndText result = templateService.buildBadgeEarnedEmail(
                "Sam Green", "Eco Commuter", "Logged 10 public transit trips.", "http://localhost:5173/achievements");

        assertTrue(result.html().contains("Sam Green"));
        assertTrue(result.html().contains("Eco Commuter"));
        assertTrue(result.html().contains("Logged 10 public transit trips."));
        assertTrue(result.html().contains("View Your Badges &amp; Achievements"));

        assertTrue(result.text().contains("Eco Commuter"));
        assertTrue(result.text().contains("Logged 10 public transit trips."));
    }

    @Test
    @DisplayName("Achievement unlocked email displays medal details")
    void shouldBuildAchievementUnlockedEmail() {
        EmailTemplateService.HtmlAndText result = templateService.buildAchievementUnlockedEmail(
                "Sam Green", "Gold Leaf", "Top 1 on monthly community leaderboard.", "http://localhost:5173/achievements");

        assertTrue(result.html().contains("Gold Leaf"));
        assertTrue(result.html().contains("Top 1 on monthly community leaderboard."));
        assertTrue(result.html().contains("View Achievements Showcase"));

        assertTrue(result.text().contains("Gold Leaf"));
    }

    @Test
    @DisplayName("Leaderboard alert email renders rank and period")
    void shouldBuildLeaderboardAlertEmail() {
        EmailTemplateService.HtmlAndText result = templateService.buildLeaderboardAlertEmail(
                "Sam Green", "Community", 2, "Monthly", "http://localhost:5173/leaderboard");

        assertTrue(result.html().contains("Rank #2"));
        assertTrue(result.html().contains("Monthly"));
        assertTrue(result.html().contains("Community"));
        assertTrue(result.html().contains("View Full Leaderboard"));

        assertTrue(result.text().contains("Rank #2") || result.text().contains("#2"));
    }

    @Test
    @DisplayName("Goal alert email highlights budget exceeded status")
    void shouldBuildGoalAlertEmailWithStatusStyling() {
        EmailTemplateService.HtmlAndText activeResult = templateService.buildGoalAlertEmail(
                "Sam Green", "Reduce Commute CO2", "Transport", 75.0, "ACTIVE", "http://localhost:5173/goals");
        assertTrue(activeResult.html().contains("Goal Progress Update"));
        assertTrue(activeResult.html().contains("75.0%"));

        EmailTemplateService.HtmlAndText exceededResult = templateService.buildGoalAlertEmail(
                "Sam Green", "Monthly Fuel Limit", "Transport", 112.5, "EXCEEDED", "http://localhost:5173/goals");
        assertTrue(exceededResult.html().contains("Budget Alert: Target Exceeded"));
        assertTrue(exceededResult.html().contains("112.5%"));
    }

    @Test
    @DisplayName("General notification email renders custom title and action link")
    void shouldBuildGeneralNotificationEmail() {
        EmailTemplateService.HtmlAndText result = templateService.buildGeneralNotificationEmail(
                "Sam Green", "Profile Updated", "Your changes have been saved.", "Open Profile", "http://localhost:5173/profile");

        assertTrue(result.html().contains("Profile Updated"));
        assertTrue(result.html().contains("Your changes have been saved."));
        assertTrue(result.html().contains("Open Profile"));

        assertTrue(result.text().contains("Profile Updated"));
        assertTrue(result.text().contains("Your changes have been saved."));
    }

    @Test
    @DisplayName("Generate sample email HTML files for visual verification")
    void generateSampleHtmlFiles() throws Exception {
        java.nio.file.Path previewDir = java.nio.file.Paths.get("target", "email-previews");
        java.nio.file.Files.createDirectories(previewDir);

        // 1. Password Reset
        var reset = templateService.buildPasswordResetEmail("Dr. Alex Rivera", "482915", "http://localhost:5173/reset-password?email=dr.alex%40example.com", 5);
        java.nio.file.Files.writeString(previewDir.resolve("01_password_reset.html"), reset.html());
        java.nio.file.Files.writeString(previewDir.resolve("01_password_reset.txt"), reset.text());

        // 2. Organisation Invitation
        var inv = templateService.buildOrganisationInvitationEmail("Maya Lin", "GreenFuture Energy Corp", "Sarah Jenkins", "http://localhost:5173/notifications", 7);
        java.nio.file.Files.writeString(previewDir.resolve("02_org_invitation.html"), inv.html());

        // 3. Invitation Accepted
        var accepted = templateService.buildInvitationAcceptedEmail("Sarah Jenkins", "Maya Lin", "maya.lin@greenfuture.com", "GreenFuture Energy Corp", "http://localhost:5173/organisation");
        java.nio.file.Files.writeString(previewDir.resolve("03_invitation_accepted.html"), accepted.html());

        // 4. Badge Earned
        var badge = templateService.buildBadgeEarnedEmail("David Chen", "Zero Waste Champion", "Logged 30 consecutive zero waste practices across food and consumption.", "http://localhost:5173/achievements");
        java.nio.file.Files.writeString(previewDir.resolve("04_badge_earned.html"), badge.html());

        // 5. Leaderboard Achievement
        var medal = templateService.buildAchievementUnlockedEmail("Elena Rostova", "Gold Leaf Trophy", "Achieved Rank #1 on the Monthly Community Leaderboard with 1,240 kg CO2e saved.", "http://localhost:5173/achievements");
        java.nio.file.Files.writeString(previewDir.resolve("05_leaderboard_medal.html"), medal.html());

        // 6. Leaderboard Standing Alert
        var leaderboard = templateService.buildLeaderboardAlertEmail("Elena Rostova", "Community", 1, "Monthly", "http://localhost:5173/leaderboard");
        java.nio.file.Files.writeString(previewDir.resolve("06_leaderboard_alert.html"), leaderboard.html());

        // 7. Goal Progress & Exceeded Alert
        var goalExceeded = templateService.buildGoalAlertEmail("Marcus Vance", "Monthly Flight Emissions Cap", "Transport", 115.8, "EXCEEDED", "http://localhost:5173/goals");
        java.nio.file.Files.writeString(previewDir.resolve("07_goal_exceeded.html"), goalExceeded.html());

        assertTrue(java.nio.file.Files.exists(previewDir.resolve("01_password_reset.html")));
    }
}
