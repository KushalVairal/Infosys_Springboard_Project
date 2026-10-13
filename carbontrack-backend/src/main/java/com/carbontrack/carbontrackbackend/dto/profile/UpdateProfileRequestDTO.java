
package com.carbontrack.carbontrackbackend.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequestDTO {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50,
            message = "Username must contain 3 to 50 characters")
    private String username;

    @Size(max = 100, message = "Full name is too long")
    private String fullName;

    @Pattern(
            regexp = "^$|^[+0-9()\\- ]{7,25}$",
            message = "Enter a valid phone number"
    )
    private String phoneNumber;

    @Size(max = 150, message = "Location is too long")
    private String location;

    @Size(max = 2048, message = "Profile image URL is too long")
    @Pattern(
            regexp = "^$|^https?://\\S+$",
            message = "Profile image must be an HTTP or HTTPS URL"
    )
    private String profileImageUrl;

    @NotBlank(message = "Preferred unit is required")
    @Pattern(
            regexp = "KG_CO2E|TONNES_CO2E",
            message = "Preferred unit must be KG_CO2E or TONNES_CO2E"
    )
    private String preferredUnit;

    private boolean goalVisibility = true;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getPreferredUnit() { return preferredUnit; }
    public void setPreferredUnit(String preferredUnit) {
        this.preferredUnit = preferredUnit;
    }

    public boolean isGoalVisibility() { return goalVisibility; }
    public void setGoalVisibility(boolean goalVisibility) {
        this.goalVisibility = goalVisibility;
    }
}
