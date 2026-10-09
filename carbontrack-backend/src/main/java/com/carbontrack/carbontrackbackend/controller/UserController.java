package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.UpdateProfileRequest;
import com.carbontrack.carbontrackbackend.dto.UserProfileResponse;
import com.carbontrack.carbontrackbackend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile() {
        return ResponseEntity.ok(userService.getCurrentUserProfile());
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateCurrentUserProfile(request));
    }

    @PatchMapping("/me/visibility")
    public ResponseEntity<UserProfileResponse> updateVisibility(
            @RequestParam(required = false) Boolean goalVisibility,
            @RequestParam(required = false) Boolean leaderboardOptIn) {
        return ResponseEntity.ok(
                userService.updateVisibilitySettings(goalVisibility, leaderboardOptIn));
    }
}