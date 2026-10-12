package com.carbontrack.carbontrackbackend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
    name = "emission_factors",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"activity_type", "unit"}
    )
)
public class EmissionFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Column(name = "activity_type", nullable = false, length = 50)
    private String activityType;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "kg_co2e_per_unit", nullable = false, precision = 12, scale = 6)
    private BigDecimal kgCo2ePerUnit;

    @Column(length = 200)
    private String source;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getKgCo2ePerUnit() { return kgCo2ePerUnit; }
    public void setKgCo2ePerUnit(BigDecimal kgCo2ePerUnit) { this.kgCo2ePerUnit = kgCo2ePerUnit; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }
}