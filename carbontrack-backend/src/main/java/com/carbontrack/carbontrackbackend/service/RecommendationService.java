package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.analytics.CategoryOverviewDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationItemDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.RecommendationResponseDTO;
import com.carbontrack.carbontrackbackend.dto.recommendation.StartActionRequestDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.entity.Goal;
import com.carbontrack.carbontrackbackend.entity.Recommendation;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.GoalRepository;
import com.carbontrack.carbontrackbackend.repository.RecommendationRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
public class RecommendationService {

    private static final int PERIOD_DAYS = 30;
    private static final int MAX_LEGACY_RECOMMENDATIONS = 3;

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final RecommendationRepository recommendationRepository;
    private final GoalRepository goalRepository;

    public RecommendationService(ActivityLogRepository activityLogRepository) {
        this(activityLogRepository, null, null, null);
    }

    @Autowired
    public RecommendationService(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository,
            RecommendationRepository recommendationRepository,
            GoalRepository goalRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.recommendationRepository = recommendationRepository;
        this.goalRepository = goalRepository;
    }

    /**
     * Backward-compatible legacy weekly recommendations calculation.
     */
    @Transactional(readOnly = true)
    public RecommendationResponseDTO getWeeklyRecommendations(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("A valid user ID is required.");
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(PERIOD_DAYS - 1);

        List<ActivityLog> activities =
                activityLogRepository.findActivitiesForWeeklyAggregation(userId, startDate, endDate);

        Map<String, BigDecimal> emissionsByActivityType = new HashMap<>();

        for (ActivityLog activity : activities) {
            String activityType = activity.getActivityType();
            if (activityType == null || activity.getCo2eKg() == null) continue;
            activityType = activityType.trim().toUpperCase(Locale.ROOT);
            if (activityType.isBlank()) continue;

            emissionsByActivityType.merge(activityType, activity.getCo2eKg(), BigDecimal::add);
        }

        List<RecommendationItemDTO> recommendations = new ArrayList<>();
        emissionsByActivityType.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue(Comparator.reverseOrder())
                        .thenComparing(Map.Entry::getKey))
                .limit(MAX_LEGACY_RECOMMENDATIONS)
                .forEach(entry -> recommendations.add(
                        new RecommendationItemDTO(entry.getKey(), entry.getValue(), getTips(entry.getKey()))));

