
package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.UserProfileResponse;
import com.carbontrack.carbontrackbackend.dto.UserProfileResponseDTO;
import com.carbontrack.carbontrackbackend.dto.UserProfileUpdateDTO;
import com.carbontrack.carbontrackbackend.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserProfileResponseDTO getMyProfile(
            Authentication authentication) {
        return userService.getMyProfile(authentication.getName());
    }

    @PutMapping("/me")
    public UserProfileResponseDTO updateMyProfile(
            Authentication authentication,
            @RequestBody UserProfileUpdateDTO request) {
        return userService.updateMyProfile(
                authentication.getName(), request);
    }

    @PatchMapping("/me/visibility")
    public ResponseEntity<UserProfileResponse> updateVisibility(
            @RequestParam(required = false) Boolean goalVisibility,
            @RequestParam(required = false) Boolean leaderboardOptIn) {
        return ResponseEntity.ok(
                userService.updateVisibilitySettings(
                        goalVisibility, leaderboardOptIn));
    }
}