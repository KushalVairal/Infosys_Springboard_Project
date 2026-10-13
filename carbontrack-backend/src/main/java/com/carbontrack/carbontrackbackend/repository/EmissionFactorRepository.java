
package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.EmissionFactor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface EmissionFactorRepository
        extends JpaRepository<EmissionFactor, Long> {

    Optional<EmissionFactor>
    findFirstByActivityTypeAndUnitAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
            String activityType, String unit, LocalDate date);
}

