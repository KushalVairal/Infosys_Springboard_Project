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
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

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
    public LeaderboardResponseDTO getLeaderboard(String authenticatedName, LeaderboardPeriod period) {
        User currentUser = userRepository.findByEmail(authenticatedName)
                .or(() -> userRepository.findByUsername(authenticatedName))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Authenticated user was not found"));

        return buildLeaderboard(currentUser.getId(), period);
    }

    @Transactional(readOnly = true)
    public LeaderboardResponseDTO buildLeaderboard(Long currentUserId, LeaderboardPeriod period) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = switch (period) {
            case DAILY -> today;
            case MONTHLY -> YearMonth.from(today).atDay(1);
            case ALL_TIME -> null;
        };

        List<LeaderboardUserAggregateDTO> allTotals = new ArrayList<>(
                period == LeaderboardPeriod.ALL_TIME
                        ? activityLogRepository.findLeaderboardTotalsAllTime()
                        : activityLogRepository.findLeaderboardTotalsBetween(startDate, today));

        // Ensure deterministic tie ordering even if the database collation differs.
        allTotals.sort(Comparator
                .comparing(LeaderboardUserAggregateDTO::totalCo2eKg)
                .thenComparing(LeaderboardUserAggregateDTO::username, String.CASE_INSENSITIVE_ORDER));

        int totalParticipants = allTotals.size();
        int myIndex = -1;
        for (int i = 0; i < allTotals.size(); i++) {
            if (Objects.equals(allTotals.get(i).userId(), currentUserId)) {
                myIndex = i;
                break;
            }
        }

        Integer myRank = myIndex >= 0 ? myIndex + 1 : null;
        BigDecimal myEmissions = myIndex >= 0
                ? scale(allTotals.get(myIndex).totalCo2eKg())
                : BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP);
        boolean isTopThree = myRank != null && myRank <= 3;

        List<LeaderboardUserAggregateDTO> topEntries =
                allTotals.stream().limit(MAX_LEADERBOARD_SIZE).toList();

        if (topEntries.isEmpty()) {
            return new LeaderboardResponseDTO(
                    period, periodDays(period, startDate, today), startDate, today,
                    totalParticipants, myRank, myEmissions, isTopThree, List.of());
        }

        // Fetch category totals for every active participant so community averages
        // are not biased toward only the first 50 ranked users.
        List<Long> activeUserIds = allTotals.stream()
                .map(LeaderboardUserAggregateDTO::userId)
                .toList();
        List<Long> topUserIds = topEntries.stream()
                .map(LeaderboardUserAggregateDTO::userId)
                .toList();

        List<LeaderboardCategoryAggregateDTO> categoryRows =
                period == LeaderboardPeriod.ALL_TIME
                        ? activityLogRepository.findLeaderboardCategoryTotalsAllTime(activeUserIds)
                        : activityLogRepository.findLeaderboardCategoryTotalsBetween(activeUserIds, startDate, today);

        Map<Long, Map<String, BigDecimal>> categoryByUser = new HashMap<>();
        Map<String, BigDecimal> categoryCommunityTotals = new HashMap<>();
        for (String category : CATEGORIES) {
            categoryCommunityTotals.put(category, BigDecimal.ZERO);
        }

        for (LeaderboardCategoryAggregateDTO row : categoryRows) {
            String category = normalizeCategory(row.category());
            BigDecimal amount = scale(row.totalCo2eKg());
            categoryByUser.computeIfAbsent(row.userId(), ignored -> new HashMap<>())
                    .put(category, amount);
            categoryCommunityTotals.merge(category, amount, BigDecimal::add);
        }

        Map<Long, List<LeaderboardBadgeDTO>> badgesByUser = new HashMap<>();
        for (UserBadge userBadge : userBadgeRepository.findByUserIdsWithBadge(topUserIds)) {
            badgesByUser.computeIfAbsent(userBadge.getUser().getId(), ignored -> new ArrayList<>())
                    .add(new LeaderboardBadgeDTO(
                            userBadge.getBadge().getId(),
                            userBadge.getBadge().getName(),
                            userBadge.getBadge().getDescription(),
                            userBadge.getBadge().getIconUrl(),
                            userBadge.getAwardedAt()));
        }

        List<LeaderboardEntryDTO> leaderboard = new ArrayList<>();
        for (int i = 0; i < topEntries.size(); i++) {
            LeaderboardUserAggregateDTO user = topEntries.get(i);
            Map<String, BigDecimal> userCategories =
                    categoryByUser.getOrDefault(user.userId(), Collections.emptyMap());

            List<CategoryStrengthDTO> strengths = new ArrayList<>();
            for (String category : CATEGORIES) {
                BigDecimal amount = userCategories.getOrDefault(
                        category, BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP));
                BigDecimal communityAverage = totalParticipants == 0
                        ? BigDecimal.ZERO
                        : categoryCommunityTotals.getOrDefault(category, BigDecimal.ZERO)
                            .divide(BigDecimal.valueOf(totalParticipants), 3, RoundingMode.HALF_UP);
                boolean belowAverage = amount.compareTo(BigDecimal.ZERO) > 0
                        && amount.compareTo(communityAverage) < 0;
                strengths.add(new CategoryStrengthDTO(category, amount, belowAverage));
            }

            List<String> tips = strengths.stream()
                    .filter(CategoryStrengthDTO::belowCommunityAverage)
                    .map(item -> "Recorded below-average emissions in "
                            + item.category().toLowerCase(Locale.ROOT)
                            + " during this reporting period.")
                    .toList();

            leaderboard.add(new LeaderboardEntryDTO(
                    i + 1,
                    user.username(),
                    scale(user.totalCo2eKg()),
                    user.totalActivities(),
                    badgesByUser.getOrDefault(user.userId(), List.of()),
                    strengths,
                    tips));
        }

        return new LeaderboardResponseDTO(
                period, periodDays(period, startDate, today), startDate, today,
                totalParticipants, myRank, myEmissions, isTopThree, leaderboard);
    }

    private static Integer periodDays(LeaderboardPeriod period, LocalDate startDate, LocalDate endDate) {
        return switch (period) {
            case DAILY -> 1;
            case MONTHLY -> (int) (endDate.toEpochDay() - startDate.toEpochDay() + 1);
            case ALL_TIME -> null;
        };
    }

    private static BigDecimal scale(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value)
                .setScale(3, RoundingMode.HALF_UP);
    }

    private static String normalizeCategory(String category) {
        if (category == null) return "";
        return category.trim().toUpperCase(Locale.ROOT);
    }
}
