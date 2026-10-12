
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.ActivityLogRequestDTO;
import com.carbontrack.carbontrackbackend.dto.ActivityLogResponseDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
<<<<<<< HEAD
=======
import com.carbontrack.carbontrackbackend.entity.Category;
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
<<<<<<< HEAD
import java.util.Locale;
import java.util.Set;
=======
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170

@Service
public class ActivityLogService {

<<<<<<< HEAD
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
=======
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public ActivityLogService(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
        this.userRepository = userRepository;
    }

    @Transactional
    public ActivityLogResponseDTO createActivity(
<<<<<<< HEAD
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
=======
            String email,
            ActivityLogRequestDTO request) {

        if (request.category() == null
                || request.category().isBlank()
                || request.activityType() == null
                || request.activityType().isBlank()
                || request.unit() == null
                || request.unit().isBlank()
                || request.quantity() == null
                || request.logDate() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "All activity fields are required"
            );
        }

        if (request.quantity().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity cannot be negative"
            );
        }

        if (request.quantity().scale() > 3
                || request.quantity().precision() > 12) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity supports at most 3 decimal places"
            );
        }

        if (request.category().length() > 30
                || request.activityType().length() > 80
                || request.unit().length() > 30) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Activity field length exceeded"
            );
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        ActivityLog activity = new ActivityLog();
        activity.setUser(user);
activity.setCategory(Category.valueOf(request.category().trim().toUpperCase()));        activity.setActivityType(request.activityType().trim());
        activity.setQuantity(request.quantity());
        activity.setUnit(request.unit().trim());
        activity.setLogDate(request.logDate());

        // Temporary placeholder until the emission engine is implemented.
        activity.setCo2eKg(BigDecimal.ZERO);

        ActivityLog saved = activityLogRepository.save(activity);

        return toResponse(saved);
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponseDTO> getMyActivities(String email) {

<<<<<<< HEAD
        User user = findUser(email);

        return activityLogRepository
                .findByUserIdOrderByLogDateDesc(user.getId())
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
=======
        User user = userRepository.findByEmail(email)
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
<<<<<<< HEAD
    }

    private ActivityLogResponseDTO convertToDTO(ActivityLog activity) {
        return new ActivityLogResponseDTO(
                activity.getId(),
                activity.getCategory(),
=======

        return activityLogRepository
                .findByUserIdOrderByLogDateDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ActivityLogResponseDTO toResponse(ActivityLog activity) {
        return new ActivityLogResponseDTO(
                activity.getId(),
                activity.getCategory().name(),   
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
                activity.getActivityType(),
                activity.getQuantity(),
                activity.getUnit(),
                activity.getCo2eKg(),
<<<<<<< HEAD
                activity.getLogDate()
        );
    }
}
=======
                activity.getLogDate(),
                activity.getCreatedAt()
        );
    }
}
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
