package com.carbontrack.carbontrackbackend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class EmailTemplateService {

    public record HtmlAndText(String html, String text) {}

    // Brand Colors
    private static final String COLOR_PRIMARY = "#1b4332"; // Deep Forest Green
    private static final String COLOR_ACCENT = "#2e7d32";  // Vibrant Green Accent
    private static final String COLOR_TINT = "#f0fdf4";    // Soft Green Highlight Background
    private static final String COLOR_BORDER = "#e2e8f0";  // Subtle Gray Border
    private static final String COLOR_TEXT = "#334155";    // Readable Slate Text
    private static final String COLOR_MUTED = "#64748b";   // Neutral Secondary Text

    /**
     * Phase 1: Professional Password Reset Email Template.
     */
    public HtmlAndText buildPasswordResetEmail(String rawRecipientName, String rawOtp, String rawResetUrl, int expiryMinutes) {
        String name = escape(rawRecipientName != null && !rawRecipientName.isBlank() ? rawRecipientName : "CarbonTrack Member");
        String otp = escape(rawOtp);
        String resetUrl = rawResetUrl != null ? rawResetUrl.trim() : "";
        String safeResetUrl = escape(resetUrl);

        String heading = "Reset Your Password";
        String previewText = "Your CarbonTrack password reset code is " + otp;

        StringBuilder html = new StringBuilder();
        html.append(startLayout(previewText));
        html.append(brandHeader("Password Assistance"));
        html.append("<h2 style=\"font-size: 20px; font-weight: 700; color: ").append(COLOR_PRIMARY).append("; margin: 0 0 16px 0;\">")
            .append(heading).append("</h2>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">Hello <strong>")
            .append(name).append("</strong>,</p>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">")
            .append("We received a request to reset the password associated with your CarbonTrack account. Use the verification code below to complete the reset:")
            .append("</p>");

        // Prominent OTP Code Block
        html.append("<div style=\"background-color: ").append(COLOR_TINT).append("; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;\">")
            .append("<div style=\"font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #166534; font-weight: 700; margin-bottom: 8px;\">Verification Code</div>")
            .append("<div style=\"font-size: 32px; font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-weight: 800; letter-spacing: 6px; color: ").append(COLOR_PRIMARY).append(";\">")
            .append(otp)
            .append("</div>")
            .append("<div style=\"font-size: 13px; color: #15803d; margin-top: 8px;\">⏱ Valid for ").append(expiryMinutes).append(" minutes</div>")
            .append("</div>");

        // Action Button
        if (!resetUrl.isBlank()) {
            html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">")
                .append("Or click the button below to directly open the reset page:")
                .append("</p>");
            html.append(actionButton("Reset Password", safeResetUrl));
            html.append("<div style=\"background-color: #f8fafc; border: 1px solid ").append(COLOR_BORDER).append("; border-radius: 6px; padding: 12px; margin: 16px 0 24px 0; font-size: 12px; color: ").append(COLOR_MUTED).append(";\">")
                .append("<strong>Direct link:</strong><br/>")
                .append("<a href=\"").append(safeResetUrl).append("\" style=\"color: ").append(COLOR_ACCENT).append("; word-break: break-all; text-decoration: underline;\">")
                .append(safeResetUrl)
                .append("</a>")
                .append("</div>");
        }

        // Security Warning
        html.append("<div style=\"border-left: 4px solid #f59e0b; background-color: #fffbeb; padding: 12px 16px; border-radius: 4px; margin: 24px 0; font-size: 13px; color: #92400e;\">")
            .append("<strong>Security Notice:</strong> If you did not initiate this request, you can safely disregard this email. Your password will remain unchanged, and your account remains secure.")
            .append("</div>");

        html.append(endLayout());

        // Text Fallback
        StringBuilder text = new StringBuilder();
        text.append("CarbonTrack - Password Reset\n");
        text.append("=========================================\n\n");
        text.append("Hello ").append(rawRecipientName != null ? rawRecipientName : "CarbonTrack Member").append(",\n\n");
        text.append("We received a request to reset your CarbonTrack account password.\n\n");
        text.append("Your verification code is: ").append(rawOtp).append("\n");
        text.append("This code is valid for ").append(expiryMinutes).append(" minutes.\n\n");
        if (!resetUrl.isBlank()) {
            text.append("Reset link: ").append(resetUrl).append("\n\n");
        }
        text.append("If you did not request this password reset, please ignore this email.\n\n");
        text.append("CarbonTrack Sustainability Platform\n");

        return new HtmlAndText(html.toString(), text.toString());
    }

    /**
     * Phase 2.1: Organisation Invitation Email Template.
     */
    public HtmlAndText buildOrganisationInvitationEmail(String rawInviteeName, String rawOrgName, String rawAdminName, String rawAcceptUrl, int expiryDays) {
        String invitee = escape(rawInviteeName != null && !rawInviteeName.isBlank() ? rawInviteeName : "Future Member");
        String orgName = escape(rawOrgName);
        String adminName = escape(rawAdminName);
        String acceptUrl = rawAcceptUrl != null ? rawAcceptUrl.trim() : "";
        String safeAcceptUrl = escape(acceptUrl);

        String heading = "Invitation to Join " + orgName;
        String previewText = adminName + " invited you to join " + rawOrgName + " on CarbonTrack.";

        StringBuilder html = new StringBuilder();
        html.append(startLayout(previewText));
        html.append(brandHeader("Organisation Team Invitation"));
        html.append("<h2 style=\"font-size: 20px; font-weight: 700; color: ").append(COLOR_PRIMARY).append("; margin: 0 0 16px 0;\">")
            .append(heading).append("</h2>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">Hello <strong>")
            .append(invitee).append("</strong>,</p>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">")
            .append("<strong>").append(adminName).append("</strong> has invited you to join the sustainability team for <strong>")
            .append(orgName).append("</strong> on CarbonTrack.")
            .append("</p>");

        // Benefits Card
        html.append("<div style=\"background-color: ").append(COLOR_TINT).append("; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin: 20px 0;\">")
            .append("<div style=\"font-size: 14px; font-weight: 700; color: ").append(COLOR_PRIMARY).append("; margin-bottom: 8px;\">As an organisation member, you can:</div>")
            .append("<ul style=\"margin: 0; padding-left: 20px; font-size: 13px; color: ").append(COLOR_TEXT).append("; line-height: 1.6;\">")
            .append("<li>Contribute verified carbon footprint logs toward corporate ESG benchmarks.</li>")
            .append("<li>Participate in internal organisation leaderboards and team challenges.</li>")
            .append("<li>Track collaborative carbon reduction and unlock sustainability achievements.</li>")
            .append("</ul>")
            .append("<div style=\"font-size: 12px; color: #15803d; margin-top: 10px;\">⏱ This invitation expires in ").append(expiryDays).append(" days.</div>")
            .append("</div>");

        // Action Button
        if (!acceptUrl.isBlank()) {
            html.append(actionButton("Accept Invitation & Join Team", safeAcceptUrl));
            html.append("<div style=\"background-color: #f8fafc; border: 1px solid ").append(COLOR_BORDER).append("; border-radius: 6px; padding: 12px; margin: 16px 0 20px 0; font-size: 12px; color: ").append(COLOR_MUTED).append(";\">")
                .append("<strong>Direct link:</strong><br/>")
                .append("<a href=\"").append(safeAcceptUrl).append("\" style=\"color: ").append(COLOR_ACCENT).append("; word-break: break-all; text-decoration: underline;\">")
                .append(safeAcceptUrl)
                .append("</a>")
                .append("</div>");
        }

        html.append(endLayout());

        StringBuilder text = new StringBuilder();
        text.append("CarbonTrack - Team Invitation\n");
        text.append("=========================================\n\n");
        text.append("Hello ").append(rawInviteeName != null ? rawInviteeName : "Future Member").append(",\n\n");
        text.append(rawAdminName).append(" has invited you to join ").append(rawOrgName).append(" on CarbonTrack.\n\n");
        if (!acceptUrl.isBlank()) {
            text.append("Accept your invitation here: ").append(acceptUrl).append("\n\n");
        }
        text.append("This invitation expires in ").append(expiryDays).append(" days.\n\n");
        text.append("CarbonTrack Sustainability Platform\n");

        return new HtmlAndText(html.toString(), text.toString());
    }

    /**
     * Phase 2.2: Organisation Invitation Accepted Notification Template (sent to admin).
     */
    public HtmlAndText buildInvitationAcceptedEmail(String rawAdminName, String rawMemberName, String rawMemberEmail, String rawOrgName, String rawDashboardUrl) {
        String admin = escape(rawAdminName != null && !rawAdminName.isBlank() ? rawAdminName : "Admin");
        String memberName = escape(rawMemberName);
        String memberEmail = escape(rawMemberEmail);
        String orgName = escape(rawOrgName);
        String dashboardUrl = rawDashboardUrl != null ? rawDashboardUrl.trim() : "";
        String safeDashboardUrl = escape(dashboardUrl);

        String heading = "New Member Joined " + orgName;
        String previewText = rawMemberName + " has accepted your invitation to join " + rawOrgName + ".";

        StringBuilder html = new StringBuilder();
        html.append(startLayout(previewText));
        html.append(brandHeader("Team Membership Update"));
        html.append("<h2 style=\"font-size: 20px; font-weight: 700; color: ").append(COLOR_PRIMARY).append("; margin: 0 0 16px 0;\">")
            .append(heading).append("</h2>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">Hello <strong>")
            .append(admin).append("</strong>,</p>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">")
            .append("Great news! <strong>").append(memberName).append("</strong> (").append(memberEmail).append(") has accepted your invitation and is now an active member of <strong>")
            .append(orgName).append("</strong>.")
            .append("</p>");

        html.append("<div style=\"background-color: #f8fafc; border: 1px solid ").append(COLOR_BORDER).append("; border-radius: 8px; padding: 16px; margin: 20px 0;\">")
            .append("<div style=\"font-size: 13px; color: ").append(COLOR_TEXT).append(";\">")
            .append("<strong>Member:</strong> ").append(memberName).append("<br/>")
            .append("<strong>Email:</strong> ").append(memberEmail).append("<br/>")
            .append("<strong>Organisation:</strong> ").append(orgName).append("<br/>")
            .append("<strong>Status:</strong> Active Member")
            .append("</div>")
            .append("</div>");

        if (!dashboardUrl.isBlank()) {
            html.append(actionButton("View Organisation Dashboard", safeDashboardUrl));
        }

        html.append(endLayout());

        StringBuilder text = new StringBuilder();
        text.append("CarbonTrack - Invitation Accepted\n");
        text.append("=========================================\n\n");
        text.append("Hello ").append(rawAdminName).append(",\n\n");
        text.append(rawMemberName).append(" (").append(rawMemberEmail).append(") has accepted your invitation to join ").append(rawOrgName).append(".\n\n");
        if (!dashboardUrl.isBlank()) {
            text.append("View your organisation: ").append(dashboardUrl).append("\n\n");
        }
        text.append("CarbonTrack Sustainability Platform\n");

        return new HtmlAndText(html.toString(), text.toString());
    }

    /**
     * Phase 2.3: Badge Earned Email Template.
     */
    public HtmlAndText buildBadgeEarnedEmail(String rawRecipientName, String rawBadgeName, String rawBadgeDescription, String rawAchievementsUrl) {
        String name = escape(rawRecipientName != null && !rawRecipientName.isBlank() ? rawRecipientName : "Sustainability Champion");
        String badgeName = escape(rawBadgeName);
        String badgeDesc = escape(rawBadgeDescription != null ? rawBadgeDescription : "A new milestone achieved on your carbon reduction journey.");
        String achievementsUrl = rawAchievementsUrl != null ? rawAchievementsUrl.trim() : "";
        String safeUrl = escape(achievementsUrl);

        String heading = "Badge Unlocked: " + badgeName;
        String previewText = "Congratulations! You earned the " + rawBadgeName + " badge on CarbonTrack.";

        StringBuilder html = new StringBuilder();
        html.append(startLayout(previewText));
        html.append(brandHeader("Milestone Achievement"));
        html.append("<h2 style=\"font-size: 20px; font-weight: 700; color: ").append(COLOR_PRIMARY).append("; margin: 0 0 16px 0;\">")
            .append(heading).append("</h2>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">Hello <strong>")
            .append(name).append("</strong>,</p>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">")
            .append("Congratulations! Your dedicated sustainability efforts have unlocked a new badge:")
            .append("</p>");

        // Badge Showcase Box
        html.append("<div style=\"background-color: ").append(COLOR_TINT).append("; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;\">")
            .append("<div style=\"font-size: 36px; margin-bottom: 8px;\">🏅</div>")
            .append("<div style=\"font-size: 18px; font-weight: 700; color: ").append(COLOR_PRIMARY).append("; margin-bottom: 6px;\">").append(badgeName).append("</div>")
            .append("<div style=\"font-size: 13px; color: ").append(COLOR_TEXT).append("; max-width: 440px; margin: 0 auto;\">").append(badgeDesc).append("</div>")
            .append("</div>");

        if (!achievementsUrl.isBlank()) {
            html.append(actionButton("View Your Badges & Achievements", safeUrl));
        }

        html.append(endLayout());

        StringBuilder text = new StringBuilder();
        text.append("CarbonTrack - Badge Unlocked!\n");
        text.append("=========================================\n\n");
        text.append("Hello ").append(rawRecipientName).append(",\n\n");
        text.append("Congratulations! You earned the ").append(rawBadgeName).append(" badge on CarbonTrack.\n\n");
        text.append("Description: ").append(rawBadgeDescription).append("\n\n");
        if (!achievementsUrl.isBlank()) {
            text.append("View your achievements: ").append(achievementsUrl).append("\n\n");
        }
        text.append("CarbonTrack Sustainability Platform\n");

        return new HtmlAndText(html.toString(), text.toString());
    }

    /**
     * Phase 2.4: Achievement Unlocked Template (e.g. Leaderboard Gold/Silver/Bronze Leaf).
     */
    public HtmlAndText buildAchievementUnlockedEmail(String rawRecipientName, String rawMedalName, String rawDetails, String rawAchievementsUrl) {
        String name = escape(rawRecipientName != null && !rawRecipientName.isBlank() ? rawRecipientName : "Champion");
        String medal = escape(rawMedalName);
        String details = escape(rawDetails != null ? rawDetails : "You claimed a top tier achievement on the CarbonTrack leaderboard.");
        String safeUrl = escape(rawAchievementsUrl != null ? rawAchievementsUrl.trim() : "");

        String heading = "Achievement Claimed: " + medal;
        String previewText = "You claimed the " + rawMedalName + " achievement on CarbonTrack.";

        StringBuilder html = new StringBuilder();
        html.append(startLayout(previewText));
        html.append(brandHeader("Leaderboard Achievement"));
        html.append("<h2 style=\"font-size: 20px; font-weight: 700; color: ").append(COLOR_PRIMARY).append("; margin: 0 0 16px 0;\">")
            .append(heading).append("</h2>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">Hello <strong>")
            .append(name).append("</strong>,</p>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">")
            .append("Outstanding work! You have officially claimed an achievement for your performance:")
            .append("</p>");

        html.append("<div style=\"background-color: ").append(COLOR_TINT).append("; border: 1px solid #bbf7d0; border-radius: 8px; padding: 22px; text-align: center; margin: 20px 0;\">")
            .append("<div style=\"font-size: 36px; margin-bottom: 6px;\">🍃</div>")
            .append("<div style=\"font-size: 18px; font-weight: 700; color: ").append(COLOR_PRIMARY).append("; margin-bottom: 6px;\">").append(medal).append("</div>")
            .append("<div style=\"font-size: 13px; color: ").append(COLOR_TEXT).append(";\">").append(details).append("</div>")
            .append("</div>");

        if (!safeUrl.isBlank()) {
            html.append(actionButton("View Achievements Showcase", safeUrl));
        }

        html.append(endLayout());

        StringBuilder text = new StringBuilder();
        text.append("CarbonTrack - Achievement Claimed\n");
        text.append("=========================================\n\n");
        text.append("Hello ").append(rawRecipientName).append(",\n\n");
        text.append("You claimed the ").append(rawMedalName).append(" achievement on CarbonTrack.\n\n");
        text.append(rawDetails).append("\n\n");
        if (!safeUrl.isBlank()) {
            text.append("View your achievements: ").append(safeUrl).append("\n\n");
        }
        text.append("CarbonTrack Sustainability Platform\n");

        return new HtmlAndText(html.toString(), text.toString());
    }

    /**
     * Phase 2.5: Leaderboard Alert Template.
     */
    public HtmlAndText buildLeaderboardAlertEmail(String rawRecipientName, String rawScope, int rank, String rawPeriod, String rawLeaderboardUrl) {
        String name = escape(rawRecipientName != null && !rawRecipientName.isBlank() ? rawRecipientName : "Member");
        String scope = escape(rawScope != null ? rawScope : "Community");
        String period = escape(rawPeriod != null ? rawPeriod : "Monthly");
        String safeUrl = escape(rawLeaderboardUrl != null ? rawLeaderboardUrl.trim() : "");

        String heading = "Rank #" + rank + " on the " + scope + " Leaderboard";
        String previewText = "You reached Rank #" + rank + " on the " + period + " " + scope + " Leaderboard.";

        StringBuilder html = new StringBuilder();
        html.append(startLayout(previewText));
        html.append(brandHeader("Leaderboard Standing"));
        html.append("<h2 style=\"font-size: 20px; font-weight: 700; color: ").append(COLOR_PRIMARY).append("; margin: 0 0 16px 0;\">")
            .append(heading).append("</h2>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">Hello <strong>")
            .append(name).append("</strong>,</p>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">")
            .append("Your verified sustainability actions placed you at <strong>Rank #").append(rank).append("</strong> on the ")
            .append(period).append(" ").append(scope).append(" Leaderboard!")
            .append("</p>");

        html.append("<div style=\"background-color: ").append(COLOR_TINT).append("; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;\">")
            .append("<div style=\"font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #166534; font-weight: 700;\">").append(period).append(" Rank</div>")
            .append("<div style=\"font-size: 32px; font-weight: 800; color: ").append(COLOR_PRIMARY).append("; margin: 6px 0;\">#").append(rank).append("</div>")
            .append("<div style=\"font-size: 13px; color: ").append(COLOR_TEXT).append(";\">Keep logging sustainable choices to stay on top!</div>")
            .append("</div>");

        if (!safeUrl.isBlank()) {
            html.append(actionButton("View Full Leaderboard", safeUrl));
        }

        html.append(endLayout());

        StringBuilder text = new StringBuilder();
        text.append("CarbonTrack - Leaderboard Update\n");
        text.append("=========================================\n\n");
        text.append("Hello ").append(rawRecipientName).append(",\n\n");
        text.append("You are currently ranked #").append(rank).append(" on the ").append(period).append(" ").append(scope).append(" Leaderboard.\n\n");
        if (!safeUrl.isBlank()) {
            text.append("View leaderboard: ").append(safeUrl).append("\n\n");
        }
        text.append("CarbonTrack Sustainability Platform\n");

        return new HtmlAndText(html.toString(), text.toString());
    }

    /**
     * Phase 2.6: Sustainability Goal Progress & Budget Alert Template.
     */
    public HtmlAndText buildGoalAlertEmail(String rawRecipientName, String rawGoalTitle, String rawCategory, double progressPct, String rawStatus, String rawGoalsUrl) {
        String name = escape(rawRecipientName != null && !rawRecipientName.isBlank() ? rawRecipientName : "Member");
        String title = escape(rawGoalTitle);
        String category = escape(rawCategory != null ? rawCategory : "All");
        String status = escape(rawStatus != null ? rawStatus : "ACTIVE");
        String safeUrl = escape(rawGoalsUrl != null ? rawGoalsUrl.trim() : "");

        boolean isExceeded = "EXCEEDED".equalsIgnoreCase(rawStatus);
        String toneColor = isExceeded ? "#dc2626" : COLOR_PRIMARY;
        String toneBg = isExceeded ? "#fee2e2" : COLOR_TINT;
        String toneBorder = isExceeded ? "#fca5a5" : "#bbf7d0";

        String heading = isExceeded ? "Budget Alert: Target Exceeded" : "Goal Progress Update";
        String previewText = "Update on your sustainability goal: " + rawGoalTitle;

        StringBuilder html = new StringBuilder();
        html.append(startLayout(previewText));
        html.append(brandHeader("Goal Tracking Alert"));
        html.append("<h2 style=\"font-size: 20px; font-weight: 700; color: ").append(toneColor).append("; margin: 0 0 16px 0;\">")
            .append(heading).append("</h2>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">Hello <strong>")
            .append(name).append("</strong>,</p>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">")
            .append("Here is an automated update on your sustainability goal <strong>\"").append(title).append("\"</strong> (Category: ").append(category).append("):")
            .append("</p>");

        html.append("<div style=\"background-color: ").append(toneBg).append("; border: 1px solid ").append(toneBorder).append("; border-radius: 8px; padding: 20px; margin: 20px 0;\">")
            .append("<div style=\"font-size: 13px; color: ").append(COLOR_TEXT).append(";\">")
            .append("<strong>Goal:</strong> ").append(title).append("<br/>")
            .append("<strong>Category:</strong> ").append(category).append("<br/>")
            .append("<strong>Status:</strong> ").append(status).append("<br/>")
            .append("<strong>Progress:</strong> ").append(String.format("%.1f%%", progressPct))
            .append("</div>")
            .append("</div>");

        if (!safeUrl.isBlank()) {
            html.append(actionButton("View Your Goals", safeUrl));
        }

        html.append(endLayout());

        StringBuilder text = new StringBuilder();
        text.append("CarbonTrack - Goal Progress Update\n");
        text.append("=========================================\n\n");
        text.append("Hello ").append(rawRecipientName).append(",\n\n");
        text.append("Goal: ").append(rawGoalTitle).append("\n");
        text.append("Category: ").append(rawCategory).append("\n");
        text.append("Status: ").append(rawStatus).append("\n");
        text.append("Progress: ").append(String.format("%.1f%%", progressPct)).append("\n\n");
        if (!safeUrl.isBlank()) {
            text.append("View your goals: ").append(safeUrl).append("\n\n");
        }
        text.append("CarbonTrack Sustainability Platform\n");

        return new HtmlAndText(html.toString(), text.toString());
    }

    /**
     * Phase 2.7: General Account & System Notifications.
     */
    public HtmlAndText buildGeneralNotificationEmail(String rawRecipientName, String rawTitle, String rawMessage, String rawActionTitle, String rawActionUrl) {
        String name = escape(rawRecipientName != null && !rawRecipientName.isBlank() ? rawRecipientName : "Member");
        String title = escape(rawTitle);
        String message = escape(rawMessage);
        String actionTitle = escape(rawActionTitle != null ? rawActionTitle : "Open CarbonTrack");
        String safeUrl = escape(rawActionUrl != null ? rawActionUrl.trim() : "");

        StringBuilder html = new StringBuilder();
        html.append(startLayout(title));
        html.append(brandHeader("Account Notification"));
        html.append("<h2 style=\"font-size: 20px; font-weight: 700; color: ").append(COLOR_PRIMARY).append("; margin: 0 0 16px 0;\">")
            .append(title).append("</h2>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">Hello <strong>")
            .append(name).append("</strong>,</p>");
        html.append("<p style=\"margin: 0 0 16px 0; color: ").append(COLOR_TEXT).append(";\">")
            .append(message)
            .append("</p>");

        if (!safeUrl.isBlank()) {
            html.append(actionButton(actionTitle, safeUrl));
        }

        html.append(endLayout());

        StringBuilder text = new StringBuilder();
        text.append("CarbonTrack - ").append(rawTitle).append("\n");
        text.append("=========================================\n\n");
        text.append("Hello ").append(rawRecipientName).append(",\n\n");
        text.append(rawMessage).append("\n\n");
        if (!safeUrl.isBlank()) {
            text.append(rawActionTitle != null ? rawActionTitle : "Link").append(": ").append(rawActionUrl).append("\n\n");
        }
        text.append("CarbonTrack Sustainability Platform\n");

        return new HtmlAndText(html.toString(), text.toString());
    }

    // --- Layout and Component Builders ---

    private String startLayout(String previewText) {
        return "<!DOCTYPE html>\n" +
               "<html lang=\"en\">\n" +
               "<head>\n" +
               "  <meta charset=\"UTF-8\" />\n" +
               "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n" +
               "  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\" />\n" +
               "  <title>CarbonTrack</title>\n" +
               "  <style type=\"text/css\">\n" +
               "    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }\n" +
               "    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }\n" +
               "    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }\n" +
               "    table { border-collapse: collapse !important; }\n" +
               "    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }\n" +
               "    @media screen and (max-width: 600px) {\n" +
               "      .email-container { width: 100% !important; }\n" +
               "      .email-content { padding: 20px 16px !important; }\n" +
               "    }\n" +
               "  </style>\n" +
               "</head>\n" +
               "<body style=\"margin: 0; padding: 0; background-color: #f4f6f8;\">\n" +
               "  <!-- Preview Text Hidden from View -->\n" +
               "  <div style=\"display: none; font-size: 1px; color: #f4f6f8; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;\">" +
               escape(previewText) +
               "</div>\n" +
               "  <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color: #f4f6f8;\">\n" +
               "    <tr>\n" +
               "      <td align=\"center\" style=\"padding: 24px 12px;\">\n" +
               "        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" class=\"email-container\" style=\"max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);\">\n";
    }

    private String brandHeader(String badgeTitle) {
        return "          <tr>\n" +
               "            <td style=\"background-color: " + COLOR_PRIMARY + "; padding: 26px 24px; text-align: center;\">\n" +
               "              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">\n" +
               "                <tr>\n" +
               "                  <td align=\"center\">\n" +
               "                    <div style=\"display: inline-block; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;\">\n" +
               "                      🌱 Carbon<span style=\"color: #86efac;\">Track</span>\n" +
               "                    </div>\n" +
               "                    <div style=\"font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #a7f3d0; margin-top: 4px; font-weight: 600;\">\n" +
               escape(badgeTitle) +
               "                    </div>\n" +
               "                  </td>\n" +
               "                </tr>\n" +
               "              </table>\n" +
               "            </td>\n" +
               "          </tr>\n" +
               "          <tr>\n" +
               "            <td class=\"email-content\" style=\"padding: 32px 28px; line-height: 1.6; font-size: 15px; color: " + COLOR_TEXT + ";\">\n";
    }

    private String actionButton(String buttonText, String safeUrl) {
        return "              <table border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin: 24px auto;\">\n" +
               "                <tr>\n" +
               "                  <td align=\"center\" style=\"border-radius: 8px; background-color: " + COLOR_PRIMARY + ";\">\n" +
               "                    <a href=\"" + safeUrl + "\" target=\"_blank\" style=\"font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; background-color: " + COLOR_PRIMARY + "; border: 1px solid " + COLOR_PRIMARY + ";\">\n" +
               "                      " + escape(buttonText) + "\n" +
               "                    </a>\n" +
               "                  </td>\n" +
               "                </tr>\n" +
               "              </table>\n";
    }

    private String endLayout() {
        return "            </td>\n" +
               "          </tr>\n" +
               "          <tr>\n" +
               "            <td style=\"background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 12px; color: " + COLOR_MUTED + "; line-height: 1.5;\">\n" +
               "              <p style=\"margin: 0 0 8px 0;\">You received this notification from <strong>CarbonTrack Sustainability Platform</strong>.</p>\n" +
               "              <p style=\"margin: 0 0 8px 0;\">To adjust which email notifications you receive, visit your <span style=\"color: " + COLOR_ACCENT + "; font-weight: 600;\">Notification Preferences</span> in your account settings.</p>\n" +
               "              <p style=\"margin: 0; color: #94a3b8;\">© 2026 CarbonTrack. All rights reserved.</p>\n" +
               "            </td>\n" +
               "          </tr>\n" +
               "        </table>\n" +
               "      </td>\n" +
               "    </tr>\n" +
               "  </table>\n" +
               "</body>\n" +
               "</html>";
    }

    private String escape(String input) {
        if (input == null) return "";
        return HtmlUtils.htmlEscape(input);
    }
}

