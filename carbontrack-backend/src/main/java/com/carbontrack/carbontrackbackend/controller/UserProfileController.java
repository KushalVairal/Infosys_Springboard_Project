
package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.profile.UpdateProfileRequestDTO;
import com.carbontrack.carbontrackbackend.dto.profile.UserProfileResponseDTO;
import com.carbontrack.carbontrackbackend.service.UserProfileService;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(
            UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/me")
    public UserProfileResponseDTO getMyProfile(
            Authentication authentication) {

        return userProfileService.getMyProfile(
                authentication.getName()
        );
    }

    @PutMapping("/me")
    public UserProfileResponseDTO updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequestDTO request) {

        return userProfileService.updateMyProfile(
                authentication.getName(),
                request
        );
    }
}
