package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.goal.CreateGoalRequestDTO;
import com.carbontrack.carbontrackbackend.dto.goal.GoalResponseDTO;
import com.carbontrack.carbontrackbackend.dto.goal.UpdateGoalRequestDTO;
import com.carbontrack.carbontrackbackend.entity.Goal;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.GoalRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public GoalService(
            GoalRepository goalRepository,
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository
    ) {
        this.goalRepository = goalRepository;
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<GoalResponseDTO> getMyGoals(String email) {
        User user = findUser(email);
        List<Goal> goals = goalRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return goals.stream().map(this::convertToDTO).toList();
    }

    @Transactional
    public GoalResponseDTO createGoal(String email, CreateGoalRequestDTO request) {
        User user = findUser(email);

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "End date cannot be before start date"
            );
        }

        Goal goal = new Goal();
        goal.setUser(user);
        goal.setTitle(request.getTitle().trim());
        goal.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        goal.setTargetCo2eKg(request.getTargetCo2eKg().setScale(3, RoundingMode.HALF_UP));
        goal.setStartDate(request.getStartDate());
        goal.setEndDate(request.getEndDate());
        goal.setStatus("ACTIVE");

        Goal saved = goalRepository.save(goal);
        return convertToDTO(saved);
    }

    @Transactional
    public GoalResponseDTO updateGoal(String email, Long goalId, UpdateGoalRequestDTO request) {
        User user = findUser(email);

        Goal goal = goalRepository.findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Goal not found"
                ));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "End date cannot be before start date"
            );
        }

        goal.setTitle(request.getTitle().trim());
        goal.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        goal.setTargetCo2eKg(request.getTargetCo2eKg().setScale(3, RoundingMode.HALF_UP));
        goal.setStartDate(request.getStartDate());
        goal.setEndDate(request.getEndDate());

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            goal.setStatus(request.getStatus().trim().toUpperCase());
        }

        Goal saved = goalRepository.save(goal);
        return convertToDTO(saved);
    }

    @Transactional
    public void deleteGoal(String email, Long goalId) {
        User user = findUser(email);

        Goal goal = goalRepository.findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Goal not found"
                ));

        goalRepository.delete(goal);
    }

    public GoalResponseDTO convertToDTO(Goal goal) {
        BigDecimal current = activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(
                goal.getUser().getId(),
                goal.getStartDate(),
                goal.getEndDate()
        );

        if (current == null) {
            current = BigDecimal.ZERO;
        }

        BigDecimal currentCo2eKg = current.setScale(3, RoundingMode.HALF_UP);
        BigDecimal target = goal.getTargetCo2eKg();

        double progressPct = 0.0;
        if (target != null && target.compareTo(BigDecimal.ZERO) > 0) {
            progressPct = currentCo2eKg.doubleValue() / target.doubleValue() * 100.0;
            progressPct = Math.round(progressPct * 10.0) / 10.0;
        }

        LocalDate now = LocalDate.now();
        boolean isCancelled = "CANCELLED".equalsIgnoreCase(goal.getStatus());
        boolean isPastEndDate = now.isAfter(goal.getEndDate());
        boolean withinBudget = currentCo2eKg.compareTo(target) <= 0;

        String dynamicStatus;
        boolean completed = false;
        boolean overdue = false;

        if (isCancelled) {
            dynamicStatus = "CANCELLED";
        } else if (isPastEndDate) {
            if (withinBudget) {
                dynamicStatus = "COMPLETED";
                completed = true;
            } else {
                dynamicStatus = "OVERDUE";
                overdue = true;
            }
        } else {
            if (withinBudget) {
                dynamicStatus = "ACTIVE";
            } else {
                dynamicStatus = "EXCEEDED";
            }
        }

        return new GoalResponseDTO(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getTargetCo2eKg(),
                currentCo2eKg,
                progressPct,
                goal.getStartDate(),
                goal.getEndDate(),
                dynamicStatus,
                completed,
                overdue,
                goal.getCreatedAt()
        );
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
    }
}
