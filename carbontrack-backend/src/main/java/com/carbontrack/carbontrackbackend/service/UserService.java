package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.UpdateProfileRequest;
import com.carbontrack.carbontrackbackend.dto.UserProfileResponse;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.exception.DuplicateResourceException;
import com.carbontrack.carbontrackbackend.exception.ResourceNotFoundException;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Objects;

/**
 * Service for managing user profiles and sustainability preferences.
 *
 * Responsibilities:
 *  - Fetch the currently authenticated user's profile
 *  - Update editable profile fields (username, email, preferences)
 *  - Enforce uniqueness of username and email on updates
 *  - Enforce visibility preferences (goalVisibility, leaderboardOptIn)
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ---------------------------------------------------------------------
    // Read operations
    // ---------------------------------------------------------------------

    /**
     * Returns the profile of the currently authenticated user.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        User user = getCurrentAuthenticatedUser();
        return mapToProfileResponse(user);
    }

    /**
     * Returns a user profile by ID.
     * Currently only allowed for the user themselves; extend later for admins.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfileById(Long userId) {
        User currentUser = getCurrentAuthenticatedUser();

        // A user can only view their own profile in Milestone 1.
        if (!Objects.equals(currentUser.getId(), userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
            // Note: returning 404 instead of 403 to avoid leaking user existence.
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return mapToProfileResponse(user);
    }

    // ---------------------------------------------------------------------
    // Write operations
    // ---------------------------------------------------------------------

    /**
     * Updates the currently authenticated user's profile.
     * Only non-null fields in the request are applied (PATCH semantics on PUT is acceptable here).
     */
    @Transactional
    public UserProfileResponse updateCurrentUserProfile(UpdateProfileRequest request) {
        User user = getCurrentAuthenticatedUser();

        applyUsernameUpdate(user, request.getUsername());
        applyEmailUpdate(user, request.getEmail());
        applyPreferences(user, request);

        User saved = userRepository.save(user);
        log.info("Updated profile for userId={}", saved.getId());

        return mapToProfileResponse(saved);
    }

    /**
     * Updates only visibility-related preferences.
     */
    @Transactional
    public UserProfileResponse updateVisibilitySettings(Boolean goalVisibility, Boolean leaderboardOptIn) {
        User user = getCurrentAuthenticatedUser();

        if (goalVisibility != null) {
            user.setGoalVisibility(goalVisibility);
        }
        if (leaderboardOptIn != null) {
            user.setLeaderboardOptIn(leaderboardOptIn);
        }

        User saved = userRepository.save(user);
        log.info("Updated visibility settings for userId={} (goalVisibility={}, leaderboardOptIn={})",
                saved.getId(), saved.getGoalVisibility(), saved.getLeaderboardOptIn());

        return mapToProfileResponse(saved);
    }

    // ---------------------------------------------------------------------
    // Helper methods
    // ---------------------------------------------------------------------

    /**
     * Fetches the User entity for the currently authenticated principal.
     * Assumes the JWT filter sets the username as the principal.
     */
    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResourceNotFoundException("No authenticated user found");
        }

        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found: " + username));
    }

    private void applyUsernameUpdate(User user, String newUsername) {
        if (!StringUtils.hasText(newUsername) || newUsername.equals(user.getUsername())) {
            return;
        }

        String trimmed = newUsername.trim();
        if (userRepository.existsByUsername(trimmed)) {
            throw new DuplicateResourceException("Username already in use: " + trimmed);
        }
        user.setUsername(trimmed);
    }

    private void applyEmailUpdate(User user, String newEmail) {
        if (!StringUtils.hasText(newEmail) || newEmail.equalsIgnoreCase(user.getEmail())) {
            return;
        }

        String trimmed = newEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(trimmed)) {
            throw new DuplicateResourceException("Email already in use: " + trimmed);
        }
        user.setEmail(trimmed);
    }

    private void applyPreferences(User user, UpdateProfileRequest request) {
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
        response.setRole(user.getRole() != null ? user.getRole().name() : null);

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