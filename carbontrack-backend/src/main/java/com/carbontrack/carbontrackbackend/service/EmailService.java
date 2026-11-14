package com.carbontrack.carbontrackbackend.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final EmailTemplateService templateService;
    private final String sender;
    private final String frontendUrl;

    @Autowired
    public EmailService(
            JavaMailSender mailSender,
            EmailTemplateService templateService,
            @Value("${spring.mail.username:}") String sender,
            @Value("${app.frontend.url:http://localhost:5173}") String frontendUrl) {
        this.mailSender = mailSender;
        this.templateService = templateService != null ? templateService : new EmailTemplateService();
        this.sender = sender != null ? sender.trim() : "";
        this.frontendUrl = (frontendUrl != null && !frontendUrl.isBlank())
                ? frontendUrl.trim().replaceAll("/+$", "")
                : "http://localhost:5173";
    }

    public EmailService(
            JavaMailSender mailSender,
            String sender) {
        this(mailSender, new EmailTemplateService(), sender, "http://localhost:5173");
    }

    /**
     * Dispatches an email using MimeMessageHelper with multipart/alternative (plain text + branded HTML).
     */
    public void sendMimeEmail(String to, String subject, EmailTemplateService.HtmlAndText content) {
        if (sender == null || sender.isBlank()) {
            logger.warn("SMTP username is not configured (MAIL_USERNAME is empty). Email [{}] could not be dispatched.", subject);
            return;
        }

        if (to == null || to.isBlank()) {
            logger.warn("Recipient address is empty. Email [{}] could not be dispatched.", subject);
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());

            helper.setFrom(sender, "CarbonTrack");
            helper.setTo(to.trim());
            helper.setSubject(subject);
            helper.setText(content.text(), content.html());

            mailSender.send(mimeMessage);
            logger.info("Email [{}] successfully dispatched via SMTP.", subject);
        } catch (MailException ex) {
            logger.error("Failed to deliver email [{}] via SMTP ({}). Verify MAIL_USERNAME and MAIL_PASSWORD configuration.",
                    subject, ex.getClass().getSimpleName());
        } catch (Exception ex) {
            logger.error("Unexpected error during email [{}] dispatch: {}", subject, ex.getClass().getSimpleName());
        }
    }

    /**
     * Phase 1: Password Reset Verification Email with branded OTP block and reset URL.
     */
    public void sendPasswordResetEmail(String to, String displayName, String otp, int expiryMinutes) {
        String encodedEmail = java.net.URLEncoder.encode(to != null ? to.trim() : "", java.nio.charset.StandardCharsets.UTF_8);
        String resetUrl = frontendUrl + "/reset-password?email=" + encodedEmail;
        EmailTemplateService.HtmlAndText content = templateService.buildPasswordResetEmail(
                displayName, otp, resetUrl, expiryMinutes);
        sendMimeEmail(to, "CarbonTrack Password Reset Verification", content);
    }

    /**
     * Backward-compatible helper method for password reset OTP dispatch.
     */
    public void sendPasswordResetOTP(String recipient, String otp) {
        sendPasswordResetEmail(recipient, null, otp, 5);
    }

    /**
     * Phase 2.1: Organisation Invitation Email.
     */
    public void sendOrganisationInvitationEmail(String to, String inviteeName, String orgName, String adminName, String acceptUrl, int expiryDays) {
        String effectiveUrl = (acceptUrl != null && !acceptUrl.isBlank()) ? acceptUrl : (frontendUrl + "/notifications");
        EmailTemplateService.HtmlAndText content = templateService.buildOrganisationInvitationEmail(
                inviteeName, orgName, adminName, effectiveUrl, expiryDays);
        sendMimeEmail(to, "Invitation to Join " + orgName + " on CarbonTrack", content);
    }

    /**
     * Phase 2.2: Organisation Invitation Accepted Notification to Admin.
     */
    public void sendInvitationAcceptedEmail(String to, String adminName, String memberName, String memberEmail, String orgName) {
        String dashboardUrl = frontendUrl + "/organisation";
        EmailTemplateService.HtmlAndText content = templateService.buildInvitationAcceptedEmail(
                adminName, memberName, memberEmail, orgName, dashboardUrl);
        sendMimeEmail(to, memberName + " Joined " + orgName + " on CarbonTrack", content);
    }

    /**
     * Phase 2.3: Badge Earned Email.
     */
    public void sendBadgeEarnedEmail(String to, String recipientName, String badgeName, String badgeDescription) {
        String achievementsUrl = frontendUrl + "/achievements";
        EmailTemplateService.HtmlAndText content = templateService.buildBadgeEarnedEmail(
                recipientName, badgeName, badgeDescription, achievementsUrl);
        sendMimeEmail(to, "Milestone Reached: " + badgeName + " Badge Unlocked!", content);
    }

    /**
     * Phase 2.4: Leaderboard Achievement Claimed Email.
     */
    public void sendAchievementUnlockedEmail(String to, String recipientName, String medalName, String details) {
        String achievementsUrl = frontendUrl + "/achievements";
        EmailTemplateService.HtmlAndText content = templateService.buildAchievementUnlockedEmail(
                recipientName, medalName, details, achievementsUrl);
        sendMimeEmail(to, "Achievement Claimed: " + medalName, content);
    }

    /**
     * Phase 2.5: Leaderboard Rank Notification Email.
     */
    public void sendLeaderboardAlertEmail(String to, String recipientName, String scope, int rank, String period) {
        String leaderboardUrl = frontendUrl + "/leaderboard";
        EmailTemplateService.HtmlAndText content = templateService.buildLeaderboardAlertEmail(
                recipientName, scope, rank, period, leaderboardUrl);
        sendMimeEmail(to, "Leaderboard Update: You Reached Rank #" + rank + " (" + scope + ")", content);
    }

    /**
     * Phase 2.6: Sustainability Goal Progress / Exceeded Alert Email.
     */
    public void sendGoalAlertEmail(String to, String recipientName, String goalTitle, String category, double progressPct, String status) {
        String goalsUrl = frontendUrl + "/goals";
        EmailTemplateService.HtmlAndText content = templateService.buildGoalAlertEmail(
                recipientName, goalTitle, category, progressPct, status, goalsUrl);
        String subject = "EXCEEDED".equalsIgnoreCase(status)
                ? "CarbonTrack Budget Alert: " + goalTitle + " Target Exceeded"
                : "CarbonTrack Goal Update: " + goalTitle;
        sendMimeEmail(to, subject, content);
    }

    /**
     * Phase 2.7: General Account & System Notification Email.
     */
    public void sendGeneralNotificationEmail(String to, String recipientName, String title, String message, String actionTitle, String actionUrl) {
        String effectiveUrl = (actionUrl != null && !actionUrl.isBlank())
                ? (actionUrl.startsWith("http") ? actionUrl : frontendUrl + actionUrl)
                : (frontendUrl + "/notifications");
        EmailTemplateService.HtmlAndText content = templateService.buildGeneralNotificationEmail(
                recipientName, title, message, actionTitle, effectiveUrl);
        sendMimeEmail(to, title, content);
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }

    public String getSender() {
        return sender;
    }
}
