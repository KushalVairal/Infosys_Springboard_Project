
package com.carbontrack.carbontrackbackend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "user_achievement",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_user_achievement_period",
            columnNames = {
                "user_id",
                "leaderboard_period",
                "period_start_date"
            }
        )
    }
)
public class UserAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "achievement_type", nullable = false, length = 20)
    private String achievementType;

    @Column(name = "leaderboard_period", nullable = false, length = 20)
    private String leaderboardPeriod;

    @Column(name = "rank_at_claim", nullable = false)
    private Integer rankAtClaim;

    @Column(name = "emissions_kg_at_claim",
            nullable = false, precision = 12, scale = 3)
    private BigDecimal emissionsKgAtClaim;

    @Column(name = "period_start_date", nullable = false)
    private LocalDate periodStartDate;

    @Column(name = "period_end_date", nullable = false)
    private LocalDate periodEndDate;

    @Column(name = "claimed_at", nullable = false,
            insertable = false, updatable = false)
    private LocalDateTime claimedAt;

    @Column(name = "created_at", nullable = false,
            insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public UserAchievement() {
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getAchievementType() {
        return achievementType;
    }

    public void setAchievementType(String achievementType) {
        this.achievementType = achievementType;
    }

    public String getLeaderboardPeriod() {
        return leaderboardPeriod;
    }

    public void setLeaderboardPeriod(String leaderboardPeriod) {
        this.leaderboardPeriod = leaderboardPeriod;
    }

    public Integer getRankAtClaim() {
        return rankAtClaim;
    }

    public void setRankAtClaim(Integer rankAtClaim) {
        this.rankAtClaim = rankAtClaim;
    }

    public BigDecimal getEmissionsKgAtClaim() {
        return emissionsKgAtClaim;
    }

    public void setEmissionsKgAtClaim(BigDecimal emissionsKgAtClaim) {
        this.emissionsKgAtClaim = emissionsKgAtClaim;
    }

    public LocalDate getPeriodStartDate() {
        return periodStartDate;
    }

    public void setPeriodStartDate(LocalDate periodStartDate) {
        this.periodStartDate = periodStartDate;
    }

    public LocalDate getPeriodEndDate() {
        return periodEndDate;
    }

    public void setPeriodEndDate(LocalDate periodEndDate) {
        this.periodEndDate = periodEndDate;
    }

    public LocalDateTime getClaimedAt() {
        return claimedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
