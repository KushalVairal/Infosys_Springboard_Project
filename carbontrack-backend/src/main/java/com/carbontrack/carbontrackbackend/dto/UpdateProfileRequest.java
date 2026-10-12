package com.carbontrack.carbontrackbackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @Email(message = "Email must be valid")
    @Size(max = 150)
    private String email;

    @Pattern(regexp = "metric|imperial", message = "preferredUnits must be 'metric' or 'imperial'")
    private String preferredUnits;

    private Boolean goalVisibility;

    private Boolean leaderboardOptIn;

    // getters and setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPreferredUnits() { return preferredUnits; }
    public void setPreferredUnits(String preferredUnits) { this.preferredUnits = preferredUnits; }

    public Boolean getGoalVisibility() { return goalVisibility; }
    public void setGoalVisibility(Boolean goalVisibility) { this.goalVisibility = goalVisibility; }

    public Boolean getLeaderboardOptIn() { return leaderboardOptIn; }
    public void setLeaderboardOptIn(Boolean leaderboardOptIn) { this.leaderboardOptIn = leaderboardOptIn; }
}