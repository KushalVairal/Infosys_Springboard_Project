
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
import com.carbontrack.carbontrackbackend.repository.GoalAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalDate;
import java.util.List;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final GoalAlertRepository goalAlertRepository;

    @Autowired
    public GoalService(
            GoalRepository goalRepository,
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository,
            GoalAlertRepository goalAlertRepository) {
        this.goalRepository = goalRepository;
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.goalAlertRepository = goalAlertRepository;
    }

    public GoalService(
            GoalRepository goalRepository,
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository) {
        this(goalRepository, activityLogRepository, userRepository, null);
    }

    @Transactional(readOnly = true)
    public List<GoalResponseDTO> getMyGoals(String email) {
        User user = findUser(email);

        return goalRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional
    public GoalResponseDTO createGoal(
            String email,
            CreateGoalRequestDTO request) {

        validateDates(request.getStartDate(), request.getEndDate());

        User user = findUser(email);

        Goal goal = new Goal();
        goal.setUser(user);
        goal.setTitle(request.getTitle().trim());
        goal.setDescription(trimOrNull(request.getDescription()));
        goal.setBaselineCo2eKg(
                request.getBaselineCo2eKg().setScale(3, RoundingMode.HALF_UP));
        goal.setReductionPercentage(
                request.getReductionPercentage().setScale(2, RoundingMode.HALF_UP));
        goal.setTargetCo2eKg(calculateTarget(
                request.getBaselineCo2eKg(),
                request.getReductionPercentage()));
        goal.setStartDate(request.getStartDate());
        goal.setEndDate(request.getEndDate());
        goal.setStatus("ACTIVE");

        Goal saved = goalRepository.save(goal);
        return convertToDTO(saved);
    }

    @Transactional
    public GoalResponseDTO updateGoal(
            String email,
            Long goalId,
            UpdateGoalRequestDTO request) {

        validateDates(request.getStartDate(), request.getEndDate());

        User user = findUser(email);

        Goal goal = goalRepository
                .findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Goal not found"));

        goal.setTitle(request.getTitle().trim());
        goal.setDescription(trimOrNull(request.getDescription()));
        goal.setBaselineCo2eKg(
                request.getBaselineCo2eKg().setScale(3, RoundingMode.HALF_UP));
        goal.setReductionPercentage(
                request.getReductionPercentage().setScale(2, RoundingMode.HALF_UP));
        goal.setTargetCo2eKg(calculateTarget(
                request.getBaselineCo2eKg(),
                request.getReductionPercentage()));
        goal.setStartDate(request.getStartDate());
        goal.setEndDate(request.getEndDate());

        if (request.getStatus() != null) {
            goal.setStatus(request.getStatus().trim().toUpperCase());
        }

        Goal saved = goalRepository.save(goal);
        return convertToDTO(saved);
    }

    @Transactional(readOnly = true)
    public GoalResponseDTO getGoalProgress(String email, Long goalId) {
        User user = findUser(email);

        Goal goal = goalRepository
                .findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Goal not found"));

        return convertToDTO(goal);
    }

    @Transactional
    public void deleteGoal(String email, Long goalId) {
        User user = findUser(email);

        Goal goal = goalRepository
                .findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Goal not found"));

        if (goalAlertRepository != null) {
            goalAlertRepository.deleteByGoalId(goalId);
        }
        goalRepository.delete(goal);
    }

    private BigDecimal calculateTarget(
            BigDecimal baseline,
            BigDecimal reductionPercentage) {

        BigDecimal reductionFraction = reductionPercentage.divide(
                BigDecimal.valueOf(100),
                6,
                RoundingMode.HALF_UP);

        return baseline.multiply(BigDecimal.ONE.subtract(reductionFraction))
                .setScale(3, RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public GoalResponseDTO convertToDTO(Goal goal) {
        BigDecimal current = activityLogRepository
                .sumCo2eKgByUserIdAndLogDateBetween(
                        goal.getUser().getId(),
                        goal.getStartDate(),
                        goal.getEndDate());

        if (current == null) {
            current = BigDecimal.ZERO;
        }

        BigDecimal currentCo2eKg = current.setScale(3, RoundingMode.HALF_UP);
        BigDecimal target = goal.getTargetCo2eKg();
        BigDecimal baseline = goal.getBaselineCo2eKg();

        double progressPct = 0.0;

        if (baseline != null && target != null
                && baseline.compareTo(target) > 0) {

            BigDecimal reductionAchieved = baseline.subtract(currentCo2eKg);
            BigDecimal reductionNeeded = baseline.subtract(target);

            progressPct = reductionAchieved
                    .divide(reductionNeeded, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();

            progressPct = Math.max(0.0, Math.min(100.0, progressPct));
            progressPct = Math.round(progressPct * 10.0) / 10.0;
        }

        LocalDate today = LocalDate.now();
        boolean cancelled = "CANCELLED".equalsIgnoreCase(goal.getStatus());
        boolean pastEndDate = today.isAfter(goal.getEndDate());
        boolean withinBudget = target != null
                && currentCo2eKg.compareTo(target) <= 0;

        String dynamicStatus;
        boolean completed = false;
        boolean overdue = false;

        if (cancelled) {
            dynamicStatus = "CANCELLED";
        } else if (pastEndDate && withinBudget) {
            dynamicStatus = "COMPLETED";
            completed = true;
        } else if (pastEndDate) {
            dynamicStatus = "OVERDUE";
            overdue = true;
        } else if (withinBudget) {
            dynamicStatus = "ACTIVE";
        } else {
            dynamicStatus = "EXCEEDED";
        }

        return new GoalResponseDTO(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                baseline,
                goal.getReductionPercentage(),
                target,
                currentCo2eKg,
                progressPct,
                goal.getStartDate(),
                goal.getEndDate(),
                dynamicStatus,
                completed,
                overdue,
                goal.getCreatedAt());
    }

    private void validateDates(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "End date cannot be before start date");
        }
    }

    private String trimOrNull(String value) {
        return value == null ? null : value.trim();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }
}
