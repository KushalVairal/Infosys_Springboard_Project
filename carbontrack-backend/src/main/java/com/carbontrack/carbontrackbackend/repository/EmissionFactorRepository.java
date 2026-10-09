package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.EmissionFactor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmissionFactorRepository extends JpaRepository<EmissionFactor, Long> {

    Optional<EmissionFactor> findByActivityTypeAndUnit(String activityType, String unit);

    boolean existsByActivityTypeAndUnit(String activityType, String unit);
}