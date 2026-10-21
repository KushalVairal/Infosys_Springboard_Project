
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.activity.ActivityLogRequestDTO;
import com.carbontrack.carbontrackbackend.dto.activity.ActivityLogResponseDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ActivityLogService {

    private static final Set<String> ALLOWED_CATEGORIES =
            Set.of("TRANSPORT", "ELECTRICITY", "FOOD", "SHOPPING");

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final EmissionCalculationService emissionCalculationService;

    public ActivityLogService(
            ActivityLogRepository activityLogRepository,
            EmissionCalculationService emissionCalculationService,
            UserRepository userRepository) {

        this.activityLogRepository = activityLogRepository;
        this.emissionCalculationService = emissionCalculationService;
        this.userRepository = userRepository;
    }

    @CacheEvict(
            cacheNames = {
                    "dailyFootprint",
                    "weeklyFootprint",
                    "monthlyFootprint"
            },
            allEntries = true
    )
    @Transactional
    public ActivityLogResponseDTO createActivity(
            String email, ActivityLogRequestDTO request) {

        User user = findUser(email);

        String category = request.getCategory()
                .trim().toUpperCase(Locale.ROOT);

        if (!ALLOWED_CATEGORIES.contains(category)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category must be TRANSPORT, ELECTRICITY, FOOD, or SHOPPING"
            );
        }

        String activityType = request.getActivityType()
                .trim().toUpperCase(Locale.ROOT);

        String unit = request.getUnit().trim();
        LocalDate logDate = request.getLogDate();

        if (logDate.isAfter(LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Activity date cannot be in the future"
            );
        }

        BigDecimal emissions =
                emissionCalculationService.calculateEmissions(
                        activityType,
                        unit,
                        request.getQuantity(),
                        logDate
                );

        ActivityLog activity = new ActivityLog();
        activity.setUser(user);
        activity.setCategory(category);
        activity.setActivityType(activityType);
        activity.setQuantity(request.getQuantity());
        activity.setUnit(unit);
        activity.setCo2eKg(emissions);
        activity.setLogDate(logDate);

        ActivityLog saved = activityLogRepository.save(activity);

        return convertToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponseDTO> getMyActivities(String email) {

        User user = findUser(email);

        return activityLogRepository
                .findByUserIdOrderByLogDateDesc(user.getId())
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
    }

    private ActivityLogResponseDTO convertToDTO(ActivityLog activity) {
        return new ActivityLogResponseDTO(
                activity.getId(),
                activity.getCategory(),
                activity.getActivityType(),
                activity.getQuantity(),
                activity.getUnit(),
                activity.getCo2eKg(),
                activity.getLogDate()
        );
    }
}
