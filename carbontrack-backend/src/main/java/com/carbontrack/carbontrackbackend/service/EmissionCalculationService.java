package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.entity.Category;
import com.carbontrack.carbontrackbackend.entity.EmissionFactor;
import com.carbontrack.carbontrackbackend.exception.InvalidActivityException;
import com.carbontrack.carbontrackbackend.repository.EmissionFactorRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class EmissionCalculationService {

    private final EmissionFactorRepository emissionFactorRepository;

    public EmissionCalculationService(EmissionFactorRepository emissionFactorRepository) {
        this.emissionFactorRepository = emissionFactorRepository;
    }

    /**
     * Looks up the emission factor for (activityType, unit) and returns
     * quantity * kgCo2ePerUnit rounded to 4 decimal places.
     *
     * @throws InvalidActivityException if the factor does not exist.
     */
    public BigDecimal calculate(Category category, String activityType,
                                BigDecimal quantity, String unit) {

        if (quantity == null || quantity.signum() <= 0) {
            throw new InvalidActivityException("Quantity must be greater than zero");
        }

        EmissionFactor factor = emissionFactorRepository
                .findByActivityTypeAndUnit(activityType, unit)
                .orElseThrow(() -> new InvalidActivityException(
                        "No emission factor configured for activityType=" + activityType
                                + ", unit=" + unit));

        if (factor.getCategory() != category) {
            throw new InvalidActivityException(
                    "Emission factor category mismatch for activityType=" + activityType);
        }

        return factor.getKgCo2ePerUnit()
                .multiply(quantity)
                .setScale(4, RoundingMode.HALF_UP);
    }
}