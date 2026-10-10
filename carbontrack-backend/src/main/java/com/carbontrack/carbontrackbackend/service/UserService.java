
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.UserProfileResponseDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.carbontrack.carbontrackbackend.dto.UserProfileUpdateDTO;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponseDTO getMyProfile(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        return new UserProfileResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getPreferredUnit(),
                user.getGoalVisibility(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
    
@Transactional
public UserProfileResponseDTO updateMyProfile(
        String email,
        UserProfileUpdateDTO request) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found"
            ));

    if (request.preferredUnit() != null) {
        if (!request.preferredUnit().equals("KG_CO2E")
                && !request.preferredUnit().equals("TON_CO2E")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid preferredUnit"
            );
        }

        user.setPreferredUnit(request.preferredUnit());
    }

    if (request.goalVisibility() != null) {
        user.setGoalVisibility(request.goalVisibility());
    }

    User savedUser = userRepository.save(user);

    return new UserProfileResponseDTO(
            savedUser.getId(),
            savedUser.getUsername(),
            savedUser.getEmail(),
            savedUser.getRole(),
            savedUser.getPreferredUnit(),
            savedUser.getGoalVisibility(),
            savedUser.getCreatedAt(),
            savedUser.getUpdatedAt()
    );
}
}