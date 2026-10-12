
package com.carbontrack.carbontrackbackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String sender;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String sender) {
        this.mailSender = mailSender;
        this.sender = sender;
    }

    public void sendPasswordResetOTP(String recipient, String otp) {
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
    }
}
