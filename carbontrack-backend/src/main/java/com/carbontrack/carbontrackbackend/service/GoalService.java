
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
        goal.setCategory(request.getCategory());
        goal.setPeriod(request.getPeriod());

        if (request.getBaselineCo2eKg() != null && request.getReductionPercentage() != null) {
            BigDecimal baseline = request.getBaselineCo2eKg().setScale(3, RoundingMode.HALF_UP);
            BigDecimal reduction = request.getReductionPercentage().setScale(2, RoundingMode.HALF_UP);
            goal.setBaselineCo2eKg(baseline);
            goal.setReductionPercentage(reduction);
            goal.setTargetCo2eKg(calculateTarget(baseline, reduction));
        } else if (request.getTargetCo2eKg() != null) {
            BigDecimal target = request.getTargetCo2eKg().setScale(3, RoundingMode.HALF_UP);
            goal.setTargetCo2eKg(target);
            goal.setBaselineCo2eKg(target);
            goal.setReductionPercentage(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        } else {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Either target limit or baseline and reduction percentage is required");
        }

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
        if (request.getCategory() != null) {
            goal.setCategory(request.getCategory());
        }
        if (request.getPeriod() != null) {
            goal.setPeriod(request.getPeriod());
        }

        if (request.getBaselineCo2eKg() != null && request.getReductionPercentage() != null) {
            BigDecimal baseline = request.getBaselineCo2eKg().setScale(3, RoundingMode.HALF_UP);
            BigDecimal reduction = request.getReductionPercentage().setScale(2, RoundingMode.HALF_UP);
            goal.setBaselineCo2eKg(baseline);
            goal.setReductionPercentage(reduction);
            goal.setTargetCo2eKg(calculateTarget(baseline, reduction));
        } else if (request.getTargetCo2eKg() != null) {
            BigDecimal target = request.getTargetCo2eKg().setScale(3, RoundingMode.HALF_UP);
            goal.setTargetCo2eKg(target);
            goal.setBaselineCo2eKg(target);
            goal.setReductionPercentage(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        }

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
        String category = goal.getCategory() != null ? goal.getCategory().trim().toUpperCase() : "ALL";
        String period = goal.getPeriod() != null ? goal.getPeriod().trim().toUpperCase() : "CUSTOM";

        BigDecimal current;
        String includedCategories;

        if ("ALL".equals(category) || "ALL_CATEGORIES".equals(category)) {
            current = activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(
                    goal.getUser().getId(),
                    goal.getStartDate(),
                    goal.getEndDate());
            includedCategories = "All Categories (Transport, Energy, Food, Shopping, Waste, Water)";
        } else if ("TRANSPORT".equals(category)) {
            current = activityLogRepository.sumCo2eKgByUserIdAndCategoriesOrActivityTypesAndLogDateBetween(
                    goal.getUser().getId(),
                    List.of("TRANSPORT"),
                    List.of("CAR_PETROL", "CAR_DIESEL", "CAR_GASOLINE", "CAR_ELECTRIC", "MOTORCYCLE",
                            "MOTORCYCLE_PETROL", "MOTORBIKE", "BUS", "PUBLIC_TRANSPORT", "TRAIN", "FLIGHT",
                            "AIR_TRAVEL", "FLIGHT_SHORT", "FLIGHT_LONG", "BICYCLE", "WALKING"),
                    goal.getStartDate(),
                    goal.getEndDate());
            includedCategories = "Transport (Car, Bus, Train, Flight, Motorcycle, Cycling)";
        } else if ("ENERGY".equals(category) || "ELECTRICITY".equals(category)) {
            current = activityLogRepository.sumCo2eKgByUserIdAndCategoriesOrActivityTypesAndLogDateBetween(
                    goal.getUser().getId(),
                    List.of("ELECTRICITY", "ENERGY"),
                    List.of("ELECTRICITY", "GRID_ELECTRICITY", "SOLAR", "LPG", "GAS", "HEATING"),
                    goal.getStartDate(),
                    goal.getEndDate());
            includedCategories = "Energy (Electricity, Solar, LPG, Gas, Heating)";
        } else if ("FOOD".equals(category)) {
            current = activityLogRepository.sumCo2eKgByUserIdAndCategoriesOrActivityTypesAndLogDateBetween(
                    goal.getUser().getId(),
                    List.of("FOOD"),
                    List.of("MEAT", "BEEF", "FOOD_BEEF", "FOOD_NON_VEGETARIAN", "FOOD_VEGETARIAN",
                            "MEAL_VEGAN", "MEAL_VEGETARIAN", "MEAL_CHICKEN", "MEAL_BEEF"),
                    goal.getStartDate(),
                    goal.getEndDate());
            includedCategories = "Food (Vegetarian, Non-Veg, Beef, Vegan Meals)";
        } else if ("SHOPPING".equals(category)) {
            current = activityLogRepository.sumCo2eKgByUserIdAndCategoriesOrActivityTypesAndLogDateBetween(
                    goal.getUser().getId(),
                    List.of("SHOPPING"),
                    List.of("SHOPPING", "CLOTHING", "ELECTRONICS", "GROCERIES"),
                    goal.getStartDate(),
                    goal.getEndDate());
            includedCategories = "Shopping (Clothing, Electronics, Groceries)";
        } else if ("WASTE".equals(category)) {
            current = activityLogRepository.sumCo2eKgByUserIdAndCategoriesOrActivityTypesAndLogDateBetween(
                    goal.getUser().getId(),
                    List.of("WASTE"),
                    List.of("WASTE"),
                    goal.getStartDate(),
                    goal.getEndDate());
            includedCategories = "Waste & Recycling";
        } else if ("WATER".equals(category)) {
            current = activityLogRepository.sumCo2eKgByUserIdAndCategoriesOrActivityTypesAndLogDateBetween(
                    goal.getUser().getId(),
                    List.of("WATER"),
                    List.of("WATER"),
                    goal.getStartDate(),
                    goal.getEndDate());
            includedCategories = "Water Consumption";
        } else {
            current = activityLogRepository.sumCo2eKgByUserIdAndLogDateBetween(
                    goal.getUser().getId(),
                    goal.getStartDate(),
                    goal.getEndDate());
            includedCategories = category;
        }

        if (current == null) {
            current = BigDecimal.ZERO;
        }

        BigDecimal currentCo2eKg = current.setScale(3, RoundingMode.HALF_UP);
        BigDecimal target = goal.getTargetCo2eKg() != null ? goal.getTargetCo2eKg().setScale(3, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal baseline = goal.getBaselineCo2eKg();
        BigDecimal remainingAllowanceKg = target.subtract(currentCo2eKg).setScale(3, RoundingMode.HALF_UP);

        Double percentageConsumed = 0.0;
        if (target.compareTo(BigDecimal.ZERO) > 0) {
            percentageConsumed = currentCo2eKg.divide(target, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue();
            percentageConsumed = Math.round(percentageConsumed * 10.0) / 10.0;
        }

        double progressPct = 0.0;
        if (baseline != null && target.compareTo(BigDecimal.ZERO) > 0 && baseline.compareTo(target) > 0) {
            BigDecimal reductionAchieved = baseline.subtract(currentCo2eKg);
            BigDecimal reductionNeeded = baseline.subtract(target);

            progressPct = reductionAchieved
                    .divide(reductionNeeded, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();

            progressPct = Math.max(0.0, Math.min(100.0, progressPct));
            progressPct = Math.round(progressPct * 10.0) / 10.0;
        } else if (target.compareTo(BigDecimal.ZERO) > 0) {
            progressPct = Math.max(0.0, Math.min(100.0, 100.0 - percentageConsumed));
            progressPct = Math.round(progressPct * 10.0) / 10.0;
        }

        LocalDate today = LocalDate.now();
        boolean cancelled = "CANCELLED".equalsIgnoreCase(goal.getStatus());
        boolean pastEndDate = today.isAfter(goal.getEndDate());
        boolean withinBudget = target.compareTo(BigDecimal.ZERO) > 0
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
                category,
                period,
                baseline,
                goal.getReductionPercentage(),
                target,
                currentCo2eKg,
                remainingAllowanceKg,
                percentageConsumed,
                progressPct,
                withinBudget,
                goal.getStartDate(),
                goal.getEndDate(),
                dynamicStatus,
                completed,
                overdue,
                includedCategories,
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
