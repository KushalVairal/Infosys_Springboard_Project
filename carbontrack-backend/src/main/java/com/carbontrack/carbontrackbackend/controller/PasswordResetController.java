
package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.ForgotPasswordRequestDTO;
import com.carbontrack.carbontrackbackend.dto.ResetPasswordRequestDTO;
import com.carbontrack.carbontrackbackend.dto.VerifyOTPRequestDTO;
import com.carbontrack.carbontrackbackend.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(
            PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDTO request) {

        passwordResetService.requestOTP(request.getEmail());

        return ResponseEntity.ok(Map.of(
                "message",
                "If an account exists for that email, "
                        + "a password reset code will be sent."
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOTP(
            @Valid @RequestBody VerifyOTPRequestDTO request) {

        try {
            String resetToken = passwordResetService.verifyOTP(
                    request.getEmail(), request.getOtp());

            return ResponseEntity.ok(Map.of(
                    "message", "OTP verified successfully",
                    "resetToken", resetToken
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", ex.getMessage()
            ));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDTO request) {

        try {
            passwordResetService.resetPassword(
                    request.getResetToken(),
                    request.getNewPassword());

            return ResponseEntity.ok(Map.of(
                    "message",
                    "Password reset successful. Please log in."
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", ex.getMessage()
            ));
        }
    }
}
