package com.carbontrack.carbontrackbackend.dto;

import java.time.LocalDateTime;

public class UserProfileResponse {

    private Long id;
    private String username;
    private String email;
    private String role;
    private Long orgId;
    private String orgName;
    private String preferredUnits;
    private Boolean goalVisibility;
    private Boolean leaderboardOptIn;
    private LocalDateTime createdAt;

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Long getOrgId() { return orgId; }
    public void setOrgId(Long orgId) { this.orgId = orgId; }

    public String getOrgName() { return orgName; }
    public void setOrgName(String orgName) { this.orgName = orgName; }

    public String getPreferredUnits() { return preferredUnits; }
    public void setPreferredUnits(String preferredUnits) { this.preferredUnits = preferredUnits; }

    public Boolean getGoalVisibility() { return goalVisibility; }
    public void setGoalVisibility(Boolean goalVisibility) { this.goalVisibility = goalVisibility; }

    public Boolean getLeaderboardOptIn() { return leaderboardOptIn; }
    public void setLeaderboardOptIn(Boolean leaderboardOptIn) { this.leaderboardOptIn = leaderboardOptIn; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}