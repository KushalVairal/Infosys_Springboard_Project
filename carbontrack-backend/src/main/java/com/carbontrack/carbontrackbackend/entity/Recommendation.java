package com.carbontrack.carbontrackbackend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendations")
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "activity_type", length = 80)
    private String activityType;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 500)
    private String observation;

    @Column(name = "action_description", nullable = false, columnDefinition = "TEXT")
    private String actionDescription;

    @Column(nullable = false, length = 20)
    private String priority = "MEDIUM"; // HIGH, MEDIUM, LOW

    @Column(nullable = false, length = 20)
    private String difficulty = "MEDIUM"; // EASY, MEDIUM, HARD

    @Column(name = "estimated_savings_kg", nullable = false, precision = 10, scale = 3)
    private BigDecimal estimatedSavingsKg = BigDecimal.ZERO;

    @Column(name = "savings_assumptions", length = 500)
    private String savingsAssumptions;

    @Column(nullable = false, length = 50)
    private String timeframe = "1 - 2 weeks";

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE"; // ACTIVE, IN_PROGRESS, COMPLETED, DISMISSED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connected_goal_id")
    private Goal connectedGoal;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Recommendation() {
    }

    public Recommendation(
            User user,
            String category,
            String activityType,
            String title,
            String observation,
            String actionDescription,
            String priority,
            String difficulty,
            BigDecimal estimatedSavingsKg,
            String savingsAssumptions,
            String timeframe) {
        this.user = user;
        this.category = category;
        this.activityType = activityType;
        this.title = title;
        this.observation = observation;
        this.actionDescription = actionDescription;
        this.priority = priority != null ? priority : "MEDIUM";
        this.difficulty = difficulty != null ? difficulty : "MEDIUM";
        this.estimatedSavingsKg = estimatedSavingsKg != null ? estimatedSavingsKg : BigDecimal.ZERO;
        this.savingsAssumptions = savingsAssumptions;
        this.timeframe = timeframe != null ? timeframe : "1 - 2 weeks";
        this.status = "ACTIVE";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getActivityType() {
        return activityType;
    }

    public void setActivityType(String activityType) {
        this.activityType = activityType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getObservation() {
        return observation;
    }

    public void setObservation(String observation) {
        this.observation = observation;
    }

    public String getActionDescription() {
        return actionDescription;
    }

    public void setActionDescription(String actionDescription) {
        this.actionDescription = actionDescription;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public BigDecimal getEstimatedSavingsKg() {
        return estimatedSavingsKg;
    }

    public void setEstimatedSavingsKg(BigDecimal estimatedSavingsKg) {
        this.estimatedSavingsKg = estimatedSavingsKg;
    }

    public String getSavingsAssumptions() {
        return savingsAssumptions;
    }

    public void setSavingsAssumptions(String savingsAssumptions) {
        this.savingsAssumptions = savingsAssumptions;
    }

    public String getTimeframe() {
        return timeframe;
    }

    public void setTimeframe(String timeframe) {
        this.timeframe = timeframe;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Goal getConnectedGoal() {
        return connectedGoal;
    }

    public void setConnectedGoal(Goal connectedGoal) {
        this.connectedGoal = connectedGoal;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

