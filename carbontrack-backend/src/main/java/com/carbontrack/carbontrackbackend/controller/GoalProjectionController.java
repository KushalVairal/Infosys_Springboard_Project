
package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.goal.GoalProjectionDTO;
import com.carbontrack.carbontrackbackend.service.GoalProjectionService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/goals")
public class GoalProjectionController {

    private final GoalProjectionService goalProjectionService;

    public GoalProjectionController(
            GoalProjectionService goalProjectionService) {
        this.goalProjectionService = goalProjectionService;
    }

    @GetMapping("/{goalId}/projection")
    public GoalProjectionDTO getProjection(
            @PathVariable Long goalId,
            Authentication authentication) {

        return goalProjectionService.getProjection(
                authentication.getName(),
                goalId);
    }
}
