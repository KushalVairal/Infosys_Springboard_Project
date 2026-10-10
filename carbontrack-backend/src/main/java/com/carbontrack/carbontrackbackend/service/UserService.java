
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.UpdateProfileRequest;
import com.carbontrack.carbontrackbackend.dto.UserProfileResponse;
import com.carbontrack.carbontrackbackend.dto.UserProfileResponseDTO;
import com.carbontrack.carbontrackbackend.dto.UserProfileUpdateDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.exception.DuplicateResourceException;
import com.carbontrack.carbontrackbackend.exception.ResourceNotFoundException;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
public class UserService {

    private static final Logger log =
            LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Profile API used by the current branch
    @Transactional(readOnly = true)
    public UserProfileResponseDTO getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        return new UserProfileResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getPreferredUnits(),
                user.getGoalVisibility(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    @Transactional
    public UserProfileResponseDTO updateMyProfile(
            String email, UserProfileUpdateDTO request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        if (request.preferredUnit() != null) {
            String unit = request.preferredUnit();

            if (!unit.equals("KG_CO2E")
                    && !unit.equals("TON_CO2E")) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid preferredUnit");
            }

            user.setPreferredUnits(unit);
        }

        if (request.goalVisibility() != null) {
            user.setGoalVisibility(request.goalVisibility());
        }

        User saved = userRepository.save(user);

        return new UserProfileResponseDTO(
                saved.getId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getRole().name(),
                saved.getPreferredUnits(),
                saved.getGoalVisibility(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }

    // Existing main-branch profile functionality
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        return mapToProfileResponse(getCurrentAuthenticatedUser());
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfileById(Long userId) {
        User currentUser = getCurrentAuthenticatedUser();

        if (!Objects.equals(currentUser.getId(), userId)) {
            throw new ResourceNotFoundException(
                    "User not found with id: " + userId);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + userId));

        return mapToProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateCurrentUserProfile(
            UpdateProfileRequest request) {
        User user = getCurrentAuthenticatedUser();

        applyUsernameUpdate(user, request.getUsername());
        applyEmailUpdate(user, request.getEmail());
        applyPreferences(user, request);

        User saved = userRepository.save(user);
        log.info("Updated profile for userId={}", saved.getId());

        return mapToProfileResponse(saved);
    }

    @Transactional
    public UserProfileResponse updateVisibilitySettings(
            Boolean goalVisibility, Boolean leaderboardOptIn) {
        User user = getCurrentAuthenticatedUser();

        if (goalVisibility != null) {
            user.setGoalVisibility(goalVisibility);
        }
        if (leaderboardOptIn != null) {
            user.setLeaderboardOptIn(leaderboardOptIn);
        }

        User saved = userRepository.save(user);
        log.info("Updated visibility settings for userId={}",
                saved.getId());

        return mapToProfileResponse(saved);
    }

    private User getCurrentAuthenticatedUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResourceNotFoundException(
                    "No authenticated user found");
        }

        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Authenticated user not found: " + username));
    }

    private void applyUsernameUpdate(User user, String newUsername) {
        if (!StringUtils.hasText(newUsername)
                || newUsername.equals(user.getUsername())) {
            return;
        }

        String trimmed = newUsername.trim();

        if (userRepository.existsByUsername(trimmed)) {
            throw new DuplicateResourceException(
                    "Username already in use: " + trimmed);
        }

        user.setUsername(trimmed);
    }

    private void applyEmailUpdate(User user, String newEmail) {
        if (!StringUtils.hasText(newEmail)
                || newEmail.equalsIgnoreCase(user.getEmail())) {
            return;
        }

        String trimmed = newEmail.trim().toLowerCase();

        if (userRepository.existsByEmail(trimmed)) {
            throw new DuplicateResourceException(
                    "Email already in use: " + trimmed);
        }

        user.setEmail(trimmed);
    }

    private void applyPreferences(
            User user, UpdateProfileRequest request) {
        if (StringUtils.hasText(request.getPreferredUnits())) {
            user.setPreferredUnits(request.getPreferredUnits());
        }

        if (request.getGoalVisibility() != null) {
            user.setGoalVisibility(request.getGoalVisibility());
        }

        if (request.getLeaderboardOptIn() != null) {
            user.setLeaderboardOptIn(request.getLeaderboardOptIn());
        }
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setRole(
                user.getRole() != null ? user.getRole().name() : null);

        if (user.getOrganisation() != null) {
            response.setOrgId(user.getOrganisation().getId());
            response.setOrgName(user.getOrganisation().getName());
        }

        response.setPreferredUnits(user.getPreferredUnits());
        response.setGoalVisibility(user.getGoalVisibility());
        response.setLeaderboardOptIn(user.getLeaderboardOptIn());
        response.setCreatedAt(user.getCreatedAt());

        return response;
    }
}