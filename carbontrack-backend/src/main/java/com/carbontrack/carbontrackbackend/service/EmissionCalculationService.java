package com.carbontrack.carbontrackbackend.service;

<<<<<<< HEAD
import com.carbontrack.carbontrackbackend.entity.EmissionFactor;
import com.carbontrack.carbontrackbackend.repository.EmissionFactorRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
=======
import com.carbontrack.carbontrackbackend.entity.Category;
import com.carbontrack.carbontrackbackend.entity.EmissionFactor;
import com.carbontrack.carbontrackbackend.exception.InvalidActivityException;
import com.carbontrack.carbontrackbackend.repository.EmissionFactorRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170

@Service
public class EmissionCalculationService {

    private final EmissionFactorRepository emissionFactorRepository;

<<<<<<< HEAD
    public EmissionCalculationService(
            EmissionFactorRepository emissionFactorRepository) {
        this.emissionFactorRepository = emissionFactorRepository;
    }

    public BigDecimal calculateEmissions(
            String activityType,
            String unit,
            BigDecimal quantity,
            LocalDate activityDate) {

        if (quantity == null || quantity.signum() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity must be greater than zero"
            );
        }

        EmissionFactor factor = emissionFactorRepository
                .findFirstByActivityTypeAndUnitAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
                        activityType, unit, activityDate)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "No emission factor found for the activity type, unit, and date"
                ));

        if (factor.getKgCo2ePerUnit() == null
                || factor.getKgCo2ePerUnit().signum() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Emission factor is invalid"
            );
        }

        return quantity.multiply(factor.getKgCo2ePerUnit())
                .setScale(6, RoundingMode.HALF_UP);
    }
}
=======
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
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
