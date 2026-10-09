
package com.carbontrack.carbontrackbackend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "emission_factors",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_emission_factor_type_unit_date",
                columnNames = {"activity_type", "unit", "effective_date"}
        )
)
public class EmissionFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "activity_type", nullable = false, length = 80)
    private String activityType;

    @Column(nullable = false, length = 30)
    private String unit;

    @Column(name = "kg_co2e_per_unit", nullable = false,
            precision = 12, scale = 6)
    private BigDecimal kgCo2ePerUnit;

    @Column(nullable = false, length = 500)
    private String source;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "created_at", nullable = false,
            insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public EmissionFactor() {
    }

    public Long getId() { return id; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) {
        this.activityType = activityType;
    }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getKgCo2ePerUnit() {
        return kgCo2ePerUnit;
    }
    public void setKgCo2ePerUnit(BigDecimal kgCo2ePerUnit) {
        this.kgCo2ePerUnit = kgCo2ePerUnit;
    }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) {
        this.effectiveDate = effectiveDate;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
}

