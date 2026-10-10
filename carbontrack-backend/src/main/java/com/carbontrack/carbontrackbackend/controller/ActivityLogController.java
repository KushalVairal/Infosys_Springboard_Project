
package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.ActivityLogRequestDTO;
import com.carbontrack.carbontrackbackend.dto.ActivityLogResponseDTO;
import com.carbontrack.carbontrackbackend.service.ActivityLogService;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity-logs")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    public ActivityLogController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @PostMapping
    public ActivityLogResponseDTO createActivity(
            Authentication authentication,
            @Valid @RequestBody ActivityLogRequestDTO request) {

        return activityLogService.createActivity(
                authentication.getName(),
                request
        );
    }

    @GetMapping
    public List<ActivityLogResponseDTO> getMyActivities(
            Authentication authentication) {

        return activityLogService.getMyActivities(
                authentication.getName()
        );
    }
}