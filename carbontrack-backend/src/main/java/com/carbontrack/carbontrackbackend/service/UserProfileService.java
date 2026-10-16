
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.profile.UpdateProfileRequestDTO;
import com.carbontrack.carbontrackbackend.dto.profile.UserProfileResponseDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class UserProfileService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private final UserRepository userRepository;

    @Value("${app.upload.dir:uploads/profile-images}")
    private String uploadDir;

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

    @Transactional
    public UserProfileResponseDTO uploadProfileImage(String email, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select an image file to upload"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "File size exceeds the 5MB limit"
            );
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only JPEG, PNG, WEBP, and GIF images are allowed"
            );
        }

        User user = findUser(email);

        // Delete old local file if present
        deleteOldLocalImage(user.getProfileImageUrl());

        String extension = getExtensionFromContentType(contentType);
        String filename = UUID.randomUUID().toString() + extension;

        try {
            Path storageDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(storageDir);

            Path targetPath = storageDir.resolve(filename).normalize();
            if (!targetPath.startsWith(storageDir)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid file storage path"
                );
            }

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to store image file",
                    e
            );
        }

        user.setProfileImageUrl("/api/users/profile-image/" + filename);
        User savedUser = userRepository.save(user);

        return convertToDTO(savedUser);
    }

    public Resource loadProfileImage(String filename) {
        if (filename == null || !filename.matches("^[a-zA-Z0-9_\\-\\.]+$")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
        }

        try {
            Path storageDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = storageDir.resolve(filename).normalize();

            if (!filePath.startsWith(storageDir) || !Files.exists(filePath) || !Files.isReadable(filePath)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
            }

            return new UrlResource(filePath.toUri());
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found", e);
        }
    }

    public MediaType getMediaTypeForFilename(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".gif")) return MediaType.IMAGE_GIF;
        if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }

    @Transactional
    public UserProfileResponseDTO deleteProfileImage(String email) {
        User user = findUser(email);
        deleteOldLocalImage(user.getProfileImageUrl());
        user.setProfileImageUrl(null);
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    private void deleteOldLocalImage(String profileImageUrl) {
        if (profileImageUrl != null && profileImageUrl.startsWith("/api/users/profile-image/")) {
            String oldFilename = profileImageUrl.substring("/api/users/profile-image/".length());
            if (oldFilename.matches("^[a-zA-Z0-9_\\-\\.]+$")) {
                try {
                    Path oldFilePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(oldFilename).normalize();
                    Files.deleteIfExists(oldFilePath);
                } catch (IOException ignored) {
                }
            }
        }
    }

    private String getExtensionFromContentType(String contentType) {
        return switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
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
