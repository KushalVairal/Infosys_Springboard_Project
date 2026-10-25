
package com.carbontrack.carbontrackbackend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "goals")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(name = "target_co2e_kg", nullable = false,
            precision = 14, scale = 3)
    private BigDecimal targetCo2eKg;

    @Column(name = "baseline_co2e_kg", precision = 12, scale = 3)
    private BigDecimal baselineCo2eKg;

    @Column(name = "reduction_percentage", precision = 5, scale = 2)
    private BigDecimal reductionPercentage;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false,
            insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Goal() {
    }

    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getTargetCo2eKg() { return targetCo2eKg; }
    public void setTargetCo2eKg(BigDecimal targetCo2eKg) {
        this.targetCo2eKg = targetCo2eKg;
    }

    public BigDecimal getBaselineCo2eKg() { return baselineCo2eKg; }
    public void setBaselineCo2eKg(BigDecimal baselineCo2eKg) {
        this.baselineCo2eKg = baselineCo2eKg;
    }

    public BigDecimal getReductionPercentage() {
        return reductionPercentage;
    }
    public void setReductionPercentage(BigDecimal reductionPercentage) {
        this.reductionPercentage = reductionPercentage;
    }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
