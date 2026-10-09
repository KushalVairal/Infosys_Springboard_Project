package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.AuthResponseDTO;
import com.carbontrack.carbontrackbackend.dto.LoginRequestDTO;
import com.carbontrack.carbontrackbackend.dto.RegisterRequestDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import com.carbontrack.carbontrackbackend.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException(
                    "An account with this email already exists");
        }

        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new IllegalArgumentException(
                    "This username is already taken");
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        return new AuthResponseDTO(
                "Registration successful",
                savedUser.getId(),
                savedUser.getEmail()
        );
    }

    @Transactional(readOnly = true)
    public AuthResponseDTO login(LoginRequestDTO request) {

        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid email or password"));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash())) {
            throw new IllegalArgumentException(
                    "Invalid email or password");
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail());

        return new AuthResponseDTO(
                "Login successful",
                user.getId(),
                user.getEmail(),
                token
        );
    }
}
