
package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.EmissionFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EmissionFactorRepository
        extends JpaRepository<EmissionFactor, Long> {

    Optional<EmissionFactor>
    findFirstByActivityTypeAndUnitAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
            String activityType, String unit, LocalDate date);

    @Query("""
        SELECT ef
        FROM EmissionFactor ef
        WHERE ef.effectiveDate <= :asOfDate
        AND ef.effectiveDate = (
            SELECT MAX(ef2.effectiveDate)
            FROM EmissionFactor ef2
            WHERE ef2.activityType = ef.activityType
            AND ef2.unit = ef.unit
            AND ef2.effectiveDate <= :asOfDate
        )
        """)
    List<EmissionFactor> findLatestFactors(
            @Param("asOfDate") LocalDate asOfDate
    );
}