        return new RecommendationResponseDTO(PERIOD_DAYS, recommendations);
    }

    /**
     * Generates persistent data-driven recommendations from real activity logs without duplicates,
     * and returns the filtered recommendations for the user.
     */
    @Transactional
    public List<RecommendationDTO> getPersonalizedRecommendations(String email, String categoryFilter, String statusFilter) {
        User user = getUser(email);
        generateDataDrivenRecommendations(user);

        String cat = (categoryFilter != null && !categoryFilter.isBlank()) ? categoryFilter.trim().toUpperCase() : "ALL";
        String status = (statusFilter != null && !statusFilter.isBlank()) ? statusFilter.trim().toUpperCase() : "ACTIVE";

        List<Recommendation> list;
        if ("HISTORY".equals(status)) {
            list = recommendationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                    .filter(r -> "COMPLETED".equalsIgnoreCase(r.getStatus()) || "DISMISSED".equalsIgnoreCase(r.getStatus()))
                    .toList();
        } else if ("ALL".equals(status)) {
            list = recommendationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        } else {
            list = recommendationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), status);
        }

        if (!"ALL".equals(cat) && !"ALL ACTIVE".equals(cat)) {
            list = list.stream().filter(r -> matchesFilterCategory(r.getCategory(), cat)).toList();
        }

        return list.stream().map(this::toDTO).toList();
    }

    @Transactional
    public RecommendationDTO startAction(String email, Long recommendationId, StartActionRequestDTO request) {
        User user = getUser(email);
        Recommendation rec = recommendationRepository.findByIdAndUserId(recommendationId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recommendation not found"));

        if ("IN_PROGRESS".equalsIgnoreCase(rec.getStatus()) && rec.getConnectedGoal() != null) {
            return toDTO(rec);
        }

        LocalDate today = LocalDate.now();
        int days = (request != null && request.durationDays() != null && request.durationDays() > 0)
                ? request.durationDays()
                : 14;
        String period = (request != null && request.period() != null && !request.period().isBlank())
                ? request.period().trim().toUpperCase()
                : "WEEKLY";

        BigDecimal targetKg;
        if (request != null && request.targetCo2eKg() != null && request.targetCo2eKg().compareTo(BigDecimal.ZERO) > 0) {
            targetKg = request.targetCo2eKg().setScale(3, RoundingMode.HALF_UP);
        } else if (rec.getEstimatedSavingsKg().compareTo(BigDecimal.ZERO) > 0) {
            targetKg = rec.getEstimatedSavingsKg().multiply(BigDecimal.valueOf(2)).setScale(3, RoundingMode.HALF_UP);
        } else {
            targetKg = new BigDecimal("25.000");
        }

        String goalTitle = (request != null && request.goalTitle() != null && !request.goalTitle().isBlank())
                ? request.goalTitle().trim()
                : "Reduce " + rec.getCategory() + ": " + rec.getTitle();

        Goal goal = new Goal();
        goal.setUser(user);
        goal.setTitle(goalTitle);
        goal.setDescription("Generated from recommendation: " + rec.getTitle() + ". " + rec.getActionDescription());
        goal.setCategory(rec.getCategory());
        goal.setPeriod(period);
        goal.setTargetCo2eKg(targetKg);
        goal.setBaselineCo2eKg(targetKg.multiply(new BigDecimal("1.20")).setScale(3, RoundingMode.HALF_UP));
        goal.setReductionPercentage(new BigDecimal("16.67"));
        goal.setStartDate(today);
        goal.setEndDate(today.plusDays(days));
        goal.setStatus("ACTIVE");

        Goal savedGoal = goalRepository.save(goal);

        rec.setConnectedGoal(savedGoal);
        rec.setStatus("IN_PROGRESS");
        Recommendation savedRec = recommendationRepository.save(rec);

        return toDTO(savedRec);
    }

    @Transactional
    public RecommendationDTO updateStatus(String email, Long recommendationId, String newStatus) {
        User user = getUser(email);
        Recommendation rec = recommendationRepository.findByIdAndUserId(recommendationId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recommendation not found"));

        String status = (newStatus != null) ? newStatus.trim().toUpperCase() : "ACTIVE";
        if (!Set.of("ACTIVE", "IN_PROGRESS", "COMPLETED", "DISMISSED").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + newStatus);
        }

        rec.setStatus(status);
        Recommendation saved = recommendationRepository.save(rec);
        return toDTO(saved);
    }

    /**
     * Phase 4: Category-level emissions overview with trend analysis and goal comparisons.
     */
    @Transactional(readOnly = true)
    public List<CategoryOverviewDTO> getCategoryOverview(String email) {
        User user = getUser(email);
        LocalDate today = LocalDate.now();

        LocalDate curStart = today.minusDays(29);
        LocalDate curEnd = today;

        LocalDate prevStart = today.minusDays(59);
        LocalDate prevEnd = today.minusDays(30);

        List<ActivityLog> currentActivities = activityLogRepository.findActivitiesForWeeklyAggregation(user.getId(), curStart, curEnd);
        List<ActivityLog> prevActivities = activityLogRepository.findActivitiesForWeeklyAggregation(user.getId(), prevStart, prevEnd);
        List<Goal> activeGoals = goalRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(g -> "ACTIVE".equalsIgnoreCase(g.getStatus()))
                .toList();

        BigDecimal curTotal = currentActivities.stream()
                .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<String> categories = List.of("TRANSPORT", "ELECTRICITY", "FOOD", "SHOPPING", "WASTE", "WATER");
        List<CategoryOverviewDTO> overview = new ArrayList<>();

        for (String catKey : categories) {
            BigDecimal curCatEmissions = currentActivities.stream()
                    .filter(a -> matchesCategory(a, catKey))
                    .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(3, RoundingMode.HALF_UP);

            long curCount = currentActivities.stream()
                    .filter(a -> matchesCategory(a, catKey))
                    .count();

            BigDecimal prevCatEmissions = prevActivities.stream()
                    .filter(a -> matchesCategory(a, catKey))
                    .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(3, RoundingMode.HALF_UP);

            long prevCount = prevActivities.stream()
                    .filter(a -> matchesCategory(a, catKey))
                    .count();

            BigDecimal trendPct = null;
            String trendStatus;

            if (prevCount == 0 && curCount == 0) {
                trendStatus = "INSUFFICIENT_DATA";
            } else if (prevCount == 0 || prevCatEmissions.compareTo(BigDecimal.ZERO) == 0) {
                trendStatus = curCatEmissions.compareTo(BigDecimal.ZERO) > 0 ? "INCREASING" : "STABLE";
                trendPct = BigDecimal.ZERO;
            } else {
                trendPct = curCatEmissions.subtract(prevCatEmissions)
                        .divide(prevCatEmissions, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(1, RoundingMode.HALF_UP);

                if (trendPct.compareTo(new BigDecimal("5.0")) > 0) {
                    trendStatus = "INCREASING";
                } else if (trendPct.compareTo(new BigDecimal("-5.0")) < 0) {
                    trendStatus = "DECREASING";
                } else {
                    trendStatus = "STABLE";
                }
            }

            // Find active goal for this category
            Goal matchingGoal = activeGoals.stream()
                    .filter(g -> catKey.equalsIgnoreCase(g.getCategory())
                            || ("ELECTRICITY".equalsIgnoreCase(catKey) && "ENERGY".equalsIgnoreCase(g.getCategory())))
                    .findFirst()
                    .orElse(null);

            BigDecimal goalTarget = matchingGoal != null ? matchingGoal.getTargetCo2eKg() : null;
            BigDecimal activeGoalRemainingKg = null;
            String goalStatus = "NO_GOAL";
            if (matchingGoal != null) {
                if (goalTarget != null) {
                    activeGoalRemainingKg = goalTarget.subtract(curCatEmissions).setScale(3, RoundingMode.HALF_UP);
                    goalStatus = curCatEmissions.compareTo(goalTarget) <= 0 ? "WITHIN_BUDGET" : "EXCEEDED";
                } else {
                    goalStatus = "ACTIVE";
                }
            }

            // Define high emission based on user's own profile:
            // > 30% of total footprint OR > 20 kg with increasing trend
            boolean isHigh = false;
            String highReason = null;

            if (curTotal.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal sharePct = curCatEmissions.divide(curTotal, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
                if (sharePct.compareTo(new BigDecimal("30.0")) >= 0 && curCatEmissions.compareTo(new BigDecimal("10.0")) > 0) {
                    isHigh = true;
                    highReason = String.format("Accounts for %.1f%% of your total 30-day emissions (%.2f kg CO₂e).",
                            sharePct.doubleValue(), curCatEmissions.doubleValue());
                } else if ("INCREASING".equals(trendStatus) && trendPct != null && trendPct.compareTo(new BigDecimal("15.0")) >= 0) {
                    isHigh = true;
                    highReason = String.format("Emissions increased by %.1f%% compared to the previous 30-day period.",
                            trendPct.doubleValue());
                }
            }

            String displayName = switch (catKey) {
                case "TRANSPORT" -> "Transport & Commute";
                case "ELECTRICITY" -> "Home Energy & Electricity";
                case "FOOD" -> "Food & Diet";
                case "SHOPPING" -> "Shopping & Goods";
                case "WASTE" -> "Waste & Disposal";
                case "WATER" -> "Water Consumption";
                default -> catKey;
            };

            String includedTypes = switch (catKey) {
                case "TRANSPORT" -> "Petrol, Diesel, Flights, Bus, Train, Motorcycle";
                case "ELECTRICITY", "ENERGY" -> "Grid Electricity, Solar, Heating, Natural Gas";
                case "FOOD" -> "Vegetarian, Non-Veg, Beef, Vegan Meals";
                case "SHOPPING" -> "Clothing, Electronics, Consumer Goods, Groceries";
                case "WASTE" -> "Landfill Waste, Recycling, Compost";
                case "WATER" -> "Tap Water, Heated Water";
                default -> "General Activities";
            };

            String opportunity = getCategoryOpportunity(catKey, curCatEmissions);

            overview.add(new CategoryOverviewDTO(
                    catKey,
                    displayName,
                    curCatEmissions,
                    prevCount > 0 ? prevCatEmissions : null,
                    trendPct,
                    trendStatus,
                    curCount,
                    goalTarget,
                    activeGoalRemainingKg,
                    goalStatus,
                    isHigh,
                    highReason,
                    opportunity,
                    matchingGoal != null,
                    matchingGoal != null ? matchingGoal.getId() : null,
                    includedTypes
            ));
        }

        return overview;
    }

    private void generateDataDrivenRecommendations(User user) {
        if (recommendationRepository == null) return;

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(PERIOD_DAYS - 1);
        List<ActivityLog> activities = activityLogRepository.findActivitiesForWeeklyAggregation(user.getId(), startDate, endDate);

        // Group emissions by category and activity type
        Map<String, BigDecimal> catTotals = new HashMap<>();
        Map<String, BigDecimal> typeTotals = new HashMap<>();
        BigDecimal totalEmissions = BigDecimal.ZERO;

        for (ActivityLog a : activities) {
            BigDecimal co2 = a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO;
            totalEmissions = totalEmissions.add(co2);

            String cat = a.getCategory() != null ? a.getCategory().trim().toUpperCase() : "OTHER";
            catTotals.merge(cat, co2, BigDecimal::add);

            if (a.getActivityType() != null) {
                typeTotals.merge(a.getActivityType().trim().toUpperCase(), co2, BigDecimal::add);
            }
        }

        List<Recommendation> candidateRecommendations = new ArrayList<>();

        // 1. Transport Recommendations
        BigDecimal carPetrolCo2 = typeTotals.getOrDefault("CAR_PETROL", BigDecimal.ZERO)
                .add(typeTotals.getOrDefault("CAR_DIESEL", BigDecimal.ZERO));
        BigDecimal allTransportCo2 = catTotals.getOrDefault("TRANSPORT", BigDecimal.ZERO);

        if (carPetrolCo2.compareTo(new BigDecimal("10.0")) >= 0 || allTransportCo2.compareTo(new BigDecimal("15.0")) >= 0) {
            BigDecimal estSavings = carPetrolCo2.multiply(new BigDecimal("0.35")).setScale(3, RoundingMode.HALF_UP);
            candidateRecommendations.add(new Recommendation(
                    user,
                    "TRANSPORT",
                    "CAR_PETROL",
                    "Replace 2 Weekly Car Commutes with Transit or Cycling",
                    String.format("You logged %.2f kg CO₂e from petrol/diesel vehicle travel in the past 30 days.", carPetrolCo2),
                    "Combine errands and switch two routine solo drives per week to public bus, train, or cycling. For journeys under 3 km, walking or cycling produces 0.00 kg CO₂e.",
                    carPetrolCo2.compareTo(new BigDecimal("30.0")) >= 0 ? "HIGH" : "MEDIUM",
                    "MEDIUM",
                    estSavings,
                    String.format("Assumes a 35%% reduction on observed vehicle emissions (%.2f kg CO₂e) by substituting lower-carbon modes.", carPetrolCo2),
                    "1 - 2 weeks"
            ));
        }

        // 2. Electricity / Energy Recommendations
        BigDecimal elecCo2 = catTotals.getOrDefault("ELECTRICITY", BigDecimal.ZERO)
                .add(typeTotals.getOrDefault("GRID_ELECTRICITY", BigDecimal.ZERO))
                .add(typeTotals.getOrDefault("LPG", BigDecimal.ZERO));

        if (elecCo2.compareTo(new BigDecimal("15.0")) >= 0) {
            BigDecimal estSavings = elecCo2.multiply(new BigDecimal("0.25")).setScale(3, RoundingMode.HALF_UP);
            candidateRecommendations.add(new Recommendation(
                    user,
                    "ENERGY",
                    "ELECTRICITY",
                    "Eliminate Phantom Loads and Optimize High-Draw Appliances",
                    String.format("Home electricity and gas accounted for %.2f kg CO₂e in the last 30 days.", elecCo2),
                    "Turn off entertainment units and chargers at the wall when not in use. Run dishwashers and washing machines with full loads on eco-cycles (cold wash saves up to 80% electricity per cycle).",
                    elecCo2.compareTo(new BigDecimal("40.0")) >= 0 ? "HIGH" : "MEDIUM",
                    "EASY",
                    estSavings,
                    String.format("Assumes 25%% electricity reduction (%.2f kg CO₂e saved) through standby power elimination and wash optimization.", estSavings),
                    "Immediate"
            ));
        }

        // 3. Food Recommendations (Beef / Non-Veg)
        BigDecimal beefCo2 = typeTotals.getOrDefault("FOOD_BEEF", BigDecimal.ZERO)
                .add(typeTotals.getOrDefault("MEAL_BEEF", BigDecimal.ZERO));
        BigDecimal allFoodCo2 = catTotals.getOrDefault("FOOD", BigDecimal.ZERO);

        if (beefCo2.compareTo(new BigDecimal("8.0")) >= 0 || allFoodCo2.compareTo(new BigDecimal("20.0")) >= 0) {
            BigDecimal base = beefCo2.compareTo(BigDecimal.ZERO) > 0 ? beefCo2 : allFoodCo2;
            BigDecimal estSavings = base.multiply(new BigDecimal("0.40")).setScale(3, RoundingMode.HALF_UP);
            candidateRecommendations.add(new Recommendation(
                    user,
                    "FOOD",
                    "FOOD_BEEF",
                    "Adopt Two Plant-Forward Days Per Week",
                    String.format("High-emission meals contributed %.2f kg CO₂e over the recorded period.", base),
                    "Replace two beef or red meat meals each week with plant-based alternatives (lentils, chickpeas, tofu). Beef averages ~5.0 kg CO₂e per serving compared to ~0.8 kg for vegetarian options.",
                    beefCo2.compareTo(new BigDecimal("20.0")) >= 0 ? "HIGH" : "MEDIUM",
                    "EASY",
                    estSavings,
                    String.format("Assumes swapping 2 meat servings/week for plant proteins (saving ~4.2 kg CO₂e per meal swap)."),
                    "2 - 4 weeks"
            ));
        }

        // 4. Shopping & Goods Recommendations
        BigDecimal shopCo2 = catTotals.getOrDefault("SHOPPING", BigDecimal.ZERO)
                .add(typeTotals.getOrDefault("CLOTHING", BigDecimal.ZERO))
                .add(typeTotals.getOrDefault("ELECTRONICS", BigDecimal.ZERO));

        if (shopCo2.compareTo(new BigDecimal("10.0")) >= 0) {
            BigDecimal estSavings = shopCo2.multiply(new BigDecimal("0.30")).setScale(3, RoundingMode.HALF_UP);
            candidateRecommendations.add(new Recommendation(
                    user,
                    "SHOPPING",
                    "SHOPPING",
                    "Prioritize Repair, Reuse and Pre-Owned Purchases",
                    String.format("Apparel and consumer goods purchases generated %.2f kg CO₂e.", shopCo2),
                    "Before replacing electronics or wardrobe items, check if repair or refurbishment is available. Extending garment life by 9 months reduces its carbon footprint by 20-30%.",
                    "MEDIUM",
                    "MEDIUM",
                    estSavings,
                    String.format("Assumes avoiding 30%% of new manufacturing embodied emissions through repair and reuse."),
                    "1 month"
            ));
        }

        // 5. Waste Reduction
        BigDecimal wasteCo2 = typeTotals.getOrDefault("WASTE", BigDecimal.ZERO);
        if (wasteCo2.compareTo(new BigDecimal("4.0")) >= 0) {
            BigDecimal estSavings = wasteCo2.multiply(new BigDecimal("0.30")).setScale(3, RoundingMode.HALF_UP);
            candidateRecommendations.add(new Recommendation(
                    user,
                    "WASTE",
                    "WASTE",
                    "Household Composting & Strict Material Segregation",
                    String.format("Organic waste decomposition accounted for %.2f kg CO₂e.", wasteCo2),
                    "Separate food scraps for organic composting rather than landfill disposal. Anaerobic landfill decomposition releases methane, which has 28x the warming potential of CO₂.",
                    "LOW",
                    "EASY",
                    estSavings,
                    String.format("Assumes diverting 30%% of landfill-bound organics to aerated compost."),
                    "1 week"
            ));
        }

        // 6. Comprehensive Carbon Reduction (if user has high total emissions or low data)
        if (activities.size() < 3) {
            candidateRecommendations.add(new Recommendation(
                    user,
                    "CARBON_REDUCTION",
                    null,
                    "Establish Your 7-Day Carbon Footprint Baseline",
                    "You have logged limited activity records in the last 30 days.",
                    "Log your daily travel, home electricity, and diet for 7 continuous days. A complete activity log allows CarbonTrack's models to accurately project savings and customize your targets.",
                    "HIGH",
                    "EASY",
                    BigDecimal.ZERO,
                    "Baseline collection phase: accurate reduction begins with continuous tracking.",
                    "7 days"
            ));
        } else if (totalEmissions.compareTo(new BigDecimal("50.0")) >= 0) {
            BigDecimal estSavings = totalEmissions.multiply(new BigDecimal("0.15")).setScale(3, RoundingMode.HALF_UP);
            candidateRecommendations.add(new Recommendation(
                    user,
                    "CARBON_REDUCTION",
                    null,
                    "Commit to an Overall 15% Monthly Footprint Reduction",
                    String.format("Your 30-day cumulative carbon footprint is %.2f kg CO₂e across all categories.", totalEmissions),
                    "Create an overarching monthly sustainability goal to keep your total emissions below " +
                            totalEmissions.multiply(new BigDecimal("0.85")).setScale(1, RoundingMode.HALF_UP) + " kg CO₂e.",
                    "HIGH",
                    "MEDIUM",
                    estSavings,
                    String.format("Assumes an achievable 15%% across-the-board reduction across your active categories."),
                    "1 month"
            ));
        }

        // Save candidate recommendations only if not already active or in-progress or dismissed/completed for this user!
        for (Recommendation cand : candidateRecommendations) {
            boolean alreadyExists = recommendationRepository.existsByUserIdAndTitleAndStatusIn(
                    user.getId(), cand.getTitle(), List.of("ACTIVE", "IN_PROGRESS", "DISMISSED", "COMPLETED"));
            if (!alreadyExists) {
                recommendationRepository.save(cand);
            }
        }
    }

    private RecommendationDTO toDTO(Recommendation r) {
        return new RecommendationDTO(
                r.getId(),
                r.getCategory(),
                r.getActivityType(),
                r.getTitle(),
                r.getObservation(),
                r.getActionDescription(),
                r.getPriority(),
                r.getDifficulty(),
                r.getEstimatedSavingsKg(),
                r.getSavingsAssumptions(),
                r.getTimeframe(),
                r.getStatus(),
                r.getConnectedGoal() != null ? r.getConnectedGoal().getId() : null,
                r.getCreatedAt()
        );
    }

    private User getUser(String email) {
        if (userRepository == null) {
            throw new IllegalStateException("UserRepository not injected");
        }
        return userRepository.findByEmail(email)
                .or(() -> userRepository.findByUsername(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private boolean matchesFilterCategory(String recCategory, String filter) {
        if (recCategory == null) return false;
        String r = recCategory.toUpperCase();
        String f = filter.toUpperCase();
        if (f.equals("ENERGY") && r.equals("ELECTRICITY")) return true;
        if (f.equals("ELECTRICITY") && r.equals("ENERGY")) return true;
        return r.equals(f);
    }

    private boolean matchesCategory(ActivityLog activity, String catKey) {
        if (activity == null || catKey == null) return false;
        String cat = activity.getCategory() != null ? activity.getCategory().trim().toUpperCase() : "";
        String type = activity.getActivityType() != null ? activity.getActivityType().trim().toUpperCase() : "";

        return switch (catKey) {
            case "TRANSPORT" -> cat.equals("TRANSPORT") || type.contains("CAR") || type.contains("BUS")
                    || type.contains("TRAIN") || type.contains("FLIGHT") || type.contains("MOTORCYCLE")
                    || type.contains("BICYCLE") || type.contains("WALKING");
            case "ELECTRICITY", "ENERGY" -> cat.equals("ELECTRICITY") || cat.equals("ENERGY")
                    || type.contains("ELEC") || type.contains("GRID") || type.contains("SOLAR")
                    || type.contains("LPG") || type.contains("GAS") || type.contains("HEATING");
            case "FOOD" -> cat.equals("FOOD") || type.contains("MEAL") || type.contains("FOOD")
                    || type.contains("BEEF") || type.contains("VEGAN") || type.contains("VEGETARIAN")
                    || type.contains("CHICKEN") || type.contains("MEAT");
            case "SHOPPING" -> cat.equals("SHOPPING") || type.contains("CLOTH") || type.contains("ELECTRONIC")
                    || type.contains("GROCER");
            case "WASTE" -> cat.equals("WASTE") || type.contains("WASTE");
            case "WATER" -> cat.equals("WATER") || type.contains("WATER");
            default -> cat.equalsIgnoreCase(catKey);
        };
    }

    private String getCategoryOpportunity(String catKey, BigDecimal currentKg) {
        return switch (catKey) {
            case "TRANSPORT" -> "High reduction potential: shifting 1-2 commutes/week to public transit or cycling yields rapid savings.";
            case "ELECTRICITY" -> "Immediate efficiency gains: power strips for vampire draw and eco temperature settings.";
            case "FOOD" -> "Dietary shifts: substituting beef with poultry or plant proteins reduces food carbon footprint by up to 60%.";
            case "SHOPPING" -> "Embodied emissions: repairing electronics and buying durable goods curbs upstream supply chain emissions.";
            case "WASTE" -> "Methane avoidance: home composting keeps organic matter out of anaerobic landfills.";
            case "WATER" -> "Low-flow fixtures and conscious water heating conservation.";
            default -> "Review detailed activity logs to find practical low-carbon alternatives.";
        };
    }

    private List<String> getTips(String activityType) {
        return switch (activityType) {
            case "CAR_PETROL", "CAR_DIESEL", "CAR_GASOLINE" -> List.of(
                    "Consider public transport for suitable regular journeys.",
                    "Combine nearby errands into one trip.",
                    "Consider walking or cycling for short, safe journeys."
            );
            case "MOTORCYCLE", "MOTORBIKE" -> List.of(
                    "Combine nearby errands to reduce separate trips.",
                    "Consider walking, cycling, or public transport for suitable journeys."
            );
            case "ELECTRICITY", "ELECTRICITY_CONSUMPTION" -> List.of(
                    "Switch off lights and appliances when they are not needed.",
                    "Use energy-efficient lighting and appliances where practical.",
                    "Reduce unnecessary heating and cooling."
            );
            case "FLIGHT", "AIR_TRAVEL" -> List.of(
                    "Consider rail or virtual meetings when practical alternatives exist.",
                    "Combine trips when possible to avoid separate journeys."
            );
            case "BUS", "PUBLIC_TRANSPORT", "TRAIN" -> List.of(
                    "Continue considering public transport for suitable journeys.",
                    "Combine errands to reduce the number of trips."
            );
            case "MEAT", "BEEF", "FOOD", "FOOD_CONSUMPTION", "FOOD_VEGETARIAN" -> List.of(
                    "Plan meals to reduce avoidable food waste.",
                    "Choose seasonal foods when practical.",
                    "Consider locally available foods when suitable."
            );
            case "SHOPPING", "CLOTHING", "ELECTRONICS" -> List.of(
                    "Consider repairing or reusing items before replacing them.",
                    "Choose durable products that meet your needs.",
                    "Consider second-hand items when suitable."
            );
            default -> List.of(
                    "Review this activity to identify practical ways to reduce its environmental impact.",
                    "Consider lower-emission alternatives where they are suitable."
            );
        };
    }
}
