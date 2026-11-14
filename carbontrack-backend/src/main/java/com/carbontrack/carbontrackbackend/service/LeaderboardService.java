
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.leaderboard.*;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.entity.UserBadge;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.UserBadgeRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.YearMonth;
import java.util.*;

@Service
public class LeaderboardService {

    private static final int MAX_LEADERBOARD_SIZE = 50;

    private static final List<String> CATEGORIES =
            List.of("TRANSPORT", "ELECTRICITY", "FOOD", "SHOPPING");

    private final ActivityLogRepository activityLogRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;

    public LeaderboardService(
            ActivityLogRepository activityLogRepository,
            UserBadgeRepository userBadgeRepository,
            UserRepository userRepository) {

        this.activityLogRepository = activityLogRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public LeaderboardResponseDTO getLeaderboard(
            String authenticatedName,
            LeaderboardPeriod period) {
        return getLeaderboard(authenticatedName, period, "OVERALL");
    }

    @Transactional(readOnly = true)
    public LeaderboardResponseDTO getLeaderboard(
            String authenticatedName,
            LeaderboardPeriod period,
            String scope) {

        User currentUser = userRepository.findByEmail(authenticatedName)
                .or(() -> userRepository.findByUsername(authenticatedName))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user was not found"
                ));

        boolean isOrgScope = "ORGANISATION".equalsIgnoreCase(scope) || "ORG".equalsIgnoreCase(scope);
        Long orgId = null;

