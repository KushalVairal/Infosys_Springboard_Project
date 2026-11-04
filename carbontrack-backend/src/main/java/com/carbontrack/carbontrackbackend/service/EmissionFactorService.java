package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.emission.EmissionFactorResponseDTO;
import com.carbontrack.carbontrackbackend.entity.EmissionFactor;
import com.carbontrack.carbontrackbackend.repository.EmissionFactorRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class EmissionFactorService {

    private final EmissionFactorRepository emissionFactorRepository;

    public EmissionFactorService(
            EmissionFactorRepository emissionFactorRepository) {
        this.emissionFactorRepository = emissionFactorRepository;
    }

    public List<EmissionFactorResponseDTO> getEmissionFactors(
            String activityType) {

        List<EmissionFactor> factors =
                emissionFactorRepository.findLatestFactors(LocalDate.now());

        return factors.stream()
                .filter(factor -> activityType == null
                        || activityType.isBlank()
                        || factor.getActivityType().equalsIgnoreCase(
                                activityType.trim()))
                .map(factor -> new EmissionFactorResponseDTO(
                        factor.getId(),
                        factor.getActivityType(),
                        factor.getUnit(),
                        factor.getKgCo2ePerUnit(),
                        factor.getSource(),
                        factor.getEffectiveDate()
                ))
                .toList();
    }
}