package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.analytics.CategoryOverviewDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationResponseDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.StartActionRequestDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.UpdateRecommendationStatusDTO;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import com.carbontrack.carbontrackbackend.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    public RecommendationController(
            RecommendationService recommendationService,
            UserRepository userRepository) {
        this.recommendationService = recommendationService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<RecommendationDTO> getRecommendations(
            Authentication authentication,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "ACTIVE") String status) {
        validateAuth(authentication);
        return recommendationService.getPersonalizedRecommendations(authentication.getName(), category, status);
    }

    @PostMapping("/{id}/start-action")
    public RecommendationDTO startAction(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody(required = false) StartActionRequestDTO request) {
        validateAuth(authentication);
        return recommendationService.startAction(authentication.getName(), id, request);
    }

    @PatchMapping("/{id}/status")
    public RecommendationDTO updateStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateRecommendationStatusDTO request) {
        validateAuth(authentication);
        return recommendationService.updateStatus(authentication.getName(), id, request.status());
    }

    @GetMapping("/categories/overview")
    public List<CategoryOverviewDTO> getCategoryOverview(Authentication authentication) {
        validateAuth(authentication);
        return recommendationService.getCategoryOverview(authentication.getName());
    }

    @GetMapping("/weekly")
    public RecommendationResponseDTO getWeeklyRecommendations(Authentication authentication) {
        validateAuth(authentication);
        String email = authentication.getName();
        var user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByUsername(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        return recommendationService.getWeeklyRecommendations(user.getId());
    }

    private void validateAuth(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }
    }
}
