package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.benchmark.BenchmarkResponseDTO;
import com.carbontrack.carbontrackbackend.dto.benchmark.CategoryBenchmarkDTO;
import com.carbontrack.carbontrackbackend.dto.benchmark.CategoryEmissionAggregateDTO;
import com.carbontrack.carbontrackbackend.dto.benchmark.UserEmissionAggregateDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
public class BenchmarkService {

    public static final int PERIOD_DAYS = 30;
    public static final int MINIMUM_COHORT_SIZE = 3;
    private static final List<String> STANDARD_CATEGORIES =
            List.of("TRANSPORT", "ELECTRICITY", "FOOD", "SHOPPING");

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public BenchmarkService(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public BenchmarkResponseDTO getMyBenchmark(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        return calculateBenchmark(user.getId());
    }

    @Transactional(readOnly = true)
    public BenchmarkResponseDTO calculateBenchmark(Long userId) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(PERIOD_DAYS - 1);

        // Active peer cohort: all users with at least one activity log in the rolling window
        List<UserEmissionAggregateDTO> userTotals =
                activityLogRepository.findUserTotalEmissionsBetween(startDate, endDate);

        int cohortSize = userTotals.size();

        // Check if authenticated user is in active cohort
        Optional<UserEmissionAggregateDTO> userRecordOpt = userTotals.stream()
                .filter(u -> Objects.equals(u.userId(), userId))
                .findFirst();

        boolean userHasActivity = userRecordOpt.isPresent();
        BigDecimal userTotal = userRecordOpt
                .map(UserEmissionAggregateDTO::totalCo2eKg)
                .orElse(BigDecimal.ZERO)
                .setScale(3, RoundingMode.HALF_UP);

        // Case 1: Cohort smaller than 3 active users -> Suppress peer stats for privacy
        if (cohortSize < MINIMUM_COHORT_SIZE) {
            return new BenchmarkResponseDTO(
                    PERIOD_DAYS,
                    startDate,
                    endDate,
                    cohortSize,
                    userTotal,
                    null,
                    null,
                    "INSUFFICIENT_PEERS",
                    "Benchmarking requires at least 3 active peers in the rolling 30-day window to protect participant privacy.",
                    Collections.emptyList()
            );
        }

        // Calculate anonymous platform averages
        BigDecimal platformTotalSum = userTotals.stream()
                .map(UserEmissionAggregateDTO::totalCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal platformAverage = platformTotalSum.divide(
                BigDecimal.valueOf(cohortSize), 3, RoundingMode.HALF_UP);

        // Category breakdowns
        List<CategoryEmissionAggregateDTO> platformCategoryTotals =
                activityLogRepository.findCategoryTotalEmissionsBetween(startDate, endDate);

        Map<String, BigDecimal> platformCategorySumMap = new HashMap<>();
        if (platformCategoryTotals != null) {
            for (CategoryEmissionAggregateDTO catSum : platformCategoryTotals) {
                if (catSum != null && catSum.category() != null && catSum.totalCo2eKg() != null) {
                    String cat = catSum.category().trim().toUpperCase(Locale.ROOT);
                    platformCategorySumMap.merge(cat, catSum.totalCo2eKg(), BigDecimal::add);
                }
            }
        }

        Map<String, BigDecimal> platformCategoryAvgMap = new HashMap<>();
        for (Map.Entry<String, BigDecimal> entry : platformCategorySumMap.entrySet()) {
            BigDecimal avg = entry.getValue().divide(
                    BigDecimal.valueOf(cohortSize), 3, RoundingMode.HALF_UP);
            platformCategoryAvgMap.put(entry.getKey(), avg);
        }

        Map<String, BigDecimal> userCategoryMap = new HashMap<>();
        if (userHasActivity) {
            List<CategoryEmissionAggregateDTO> userCatTotals =
                    activityLogRepository.findUserCategoryTotalsBetween(userId, startDate, endDate);
            if (userCatTotals != null) {
                for (CategoryEmissionAggregateDTO uCat : userCatTotals) {
                    if (uCat != null && uCat.category() != null && uCat.totalCo2eKg() != null) {
                        String cat = uCat.category().trim().toUpperCase(Locale.ROOT);
                        userCategoryMap.merge(cat, uCat.totalCo2eKg().setScale(3, RoundingMode.HALF_UP), BigDecimal::add);
                    }
                }
            }
        }

        List<CategoryBenchmarkDTO> categoryBenchmarks = new ArrayList<>();
        for (String cat : STANDARD_CATEGORIES) {
            BigDecimal uVal = userCategoryMap.getOrDefault(cat, BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP));
            BigDecimal pVal = platformCategoryAvgMap.getOrDefault(cat, BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP));
            categoryBenchmarks.add(new CategoryBenchmarkDTO(cat, uVal, pVal));
        }

        // Case 2: User has zero activity in period -> Return community averages, but leave percentile null
        if (!userHasActivity) {
            return new BenchmarkResponseDTO(
                    PERIOD_DAYS,
                    startDate,
                    endDate,
                    cohortSize,
                    BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP),
                    platformAverage,
                    null,
                    "NO_USER_ACTIVITY",
                    "You have not logged any activity in the last 30 days. Record your daily activities to join peer benchmarking.",
                    categoryBenchmarks
            );
        }

        // Case 3: Sufficient cohort & user has activity -> Calculate Eco-Percentile
        // Higher eco-percentile = lower emissions relative to active peers
        long peersEmittingMore = userTotals.stream()
                .filter(u -> u.totalCo2eKg().compareTo(userTotal) > 0)
                .count();

        long peersEmittingEqual = userTotals.stream()
                .filter(u -> u.totalCo2eKg().compareTo(userTotal) == 0)
                .count();

        // Standard midpoint percentile formula: (more + 0.5 * equal) / N * 100
        double percentileRaw = ((peersEmittingMore + (0.5 * peersEmittingEqual)) / (double) cohortSize) * 100.0;
        double ecoPercentile = Math.max(0.0, Math.min(100.0, Math.round(percentileRaw * 10.0) / 10.0));

        String message;
        if (ecoPercentile >= 80.0) {
            message = "Outstanding! Your emissions are in the top " + (Math.round((100.0 - ecoPercentile) * 10.0) / 10.0) + "% cleanest of active members.";
        } else if (ecoPercentile >= 50.0) {
            message = "Great effort! You are greener than " + ecoPercentile + "% of active members.";
        } else {
            message = "Your emissions are higher than " + (Math.round((100.0 - ecoPercentile) * 10.0) / 10.0) + "% of active members. Review recommendations to reduce your footprint.";
        }

        return new BenchmarkResponseDTO(
                PERIOD_DAYS,
                startDate,
                endDate,
                cohortSize,
                userTotal,
                platformAverage,
                ecoPercentile,
                "SUFFICIENT_DATA",
                message,
                categoryBenchmarks
        );
    }
}
