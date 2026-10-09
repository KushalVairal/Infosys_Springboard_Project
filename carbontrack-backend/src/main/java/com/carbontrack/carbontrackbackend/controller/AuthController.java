
package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.AuthResponseDTO;
import com.carbontrack.carbontrackbackend.dto.LoginRequestDTO;
import com.carbontrack.carbontrackbackend.dto.RegisterRequestDTO;
import com.carbontrack.carbontrackbackend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequestDTO request) {

        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(authService.register(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequestDTO request) {

        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("messages", ex.getMessage()));
        }
    }
}
