
package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.UserProfileResponseDTO;
import com.carbontrack.carbontrackbackend.service.UserService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbontrack.carbontrackbackend.dto.UserProfileUpdateDTO;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

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

        return userService.getMyProfile(
                authentication.getName()
        );
    }

    
@PutMapping("/me")
public UserProfileResponseDTO updateMyProfile(
        Authentication authentication,
        @RequestBody UserProfileUpdateDTO request) {

    return userService.updateMyProfile(
            authentication.getName(),
            request
    );
}
}