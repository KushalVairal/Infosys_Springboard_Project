package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.profile.UpdateProfileRequestDTO;
import com.carbontrack.carbontrackbackend.dto.profile.UserProfileResponseDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    private UserProfileService userProfileService;

    private User user;

    @TempDir
    Path tempUploadDir;

    @BeforeEach
    void setUp() {
        userProfileService = new UserProfileService(userRepository);
        ReflectionTestUtils.setField(userProfileService, "uploadDir", tempUploadDir.toString());

        user = new User();
        user.setUsername("testuser");
        user.setEmail("testuser@example.com");
        user.setPreferredUnit("KG_CO2E");
        user.setGoalVisibility(true);
    }

    @Test
    void shouldReturnProfileForValidUser() {
        when(userRepository.findByEmail("testuser@example.com")).thenReturn(Optional.of(user));

        UserProfileResponseDTO profile = userProfileService.getMyProfile("testuser@example.com");

        assertNotNull(profile);
        assertEquals("testuser", profile.getUsername());
        assertEquals("testuser@example.com", profile.getEmail());
        assertEquals("KG_CO2E", profile.getPreferredUnit());
        assertTrue(profile.isGoalVisibility());
    }

    @Test
    void shouldUpdateProfileSuccessfully() {
        when(userRepository.findByEmail("testuser@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequestDTO update = new UpdateProfileRequestDTO();
        update.setUsername("testuser");
        update.setFullName("Jane Eco");
        update.setPreferredUnit("TONNES_CO2E");
        update.setGoalVisibility(false);
        update.setLocation("Berlin");

        UserProfileResponseDTO result = userProfileService.updateMyProfile("testuser@example.com", update);

        assertNotNull(result);
        assertEquals("Jane Eco", result.getFullName());
        assertEquals("TONNES_CO2E", result.getPreferredUnit());
        assertFalse(result.isGoalVisibility());
        assertEquals("Berlin", result.getLocation());
    }

    @Test
    void shouldRejectImageWithUnsupportedContentType() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "script.sh", "application/x-sh", "echo hi".getBytes()
        );

        assertThrows(ResponseStatusException.class, () ->
                userProfileService.uploadProfileImage("testuser@example.com", file)
        );
    }

    @Test
    void shouldUploadProfileImageSuccessfully() {
        when(userRepository.findByEmail("testuser@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockMultipartFile image = new MockMultipartFile(
                "file", "avatar.png", "image/png", new byte[]{1, 2, 3, 4}
        );

        UserProfileResponseDTO result = userProfileService.uploadProfileImage("testuser@example.com", image);

        assertNotNull(result);
        assertNotNull(result.getProfileImageUrl());
        assertTrue(result.getProfileImageUrl().startsWith("/api/users/profile-image/"));
        assertTrue(result.getProfileImageUrl().endsWith(".png"));
    }

    @Test
    void shouldDeleteProfileImageSuccessfully() {
        user.setProfileImageUrl("/api/users/profile-image/avatar.png");
        when(userRepository.findByEmail("testuser@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponseDTO result = userProfileService.deleteProfileImage("testuser@example.com");

        assertNotNull(result);
        assertNull(result.getProfileImageUrl());
    }
}
