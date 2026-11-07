package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.emission.EmissionFactorResponseDTO;
import com.carbontrack.carbontrackbackend.service.EmissionFactorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emission-factors")
public class EmissionFactorController {

    private final EmissionFactorService emissionFactorService;

    public EmissionFactorController(
            EmissionFactorService emissionFactorService) {
        this.emissionFactorService = emissionFactorService;
    }

    @GetMapping
    public List<EmissionFactorResponseDTO> getEmissionFactors(
            @RequestParam(required = false) String activityType) {

        return emissionFactorService.getEmissionFactors(activityType);
    }
}