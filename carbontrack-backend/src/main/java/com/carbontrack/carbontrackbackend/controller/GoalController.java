package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.goal.CreateGoalRequestDTO;
import com.carbontrack.carbontrackbackend.dto.goal.GoalResponseDTO;
import com.carbontrack.carbontrackbackend.dto.goal.UpdateGoalRequestDTO;
import com.carbontrack.carbontrackbackend.service.GoalService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    public List<GoalResponseDTO> getMyGoals(Authentication authentication) {
        return goalService.getMyGoals(authentication.getName());
    }

    @GetMapping("/me")
    public List<GoalResponseDTO> getMyGoalsMe(Authentication authentication) {
        return goalService.getMyGoals(authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalResponseDTO createGoal(
            Authentication authentication,
            @Valid @RequestBody CreateGoalRequestDTO request
    ) {
        return goalService.createGoal(authentication.getName(), request);
    }

    @PutMapping("/{id}")
    public GoalResponseDTO updateGoal(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateGoalRequestDTO request
    ) {
        return goalService.updateGoal(authentication.getName(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGoal(
            Authentication authentication,
            @PathVariable Long id
    ) {
        goalService.deleteGoal(authentication.getName(), id);
    }
}