        if (isOrgScope) {
            if (currentUser.getOrganisation() == null) {
                LocalDate today = LocalDate.now();
                LocalDate startDate = resolveStartDate(period, today);
                LocalDate periodEndDate = resolvePeriodEndDate(period, today, startDate);
                return new LeaderboardResponseDTO(
                        period,
                        periodDays(period, startDate, periodEndDate),
                        startDate,
                        periodEndDate,
                        0,
                        null,
                        BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP),
                        false,
                        List.of()
                );
            }
            orgId = currentUser.getOrganisation().getId();
        }

        return buildLeaderboard(currentUser.getId(), period, LocalDate.now(), orgId);
    }

    @Transactional(readOnly = true)
    public LeaderboardResponseDTO buildLeaderboard(
            Long currentUserId,
            LeaderboardPeriod period) {
        return buildLeaderboard(currentUserId, period, LocalDate.now(), null);
    }

    @Transactional(readOnly = true)
    public LeaderboardResponseDTO buildLeaderboard(
            Long currentUserId,
            LeaderboardPeriod period,
            LocalDate asOfDate) {
        return buildLeaderboard(currentUserId, period, asOfDate, null);
    }

    @Transactional(readOnly = true)
    public LeaderboardResponseDTO buildLeaderboard(
            Long currentUserId,
            LeaderboardPeriod period,
            LocalDate asOfDate,
            Long orgId) {

        LocalDate today = asOfDate != null ? asOfDate : LocalDate.now();

        // Calculate reporting-period start date.
        LocalDate startDate = resolveStartDate(period, today);

        // Calculate the complete reporting-period end date.
        LocalDate periodEndDate = resolvePeriodEndDate(period, today, startDate);

        // Do not include future activity in the leaderboard.
        LocalDate queryEndDate = today.isBefore(periodEndDate) ? today : periodEndDate;

        // Fetch participant emissions.
        List<LeaderboardUserAggregateDTO> allTotals = new ArrayList<>(
                orgId != null
                        ? activityLogRepository.findLeaderboardTotalsByOrganisationBetween(orgId, startDate, queryEndDate)
                        : activityLogRepository.findLeaderboardTotalsBetween(startDate, queryEndDate)
        );

        // Sort by emissions, then username for deterministic ranking.
        allTotals.sort(
                Comparator
                        .comparing((LeaderboardUserAggregateDTO u) -> scale(u.totalCo2eKg()))
                        .thenComparing(
                                LeaderboardUserAggregateDTO::username,
                                String.CASE_INSENSITIVE_ORDER
                        )
        );

        int totalParticipants = allTotals.size();

        int myIndex = -1;

        for (int i = 0; i < allTotals.size(); i++) {
            if (Objects.equals(
                    allTotals.get(i).userId(),
                    currentUserId)) {

                myIndex = i;
                break;
            }
        }

        Integer myRank = myIndex >= 0 ? myIndex + 1 : null;

        BigDecimal myEmissions = myIndex >= 0
                ? scale(allTotals.get(myIndex).totalCo2eKg())
                : BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP);

        boolean isTopThree = myRank != null && myRank <= 3;

        // Keep only the top 50 leaderboard entries.
        List<LeaderboardUserAggregateDTO> topEntries =
                allTotals.stream()
                        .limit(MAX_LEADERBOARD_SIZE)
                        .toList();

        // Return an empty leaderboard when there are no participants.
        if (topEntries.isEmpty()) {
            return new LeaderboardResponseDTO(
                    period,
                    periodDays(period, startDate, periodEndDate),
                    startDate,
                    periodEndDate,
                    totalParticipants,
                    myRank,
                    myEmissions,
                    isTopThree,
                    List.of()
            );
        }

        // Fetch category totals for all active participants.
        List<Long> activeUserIds = allTotals.stream()
                .map(LeaderboardUserAggregateDTO::userId)
                .toList();

        List<Long> topUserIds = topEntries.stream()
                .map(LeaderboardUserAggregateDTO::userId)
                .toList();

        List<LeaderboardCategoryAggregateDTO> categoryRows =
                activityLogRepository.findLeaderboardCategoryTotalsBetween(
                        activeUserIds,
                        startDate,
                        queryEndDate
                );

        Map<Long, Map<String, BigDecimal>> categoryByUser =
                new HashMap<>();

        Map<String, BigDecimal> categoryCommunityTotals =
                new HashMap<>();

        for (String category : CATEGORIES) {
            categoryCommunityTotals.put(category, BigDecimal.ZERO);
        }

        for (LeaderboardCategoryAggregateDTO row : categoryRows) {

            String category = normalizeCategory(row.category());

            BigDecimal amount = scale(row.totalCo2eKg());

            categoryByUser
                    .computeIfAbsent(
                            row.userId(),
                            ignored -> new HashMap<>()
                    )
                    .put(category, amount);

            categoryCommunityTotals.merge(
                    category,
                    amount,
                    BigDecimal::add
            );
        }

        // Fetch activity breakdown for top participants to generate actionable habit tips.
        List<LeaderboardActivityAggregateDTO> activityRows =
                activityLogRepository.findLeaderboardActivityTotalsBetween(
                        topUserIds,
                        startDate,
                        queryEndDate
                );

        Map<Long, List<LeaderboardActivityAggregateDTO>> activitiesByUser =
                new HashMap<>();

        for (LeaderboardActivityAggregateDTO row : activityRows) {
            activitiesByUser
                    .computeIfAbsent(
                            row.userId(),
                            ignored -> new ArrayList<>()
                    )
                    .add(row);
        }

        // Fetch existing badges for top leaderboard participants.
        Map<Long, List<LeaderboardBadgeDTO>> badgesByUser =
                new HashMap<>();

        for (UserBadge userBadge :
                userBadgeRepository.findByUserIdsWithBadge(topUserIds)) {

            badgesByUser
                    .computeIfAbsent(
                            userBadge.getUser().getId(),
                            ignored -> new ArrayList<>()
                    )
                    .add(
                            new LeaderboardBadgeDTO(
                                     userBadge.getBadge().getId(),
                                    userBadge.getBadge().getName(),
                                    userBadge.getBadge().getDescription(),
                                    userBadge.getBadge().getIconUrl(),
                                    userBadge.getAwardedAt()
                            )
                    );
        }

        // Build leaderboard entries.
        List<LeaderboardEntryDTO> leaderboard =
                new ArrayList<>();

        for (int i = 0; i < topEntries.size(); i++) {

            LeaderboardUserAggregateDTO user = topEntries.get(i);

            Map<String, BigDecimal> userCategories =
                    categoryByUser.getOrDefault(
                            user.userId(),
                            Collections.emptyMap()
                    );

            List<CategoryStrengthDTO> strengths =
                    new ArrayList<>();

            for (String category : CATEGORIES) {

                BigDecimal amount = userCategories.getOrDefault(
                        category,
                        BigDecimal.ZERO.setScale(
                                3,
                                RoundingMode.HALF_UP
                        )
                );

                BigDecimal communityAverage =
                        totalParticipants == 0
                                ? BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP)
                                : categoryCommunityTotals
                                        .getOrDefault(
                                                category,
                                                BigDecimal.ZERO
                                        )
                                        .divide(
                                                BigDecimal.valueOf(
                                                        totalParticipants
                                                ),
                                                3,
                                                RoundingMode.HALF_UP
                                        );

                boolean belowAverage =
                        communityAverage.compareTo(BigDecimal.ZERO) > 0
                                && amount.compareTo(communityAverage) < 0;

                strengths.add(
                        new CategoryStrengthDTO(
                                category,
                                amount,
                                belowAverage
                        )
                );
            }

            // Generate actionable tips based on user's actual highest-emission activities
            List<LeaderboardActivityAggregateDTO> userActivities =
                    activitiesByUser.getOrDefault(user.userId(), Collections.emptyList());

            List<String> tips = userActivities.stream()
                    .filter(a -> a.totalCo2eKg() != null && a.totalCo2eKg().compareTo(BigDecimal.ZERO) > 0)
                    .sorted(Comparator
                            .comparing(LeaderboardActivityAggregateDTO::totalCo2eKg, Comparator.reverseOrder())
                            .thenComparing(LeaderboardActivityAggregateDTO::activityType, String.CASE_INSENSITIVE_ORDER)
                    )
                    .map(a -> getHabitTipForActivityType(a.activityType()))
                    .filter(Objects::nonNull)
                    .distinct()
                    .limit(3)
                    .toList();

            leaderboard.add(
                    new LeaderboardEntryDTO(
                            i + 1,
                            user.username(),
                            scale(user.totalCo2eKg()),
                            user.totalActivities(),
                            badgesByUser.getOrDefault(
                                    user.userId(),
                                    List.of()
                            ),
                            strengths,
                            tips
                    )
            );
        }

        // Return leaderboard with complete reporting-period dates.
        return new LeaderboardResponseDTO(
                period,
                periodDays(period, startDate, periodEndDate),
                startDate,
                periodEndDate,
                totalParticipants,
                myRank,
                myEmissions,
                isTopThree,
                leaderboard
        );
    }

    public static String getHabitTipForActivityType(String rawActivityType) {
        if (rawActivityType == null) {
            return null;
        }

        String type = rawActivityType.trim().toUpperCase(Locale.ROOT);

        return switch (type) {
            case "CAR_PETROL", "CAR_DIESEL", "CAR_GASOLINE" ->
                    "Consider public transport or carpooling for suitable trips.";

            case "MOTORCYCLE_PETROL", "MOTORCYCLE", "MOTORBIKE" ->
                    "Combine trips or consider public transport for suitable journeys.";

            case "CAR_ELECTRIC" ->
                    "Charge with renewable energy sources where possible.";

            case "BUS" ->
                    "Combine errands to optimize your public transit trips.";

            case "TRAIN" ->
                    "Plan journeys efficiently and combine local travel.";

            case "FLIGHT", "AIR_TRAVEL" ->
                    "Consider rail or virtual meetings when practical alternatives exist.";

            case "ELECTRICITY", "ELECTRICITY_CONSUMPTION" ->
                    "Switch off unused appliances.";

            case "LPG" ->
                    "Use energy-efficient cooking methods and maintain burners.";

            case "FOOD_BEEF", "BEEF" ->
                    "Replace some beef meals with plant-based alternatives.";

            case "FOOD_NON_VEGETARIAN", "MEAT" ->
                    "Try introducing plant-based days into your meal planning.";

            case "FOOD_VEGETARIAN" ->
                    "Choose seasonal and locally sourced ingredients when practical.";

            case "CLOTHING" ->
                    "Consider reusing or buying second-hand clothing.";

            case "ELECTRONICS" ->
                    "Repair devices before replacing them.";

            case "WASTE" ->
                    "Reduce waste and reuse recyclable materials.";

            // Low-emission activities: avoid recommending users reduce activities that are already low-emission
            case "BICYCLE", "WALKING", "WALKING_RUNNING" -> null;

            default -> null;
        };
    }

    private LocalDate resolveStartDate(LeaderboardPeriod period, LocalDate today) {
        return switch (period) {
            case DAILY -> today;
            case WEEKLY -> today.with(DayOfWeek.MONDAY);
            case MONTHLY -> YearMonth.from(today).atDay(1);
        };
    }

    private LocalDate resolvePeriodEndDate(LeaderboardPeriod period, LocalDate today, LocalDate startDate) {
        return switch (period) {
            case DAILY -> today;
            case WEEKLY -> startDate.plusDays(6);
            case MONTHLY -> YearMonth.from(today).atEndOfMonth();
        };
    }

    private static Integer periodDays(
            LeaderboardPeriod period,
            LocalDate startDate,
            LocalDate endDate) {

        return switch (period) {
            case DAILY -> 1;
            case WEEKLY -> 7;
            case MONTHLY ->
                    (int) (endDate.toEpochDay()
                            - startDate.toEpochDay() + 1);
        };
    }

    private static BigDecimal scale(BigDecimal value) {

        return (value == null ? BigDecimal.ZERO : value)
                .setScale(3, RoundingMode.HALF_UP);
    }

    private static String normalizeCategory(String category) {

        if (category == null) {
            return "";
        }

        return category.trim().toUpperCase(Locale.ROOT);
    }
}
