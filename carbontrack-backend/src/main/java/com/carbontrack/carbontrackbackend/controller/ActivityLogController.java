
package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.ActivityLogRequestDTO;
import com.carbontrack.carbontrackbackend.dto.ActivityLogResponseDTO;
import com.carbontrack.carbontrackbackend.service.ActivityLogService;

import jakarta.validation.Valid;
<<<<<<< HEAD

=======
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
<<<<<<< HEAD
@RequestMapping("/api/activities")
=======
@RequestMapping("/api/activity-logs")
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
public class ActivityLogController {

    private final ActivityLogService activityLogService;

<<<<<<< HEAD
    public ActivityLogController(
            ActivityLogService activityLogService) {
=======
    public ActivityLogController(ActivityLogService activityLogService) {
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
        this.activityLogService = activityLogService;
    }

    @PostMapping
    public ActivityLogResponseDTO createActivity(
            Authentication authentication,
            @Valid @RequestBody ActivityLogRequestDTO request) {

        return activityLogService.createActivity(
<<<<<<< HEAD
                authentication.getName(), request);
    }

    @GetMapping("/me")
=======
                authentication.getName(),
                request
        );
    }

    @GetMapping
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
    public List<ActivityLogResponseDTO> getMyActivities(
            Authentication authentication) {

        return activityLogService.getMyActivities(
<<<<<<< HEAD
                authentication.getName());
    }
}
=======
                authentication.getName()
        );
    }
}
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
