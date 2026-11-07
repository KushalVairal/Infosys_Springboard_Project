package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.auth.AuthResponseDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import com.carbontrack.carbontrackbackend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Field;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private OAuth2AuthService oAuth2AuthService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testProcessGoogleUser_ExistingUser_GeneratesTokenWithoutOverwritingPassword() throws Exception {
        User existingUser = new User();
        setUserId(existingUser, 42L);
        existingUser.setUsername("existinguser");
        existingUser.setEmail("user@example.com");
        existingUser.setPasswordHash("$2a$10$existingPasswordHashValue");
        existingUser.setRole("USER");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken("user@example.com")).thenReturn("mock-jwt-token-xyz");

        AuthResponseDTO response = oAuth2AuthService.processGoogleUser(
                "user@example.com",
                "Existing User Full Name",
                "https://example.com/avatar.png"
        );

        assertNotNull(response);
        assertEquals("user@example.com", response.getEmail());
        assertEquals(42L, response.getUserId());
        assertEquals("mock-jwt-token-xyz", response.getToken());
        assertEquals("$2a$10$existingPasswordHashValue", existingUser.getPasswordHash());
        assertEquals("Existing User Full Name", existingUser.getFullName());
        assertEquals("https://example.com/avatar.png", existingUser.getProfileImageUrl());
    }

    @Test
    void testProcessGoogleUser_NewUser_CreatesUserWithSafePasswordHashAndUserRole() {
        when(userRepository.findByEmail("newgoogleuser@example.com")).thenReturn(Optional.empty());
        when(userRepository.existsByUsername("alexmorgan")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$generatedSafeHash1234567890");
        when(jwtService.generateToken("newgoogleuser@example.com")).thenReturn("mock-jwt-token-new");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            setUserId(u, 101L);
            return u;
        });

        AuthResponseDTO response = oAuth2AuthService.processGoogleUser(
                "newgoogleuser@example.com",
                "Alex Morgan",
                "https://lh3.googleusercontent.com/photo.jpg"
        );

        assertNotNull(response);
        assertEquals("newgoogleuser@example.com", response.getEmail());
        assertEquals(101L, response.getUserId());
        assertEquals("mock-jwt-token-new", response.getToken());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User createdUser = captor.getValue();

        assertEquals("alexmorgan", createdUser.getUsername());
        assertEquals("newgoogleuser@example.com", createdUser.getEmail());
        assertEquals("USER", createdUser.getRole());
        assertEquals("$2a$10$generatedSafeHash1234567890", createdUser.getPasswordHash());
        assertEquals("Alex Morgan", createdUser.getFullName());
        assertEquals("https://lh3.googleusercontent.com/photo.jpg", createdUser.getProfileImageUrl());
        assertEquals("KG_CO2E", createdUser.getPreferredUnit());
        assertTrue(createdUser.getGoalVisibility());
    }

    @Test
    void testProcessGoogleUser_UsernameCollision_ResolvesWithSuffix() {
        when(userRepository.findByEmail("johndoe@example.com")).thenReturn(Optional.empty());
        // First candidate "johndoe" is already taken
        when(userRepository.existsByUsername("johndoe")).thenReturn(true);
        // Candidate "johndoe_1" is free
        when(userRepository.existsByUsername("johndoe_1")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$randomhash");
        when(jwtService.generateToken("johndoe@example.com")).thenReturn("mock-jwt");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            setUserId(u, 202L);
            return u;
        });

        AuthResponseDTO response = oAuth2AuthService.processGoogleUser(
                "johndoe@example.com",
                "John Doe",
                null
        );

        assertNotNull(response);
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("johndoe_1", captor.getValue().getUsername());
    }

    @Test
    void testProcessGoogleUser_MissingEmail_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () ->
                oAuth2AuthService.processGoogleUser(null, "Name", null));

        assertThrows(IllegalArgumentException.class, () ->
                oAuth2AuthService.processGoogleUser("   ", "Name", null));
    }

    @Test
    void testGenerateUniqueUsername_SanitizationAndLengthLimit() {
        when(userRepository.existsByUsername(anyString())).thenReturn(false);

        String username = oAuth2AuthService.generateUniqueUsername(
                "Dr. John-Paul O'Connor @ Carbon",
                "john.paul@example.com"
        );

        assertNotNull(username);
        assertTrue(username.matches("^[a-z0-9_]+$"));
        assertTrue(username.length() <= 50);
    }

    private void setUserId(User user, Long id) {
        try {
            Field idField = User.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
