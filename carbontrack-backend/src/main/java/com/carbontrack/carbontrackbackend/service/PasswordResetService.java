
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.entity.EmailOtpVerification;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.EmailOtpVerificationRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
public class PasswordResetService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final EmailOtpVerificationRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final int otpExpirationMinutes;
    private final int maxAttempts;
    private final int resetTokenExpirationMinutes;

    public PasswordResetService(
            UserRepository userRepository,
            EmailOtpVerificationRepository otpRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${app.password-reset.otp-expiration-minutes:5}")
            int otpExpirationMinutes,
            @Value("${app.password-reset.max-attempts:5}")
            int maxAttempts,
            @Value("${app.password-reset.reset-token-expiration-minutes:10}")
            int resetTokenExpirationMinutes) {

        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.otpExpirationMinutes = otpExpirationMinutes;
        this.maxAttempts = maxAttempts;
        this.resetTokenExpirationMinutes =
                resetTokenExpirationMinutes;
    }

    @Transactional
    public void requestOTP(String email) {
        String normalizedEmail = email.trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElse(null);

        // Use the same outward response for known and unknown emails.
        if (user == null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();


        List<EmailOtpVerification> previousRequests =
                otpRepository.findByUserIdAndConsumedAtIsNull(
                        user.getId());

        for (EmailOtpVerification oldRequest : previousRequests) {
            oldRequest.setConsumedAt(now);
        }

        otpRepository.saveAll(previousRequests);


        String otp = String.format(
                "%06d", SECURE_RANDOM.nextInt(1_000_000));

        EmailOtpVerification verification =
                new EmailOtpVerification();

        verification.setUser(user);
        verification.setOtpHash(passwordEncoder.encode(otp));
        verification.setExpiresAt(
                now.plusMinutes(otpExpirationMinutes));

        otpRepository.save(verification);

        // Never log or return the OTP from the API.
        emailService.sendPasswordResetOTP(
                user.getEmail(), otp);
    }

    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public String verifyOTP(String email, String otp) {
        String normalizedEmail = email.trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid or expired OTP"));

        EmailOtpVerification verification =
                otpRepository
                        .findTopByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(
                                user.getId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Invalid or expired OTP"));

        LocalDateTime now = LocalDateTime.now();

        if (verification.getConsumedAt() != null
                || verification.getVerifiedAt() != null
                || !verification.getExpiresAt().isAfter(now)
                || verification.getAttempts() >= maxAttempts) {
            throw new IllegalArgumentException(
                    "Invalid or expired OTP");
        }

        if (!passwordEncoder.matches(
                otp, verification.getOtpHash())) {
            verification.setAttempts(
                    verification.getAttempts() + 1);
            otpRepository.save(verification);

            throw new IllegalArgumentException(
                    "Invalid or expired OTP");
        }

        // Issue a high-entropy, one-time reset authorization.
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);

        String resetToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        verification.setVerifiedAt(now);
        verification.setResetTokenHash(sha256(resetToken));
        verification.setResetTokenExpiresAt(
                now.plusMinutes(resetTokenExpirationMinutes));

        otpRepository.save(verification);

        // Return this token only to the caller who proved the OTP.
        return resetToken;
    }

    @Transactional
    public void resetPassword(
            String resetToken, String newPassword) {

        String tokenHash = sha256(resetToken);

        EmailOtpVerification verification =
                otpRepository
                        .findByResetTokenHashAndConsumedAtIsNull(
                                tokenHash)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Invalid or expired reset authorization"));

        LocalDateTime now = LocalDateTime.now();

        if (verification.getVerifiedAt() == null
                || verification.getResetTokenExpiresAt() == null
                || !verification.getResetTokenExpiresAt()
                .isAfter(now)
                || verification.getConsumedAt() != null) {
            throw new IllegalArgumentException(
                    "Invalid or expired reset authorization");
        }

        User user = verification.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Consume authorization and invalidate the OTP record.
        verification.setConsumedAt(now);
        verification.setResetTokenHash(null);
        verification.setResetTokenExpiresAt(null);
        otpRepository.save(verification);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    value.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Unable to process reset authorization", ex);
        }
    }
}
