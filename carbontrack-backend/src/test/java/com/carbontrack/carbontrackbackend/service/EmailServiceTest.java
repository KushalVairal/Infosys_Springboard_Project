package com.carbontrack.carbontrackbackend.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private EmailTemplateService templateService;
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        templateService = new EmailTemplateService();
        emailService = new EmailService(
                mailSender,
                templateService,
                "noreply@carbontrack.com",
                "http://localhost:5173"
        );
    }

    @Test
    @DisplayName("sendPasswordResetEmail creates and dispatches MimeMessage")
    void shouldSendPasswordResetEmail() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendPasswordResetEmail("user@example.com", "Jane Doe", "123456", 5);

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        assertNotNull(captor.getValue());
    }

    @Test
    @DisplayName("sendMimeEmail skips dispatch when sender is blank")
    void shouldSkipWhenSenderIsBlank() {
        EmailService unconfiguredService = new EmailService(mailSender, templateService, "", "http://localhost:5173");

        unconfiguredService.sendPasswordResetEmail("user@example.com", "Jane", "123456", 5);

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendMimeEmail skips dispatch when recipient is blank")
    void shouldSkipWhenRecipientIsBlank() {
        emailService.sendPasswordResetEmail("", "Jane", "123456", 5);

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendOrganisationInvitationEmail dispatches invitation email")
    void shouldSendOrganisationInvitationEmail() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendOrganisationInvitationEmail(
                "member@example.com", "John Doe", "Eco Corp", "Sarah Admin", null, 7);

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendBadgeEarnedEmail dispatches badge notification")
    void shouldSendBadgeEarnedEmail() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendBadgeEarnedEmail(
                "user@example.com", "Jane Doe", "Zero Waste Hero", "Logged 50 zero waste actions");

        verify(mailSender).send(any(MimeMessage.class));
    }
}

