
package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.goal.CreateGoalRequestDTO;
import com.carbontrack.carbontrackbackend.dto.goal.GoalResponseDTO;
import com.carbontrack.carbontrackbackend.dto.goal.UpdateGoalRequestDTO;
import com.carbontrack.carbontrackbackend.service.GoalService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @PostMapping
    public ResponseEntity<GoalResponseDTO> createGoal(
            Authentication authentication,
            @Valid @RequestBody CreateGoalRequestDTO request) {

        GoalResponseDTO response = goalService.createGoal(
                authentication.getName(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<List<GoalResponseDTO>> getMyGoals(
            Authentication authentication) {

        return ResponseEntity.ok(
                goalService.getMyGoals(authentication.getName()));
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<GoalResponseDTO> getGoalProgress(
            Authentication authentication,
            @PathVariable Long id) {

        return ResponseEntity.ok(
                goalService.getGoalProgress(authentication.getName(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponseDTO> updateGoal(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateGoalRequestDTO request) {

        return ResponseEntity.ok(
                goalService.updateGoal(authentication.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
            Authentication authentication,
            @PathVariable Long id) {

        goalService.deleteGoal(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
