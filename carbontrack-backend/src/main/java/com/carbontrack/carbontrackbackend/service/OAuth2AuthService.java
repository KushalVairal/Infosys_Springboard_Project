package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.auth.AuthResponseDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import com.carbontrack.carbontrackbackend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class OAuth2AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public OAuth2AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponseDTO processGoogleUser(String email, String fullName, String pictureUrl) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google identity is missing email");
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> existingUserOpt = userRepository.findByEmail(normalizedEmail);

        User user;
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            boolean updated = false;

            if ((user.getFullName() == null || user.getFullName().isBlank())
                    && fullName != null && !fullName.isBlank()) {
                user.setFullName(fullName.trim());
                updated = true;
            }

            if ((user.getProfileImageUrl() == null || user.getProfileImageUrl().isBlank())
                    && pictureUrl != null && !pictureUrl.isBlank()) {
                user.setProfileImageUrl(pictureUrl.trim());
                updated = true;
            }

            if (updated) {
                user = userRepository.save(user);
            }
        } else {
            user = new User();
            user.setEmail(normalizedEmail);
            user.setUsername(generateUniqueUsername(fullName, normalizedEmail));
            user.setRole("USER");
            // Set an unguessable cryptographically secure random BCrypt hash to safely satisfy
            // the non-nullable password_hash column without introducing a usable password.
            user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));

            if (fullName != null && !fullName.isBlank()) {
                user.setFullName(fullName.trim());
            }

            if (pictureUrl != null && !pictureUrl.isBlank()) {
                user.setProfileImageUrl(pictureUrl.trim());
            }

            user.setPreferredUnit("KG_CO2E");
            user.setGoalVisibility(true);

            user = userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponseDTO(
                "Google authentication successful",
                user.getId(),
                user.getEmail(),
                token
        );
    }

    public String generateUniqueUsername(String fullName, String email) {
        String base = null;
        if (fullName != null && !fullName.isBlank()) {
            base = fullName.trim().toLowerCase().replaceAll("[^a-z0-9_]", "");
        }
        if (base == null || base.length() < 3) {
            String prefix = email.split("@")[0].trim().toLowerCase().replaceAll("[^a-z0-9_]", "");
            base = prefix;
        }
        if (base == null || base.isBlank()) {
            base = "user";
        }
        if (base.length() > 35) {
            base = base.substring(0, 35);
        }

        if (!userRepository.existsByUsername(base)) {
            return base;
        }

        int suffix = 1;
        while (true) {
            String suffixStr = String.valueOf(suffix);
            int maxBaseLen = 50 - suffixStr.length() - 1;
            String trimmedBase = base.length() > maxBaseLen ? base.substring(0, maxBaseLen) : base;
            String candidate = trimmedBase + "_" + suffixStr;

            if (!userRepository.existsByUsername(candidate)) {
                return candidate;
            }
            suffix++;
        }
    }
}
