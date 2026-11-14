
package com.carbontrack.carbontrackbackend.dto.profile;


import java.time.LocalDateTime;

public class UserProfileResponseDTO {

    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String location;
    private String profileImageUrl;
    private String role;
    private String preferredUnit;
    private boolean goalVisibility;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long organisationId;
    private String organisationName;
    private String avatarSeed;

    public UserProfileResponseDTO(
            Long userId,
            String username,
            String fullName,
            String email,
            String phoneNumber,
            String location,
            String profileImageUrl,
            String role,
            String preferredUnit,
            boolean goalVisibility,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this(userId, username, fullName, email, phoneNumber, location, profileImageUrl, role, preferredUnit, goalVisibility, createdAt, updatedAt, null, null, null);
    }

    public UserProfileResponseDTO(
            Long userId,
            String username,
            String fullName,
            String email,
            String phoneNumber,
            String location,
            String profileImageUrl,
            String role,
            String preferredUnit,
            boolean goalVisibility,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            Long organisationId,
            String organisationName) {
        this(userId, username, fullName, email, phoneNumber, location, profileImageUrl, role, preferredUnit, goalVisibility, createdAt, updatedAt, organisationId, organisationName, null);
    }

    public UserProfileResponseDTO(
            Long userId,
            String username,
            String fullName,
            String email,
            String phoneNumber,
            String location,
            String profileImageUrl,
            String role,
            String preferredUnit,
            boolean goalVisibility,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            Long organisationId,
            String organisationName,
            String avatarSeed) {

        this.userId = userId;
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.location = location;
        this.profileImageUrl = profileImageUrl;
        this.role = role;
        this.preferredUnit = preferredUnit;
        this.goalVisibility = goalVisibility;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.organisationId = organisationId;
        this.organisationName = organisationName;
        this.avatarSeed = avatarSeed;
    }

    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getLocation() { return location; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public String getRole() { return role; }
    public String getPreferredUnit() { return preferredUnit; }

    public boolean isGoalVisibility() {
        return goalVisibility;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public Long getOrganisationId() {
        return organisationId;
    }

    public String getOrganisationName() {
        return organisationName;
    }

    public String getAvatarSeed() {
        return avatarSeed;
    }

    public void setAvatarSeed(String avatarSeed) {
        this.avatarSeed = avatarSeed;
    }
}


