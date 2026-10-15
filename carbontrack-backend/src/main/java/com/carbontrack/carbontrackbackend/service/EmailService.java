package com.carbontrack.carbontrackbackend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String sender;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String sender) {
        this.mailSender = mailSender;
        this.sender = sender;
    }

    public void sendPasswordResetOTP(String recipient, String otp) {
        if (sender == null || sender.isBlank()) {
            logger.warn("SMTP username is not configured (MAIL_USERNAME is empty). Password reset OTP email could not be dispatched.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(sender);
            message.setTo(recipient);
            message.setSubject("CarbonTrack Password Reset OTP");
            message.setText(
                    "Your CarbonTrack password reset OTP is: " + otp
                            + "\n\nThis code expires in 5 minutes."
                            + "\nIf you did not request a password reset, "
                            + "you can ignore this email."
            );

            mailSender.send(message);
            logger.info("Password reset OTP email sent successfully to recipient.");
        } catch (MailException ex) {
            // Log safely without exposing credentials, tokens, or OTP
            logger.error("Failed to deliver OTP email via SMTP ({}). Verify MAIL_USERNAME and MAIL_PASSWORD configuration.", ex.getClass().getSimpleName());
        } catch (Exception ex) {
            logger.error("Unexpected error during OTP email dispatch: {}", ex.getClass().getSimpleName());
        }
    }
}
