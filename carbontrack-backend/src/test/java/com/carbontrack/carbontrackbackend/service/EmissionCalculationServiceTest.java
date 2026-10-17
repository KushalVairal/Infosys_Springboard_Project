
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.entity.EmissionFactor;
import com.carbontrack.carbontrackbackend.repository.EmissionFactorRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmissionCalculationServiceTest {

    @Mock
    private EmissionFactorRepository emissionFactorRepository;

    private EmissionCalculationService calculationService;

    @BeforeEach
    void setUp() {
        calculationService =
                new EmissionCalculationService(emissionFactorRepository);
    }

    @Test
    void shouldCalculateEmissionsCorrectly() {

        EmissionFactor factor = new EmissionFactor();
        factor.setKgCo2ePerUnit(new BigDecimal("0.18"));

        when(emissionFactorRepository
                .findFirstByActivityTypeAndUnitAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
                        "CAR_PETROL", "km", LocalDate.of(2026, 10, 9)))
                .thenReturn(Optional.of(factor));

        BigDecimal result = calculationService.calculateEmissions(
                "CAR_PETROL",
                "km",
                new BigDecimal("12"),
                LocalDate.of(2026, 10, 9)
        );

        assertEquals(
                0,
                new BigDecimal("2.160000").compareTo(result),
                "Emissions should equal quantity multiplied by the factor"
        );
    }

    @Test
    void shouldRejectZeroQuantity() {

        assertThrows(
                ResponseStatusException.class,
                () -> calculationService.calculateEmissions(
                        "CAR_PETROL",
                        "km",
                        BigDecimal.ZERO,
                        LocalDate.of(2026, 10, 9)
                )
        );

        verifyNoInteractions(emissionFactorRepository);
    }

    @Test
    void shouldRejectNegativeQuantity() {

        assertThrows(
                ResponseStatusException.class,
                () -> calculationService.calculateEmissions(
                        "CAR_PETROL",
                        "km",
                        new BigDecimal("-5"),
                        LocalDate.of(2026, 10, 9)
                )
        );

        verifyNoInteractions(emissionFactorRepository);
    }

    @Test
    void shouldRejectMissingEmissionFactor() {

        when(emissionFactorRepository
                .findFirstByActivityTypeAndUnitAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
                        "UNKNOWN_ACTIVITY", "km", LocalDate.of(2026, 10, 9)))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> calculationService.calculateEmissions(
                        "UNKNOWN_ACTIVITY",
                        "km",
                        new BigDecimal("12"),
                        LocalDate.of(2026, 10, 9)
                )
        );

        assertEquals(400, exception.getStatusCode().value());
    }

    @ParameterizedTest
    @CsvSource({
            "2,   0.18,  0.360000",
            "12,  0.18,  2.160000",
            "100, 0.18, 18.000000"
    })
    void shouldCalculateEmissionsForMultipleQuantities(
            String quantityValue,
            String factorValue,
            String expectedValue) {

        LocalDate date = LocalDate.of(2026, 10, 9);

        EmissionFactor factor = new EmissionFactor();
        factor.setKgCo2ePerUnit(new BigDecimal(factorValue));

        when(emissionFactorRepository
                .findFirstByActivityTypeAndUnitAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
                        "CAR_PETROL", "km", date))
                .thenReturn(Optional.of(factor));

        BigDecimal result = calculationService.calculateEmissions(
                "CAR_PETROL",
                "km",
                new BigDecimal(quantityValue),
                date
        );

        assertEquals(
                0,
                new BigDecimal(expectedValue).compareTo(result)
        );
    }

}

