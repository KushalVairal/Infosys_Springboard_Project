
package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.analytics.FootprintAggregateDTO;
import com.carbontrack.carbontrackbackend.dto.analytics.MonthlyFootprintDTO;
import com.carbontrack.carbontrackbackend.dto.analytics.WeeklyFootprintDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import com.carbontrack.carbontrackbackend.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    public AnalyticsController(
            AnalyticsService analyticsService,
            UserRepository userRepository) {
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
    }

    @GetMapping("/daily")
    public List<FootprintAggregateDTO> getDailyFootprint(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            Authentication authentication) {

        Long userId = getAuthenticatedUserId(authentication);

        return analyticsService.getDailyFootprint(
                userId, startDate, endDate);
    }

    @GetMapping("/weekly")
    public List<WeeklyFootprintDTO> getWeeklyFootprint(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            Authentication authentication) {

        Long userId = getAuthenticatedUserId(authentication);

        return analyticsService.getWeeklyFootprint(
                userId, startDate, endDate);
    }

    @GetMapping("/monthly")
    public List<MonthlyFootprintDTO> getMonthlyFootprint(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            Authentication authentication) {

        Long userId = getAuthenticatedUserId(authentication);

        return analyticsService.getMonthlyFootprint(
                userId, startDate, endDate);
    }

    private Long getAuthenticatedUserId(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required.");
        }

        String identity = authentication.getName();

        User user = userRepository.findByEmail(identity)
                .or(() -> userRepository.findByUsername(identity))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user was not found."));

        return user.getId();
    }
}
