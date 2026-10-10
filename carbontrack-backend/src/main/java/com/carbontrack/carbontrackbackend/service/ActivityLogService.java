
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
import com.carbontrack.carbontrackbackend.entity.Category;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public ActivityLogService(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ActivityLogResponseDTO createActivity(
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
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponseDTO> getMyActivities(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

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
                activity.getActivityType(),
                activity.getQuantity(),
                activity.getUnit(),
                activity.getCo2eKg(),
                activity.getLogDate(),
                activity.getCreatedAt()
        );
    }
}