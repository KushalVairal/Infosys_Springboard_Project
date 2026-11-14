package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.entity.EmailOtpVerification;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.EmailOtpVerificationRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailOtpVerificationRepository otpRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    private PasswordResetService passwordResetService;

    private User user;

    @BeforeEach
    void setUp() {
        passwordResetService = new PasswordResetService(
                userRepository,
                otpRepository,
                passwordEncoder,
                emailService,
                5,  // otpExpirationMinutes
                5,  // maxAttempts
                10  // resetTokenExpirationMinutes
        );

        user = new User();
        ReflectionTestUtils.setField(user, "id", 101L);
        user.setEmail("member@example.com");
        user.setUsername("member101");
        user.setFullName("Alex Member");
        user.setPasswordHash("hashed_old_password");
    }

    @Test
    @DisplayName("requestOTP generates OTP and sends branded email with /reset-password URL")
    void shouldRequestOTPAndSendEmail() {
        when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(user));
        when(otpRepository.findByUserIdAndConsumedAtIsNull(101L)).thenReturn(List.of());
        when(passwordEncoder.encode(any())).thenReturn("hashed_otp");

        passwordResetService.requestOTP("member@example.com");

        ArgumentCaptor<EmailOtpVerification> captor = ArgumentCaptor.forClass(EmailOtpVerification.class);
        verify(otpRepository).save(captor.capture());
        assertNotNull(captor.getValue());
        assertEquals(user, captor.getValue().getUser());

        // Verify email dispatched with personalized display name and 5 min expiry
        verify(emailService).sendPasswordResetEmail(eq("member@example.com"), eq("Alex Member"), any(), eq(5));
    }

    @Test
    @DisplayName("verifyOTP rejects invalid OTP and increments attempt count")
    void shouldRejectInvalidOTP() {
        when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(user));

        EmailOtpVerification verification = new EmailOtpVerification();
        verification.setUser(user);
        verification.setOtpHash("encoded_correct_otp");
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        verification.setAttempts(0);

        when(otpRepository.findTopByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(101L))
                .thenReturn(Optional.of(verification));
        when(passwordEncoder.matches("999999", "encoded_correct_otp")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                passwordResetService.verifyOTP("member@example.com", "999999"));

        assertEquals("Invalid or expired OTP", ex.getMessage());
        assertEquals(1, verification.getAttempts());
        verify(otpRepository).save(verification);
    }

    @Test
    @DisplayName("verifyOTP accepts valid OTP and issues reset token")
    void shouldVerifyValidOTPAndIssueResetToken() {
        when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(user));

        EmailOtpVerification verification = new EmailOtpVerification();
        verification.setUser(user);
        verification.setOtpHash("encoded_correct_otp");
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        verification.setAttempts(0);

        when(otpRepository.findTopByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(101L))
                .thenReturn(Optional.of(verification));
        when(passwordEncoder.matches("123456", "encoded_correct_otp")).thenReturn(true);

        String resetToken = passwordResetService.verifyOTP("member@example.com", "123456");

        assertNotNull(resetToken);
        assertFalse(resetToken.isBlank());
        assertNotNull(verification.getVerifiedAt());
        assertNotNull(verification.getResetTokenHash());
        assertNotNull(verification.getResetTokenExpiresAt());
        verify(otpRepository).save(verification);
    }

    @Test
    @DisplayName("verifyOTP rejects expired OTP")
    void shouldRejectExpiredOTP() {
        when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(user));

        EmailOtpVerification verification = new EmailOtpVerification();
        verification.setUser(user);
        verification.setOtpHash("encoded_correct_otp");
        verification.setExpiresAt(LocalDateTime.now().minusMinutes(1)); // Expired

        when(otpRepository.findTopByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(101L))
                .thenReturn(Optional.of(verification));

        assertThrows(IllegalArgumentException.class, () ->
                passwordResetService.verifyOTP("member@example.com", "123456"));
    }

    @Test
    @DisplayName("resetPassword successfully updates password hash and consumes authorization")
    void shouldResetPasswordSuccessfully() {
        EmailOtpVerification verification = new EmailOtpVerification();
        verification.setUser(user);
        verification.setVerifiedAt(LocalDateTime.now());
        verification.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(10));

        when(otpRepository.findByResetTokenHashAndConsumedAtIsNull(any()))
                .thenReturn(Optional.of(verification));
        when(passwordEncoder.encode("NewSecurePass123!")).thenReturn("new_hashed_pass");

        passwordResetService.resetPassword("dummy_token", "NewSecurePass123!");

        assertEquals("new_hashed_pass", user.getPasswordHash());
        assertNotNull(verification.getConsumedAt());
        assertNull(verification.getResetTokenHash());
        assertNull(verification.getResetTokenExpiresAt());

        verify(userRepository).save(user);
        verify(otpRepository).save(verification);
    }
}

