
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.ActivityResponse;
import com.carbontrack.carbontrackbackend.dto.CreateActivityRequest;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.entity.Category;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.exception.InvalidActivityException;
import com.carbontrack.carbontrackbackend.exception.ResourceNotFoundException;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ActivityService {

    private static final Logger log =
            LoggerFactory.getLogger(ActivityService.class);

    private static final Map<Category, Set<String>> ALLOWED_UNITS = Map.of(
            Category.TRANSPORT, Set.of("km", "miles"),
            Category.ELECTRICITY, Set.of("kwh"),
            Category.FOOD, Set.of("servings"),
            Category.SHOPPING, Set.of("inr", "usd")
    );

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final EmissionCalculationService emissionCalculationService;

    public ActivityService(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository,
            EmissionCalculationService emissionCalculationService) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.emissionCalculationService = emissionCalculationService;
    }

    @Transactional
    public ActivityResponse createActivity(CreateActivityRequest request) {
        User user = getCurrentAuthenticatedUser();

        String unit = request.getUnit()
                .trim()
                .toLowerCase(Locale.ROOT);

        validateCategoryRules(request.getCategory(), unit);

        BigDecimal co2eKg = emissionCalculationService.calculate(
                request.getCategory(),
                request.getActivityType().trim(),
                request.getQuantity(),
                unit
        );

        ActivityLog logEntry = new ActivityLog();
        logEntry.setUser(user);
        logEntry.setCategory(request.getCategory());
        logEntry.setActivityType(request.getActivityType().trim());
        logEntry.setQuantity(request.getQuantity());
        logEntry.setUnit(unit);
        logEntry.setCo2eKg(co2eKg);
        logEntry.setLogDate(request.getLogDate());
        logEntry.setNotes(request.getNotes());

        ActivityLog saved = activityLogRepository.save(logEntry);

        log.info(
                "Created activity id={} for userId={} (co2eKg={})",
                saved.getId(),
                user.getId(),
                co2eKg
        );

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> getActivities(
            Category category,
            LocalDate from,
            LocalDate to,
            Pageable pageable) {

        User user = getCurrentAuthenticatedUser();

        Page<ActivityLog> page = activityLogRepository.findFiltered(
                user.getId(),
                category,
                from,
                to,
                pageable
        );

        return page.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ActivityResponse getActivityById(Long id) {
        User user = getCurrentAuthenticatedUser();

        ActivityLog entry = activityLogRepository
                .findByIdAndUserId(id, user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Activity not found with id: " + id
                        ));

        return mapToResponse(entry);
    }

    private void validateCategoryRules(Category category, String unit) {
        Set<String> allowed = ALLOWED_UNITS.get(category);

        if (allowed == null || !allowed.contains(unit)) {
            throw new InvalidActivityException(
                    "Invalid unit '" + unit + "' for category " + category
                            + ". Allowed: " + allowed
            );
        }
    }

    private User getCurrentAuthenticatedUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResourceNotFoundException(
                    "No authenticated user found"
            );
        }

        // JwtAuthenticationFilter sets the user's email as the principal.
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Authenticated user not found: " + email
                        ));
    }

    private ActivityResponse mapToResponse(ActivityLog entry) {
        ActivityResponse response = new ActivityResponse();

        response.setId(entry.getId());
        response.setCategory(entry.getCategory());
        response.setActivityType(entry.getActivityType());
        response.setQuantity(entry.getQuantity());
        response.setUnit(entry.getUnit());
        response.setCo2eKg(entry.getCo2eKg());
        response.setLogDate(entry.getLogDate());
        response.setNotes(entry.getNotes());
        response.setCreatedAt(entry.getCreatedAt());

        return response;
    }
}