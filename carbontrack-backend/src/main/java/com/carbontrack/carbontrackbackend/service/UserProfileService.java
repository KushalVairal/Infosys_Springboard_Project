
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.profile.UpdateProfileRequestDTO;
import com.carbontrack.carbontrackbackend.dto.profile.UserProfileResponseDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserProfileService {

    private final UserRepository userRepository;

    public UserProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponseDTO getMyProfile(String email) {
        User user = findUser(email);
        return convertToDTO(user);
    }

    @Transactional
    public UserProfileResponseDTO updateMyProfile(
            String email,
            UpdateProfileRequestDTO request) {

        User user = findUser(email);

        String requestedUsername = request.getUsername().trim();

        if (!requestedUsername.equals(user.getUsername())
                && userRepository.existsByUsername(requestedUsername)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Username is already taken"
            );
        }

        user.setUsername(requestedUsername);
        user.setPreferredUnit(request.getPreferredUnit());
        user.setGoalVisibility(request.isGoalVisibility());

        // Null means the field was omitted; blank means clear the field.
        if (request.getFullName() != null) {
            user.setFullName(normalizeOptional(request.getFullName()));
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(normalizeOptional(request.getPhoneNumber()));
        }

        if (request.getLocation() != null) {
            user.setLocation(normalizeOptional(request.getLocation()));
        }

        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(
                    normalizeOptional(request.getProfileImageUrl())
            );
        }

        User savedUser = userRepository.save(user);

        return convertToDTO(savedUser);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
    }

    private String normalizeOptional(String value) {
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private UserProfileResponseDTO convertToDTO(User user) {
        return new UserProfileResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getLocation(),
                user.getProfileImageUrl(),
                user.getRole(),
                user.getPreferredUnit(),
                Boolean.TRUE.equals(user.getGoalVisibility()),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
