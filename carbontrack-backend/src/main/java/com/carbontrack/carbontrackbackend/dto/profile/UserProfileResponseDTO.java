
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
}


