package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.entity.EmissionFactor;
import com.carbontrack.carbontrackbackend.repository.EmissionFactorRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class EmissionCalculationService {

    private final EmissionFactorRepository emissionFactorRepository;

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
