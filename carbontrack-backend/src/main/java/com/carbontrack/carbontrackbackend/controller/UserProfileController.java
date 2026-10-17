
package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.profile.UpdateProfileRequestDTO;
import com.carbontrack.carbontrackbackend.dto.profile.UserProfileResponseDTO;
import com.carbontrack.carbontrackbackend.service.UserProfileService;

import jakarta.validation.Valid;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(value = "/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserProfileResponseDTO uploadProfileImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {

        return userProfileService.uploadProfileImage(
                authentication.getName(),
                file
        );
    }

    @GetMapping("/profile-image/{filename:.+}")
    public ResponseEntity<Resource> getProfileImage(
            @PathVariable String filename) {

        Resource resource = userProfileService.loadProfileImage(filename);
        MediaType mediaType = userProfileService.getMediaTypeForFilename(filename);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .body(resource);
    }

    @DeleteMapping("/profile-image")
    public UserProfileResponseDTO deleteProfileImage(
            Authentication authentication) {

        return userProfileService.deleteProfileImage(
                authentication.getName()
        );
    }
}
