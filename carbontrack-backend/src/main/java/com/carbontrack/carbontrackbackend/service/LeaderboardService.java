
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.leaderboard.*;
import com.carbontrack.carbontrackbackend.entity.UserBadge;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.UserBadgeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    private static final int PERIOD_DAYS = 30;
    private static final int MAX_LEADERBOARD_SIZE = 50;

    private static final List<String> CATEGORIES = List.of(
            "TRANSPORT",
            "ELECTRICITY",
            "FOOD",
            "SHOPPING"
    );

    private final ActivityLogRepository activityLogRepository;
    private final UserBadgeRepository userBadgeRepository;

    public LeaderboardService(
            ActivityLogRepository activityLogRepository,
            UserBadgeRepository userBadgeRepository) {

        this.activityLogRepository = activityLogRepository;
        this.userBadgeRepository = userBadgeRepository;
    }

    @Transactional(readOnly = true)
    public LeaderboardResponseDTO getLeaderboard() {

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(PERIOD_DAYS - 1);

        // 1. Fetch all active users and their total emissions
        List<LeaderboardUserAggregateDTO> allUsers =
                activityLogRepository.findLeaderboardTotals(
                        startDate, endDate);

        if (allUsers == null || allUsers.isEmpty()) {
            return new LeaderboardResponseDTO(
                    PERIOD_DAYS,
                    startDate,
                    endDate,
                    0,
                    Collections.emptyList()
            );
        }

        // 2. Sort users by lowest emissions
        List<LeaderboardUserAggregateDTO> sortedUsers =
                allUsers.stream()
                        .sorted(
                                Comparator.comparing(
                                                LeaderboardUserAggregateDTO::totalCo2eKg)
                                        .thenComparing(
                                                LeaderboardUserAggregateDTO::username)
                        )
                        .toList();

        int totalParticipants = sortedUsers.size();

        // 3. Select top 50 users
        List<LeaderboardUserAggregateDTO> topUsers =
                sortedUsers.stream()
                        .limit(MAX_LEADERBOARD_SIZE)
                        .toList();

        List<Long> allUserIds = sortedUsers.stream()
                .map(LeaderboardUserAggregateDTO::userId)
                .toList();

        List<Long> topUserIds = topUsers.stream()
                .map(LeaderboardUserAggregateDTO::userId)
                .toList();

        // 4. Fetch category totals for the complete active cohort
        List<LeaderboardCategoryAggregateDTO> categoryTotals =
                activityLogRepository.findLeaderboardCategoryTotals(
                        allUserIds, startDate, endDate);

        // 5. Calculate category averages
        Map<String, BigDecimal> categorySums = new HashMap<>();

        Map<Long, Map<String, BigDecimal>> userCategories =
                new HashMap<>();

        for (LeaderboardCategoryAggregateDTO category : categoryTotals) {

            String name = category.category()
                    .trim().toUpperCase(Locale.ROOT);

            categorySums.merge(
                    name,
                    category.totalCo2eKg(),
                    BigDecimal::add
            );

            userCategories
                    .computeIfAbsent(
                            category.userId(),
                            id -> new HashMap<>())
                    .put(name, category.totalCo2eKg());
        }

        Map<String, BigDecimal> categoryAverages =
                new HashMap<>();

        for (String category : CATEGORIES) {

            BigDecimal sum = categorySums.getOrDefault(
                    category, BigDecimal.ZERO);

            BigDecimal average = sum.divide(
                    BigDecimal.valueOf(totalParticipants),
                    3,
                    RoundingMode.HALF_UP
            );

            categoryAverages.put(category, average);
        }

        // 6. Fetch badges for top 50 users
        List<UserBadge> earnedBadges =
                userBadgeRepository.findByUserIdsWithBadge(topUserIds);

        Map<Long, List<LeaderboardBadgeDTO>> badgesByUser =
                earnedBadges.stream()
                        .collect(Collectors.groupingBy(
                                badge -> badge.getUser().getId(),
                                Collectors.mapping(
                                        badge -> new LeaderboardBadgeDTO(
                                                badge.getBadge().getId(),
                                                badge.getBadge().getName(),
                                                badge.getBadge().getDescription(),
                                                badge.getBadge().getIconUrl(),
                                                badge.getAwardedAt()
                                        ),
                                        Collectors.toList()
                                )
                        ));

        // 7. Build leaderboard response
        List<LeaderboardEntryDTO> entries =
                new ArrayList<>();

        for (int i = 0; i < topUsers.size(); i++) {

            LeaderboardUserAggregateDTO user = topUsers.get(i);

            List<CategoryStrengthDTO> strengths =
                    new ArrayList<>();

            List<String> habitTips =
                    new ArrayList<>();

            Map<String, BigDecimal> userCategoryMap =
                    userCategories.getOrDefault(
                            user.userId(), Collections.emptyMap());

            for (String category : CATEGORIES) {

                BigDecimal userTotal = userCategoryMap.getOrDefault(
                        category, BigDecimal.ZERO);

                BigDecimal communityAverage =
                        categoryAverages.get(category);

                boolean belowAverage =
                        userTotal.compareTo(BigDecimal.ZERO) > 0
                        && userTotal.compareTo(communityAverage) < 0;

                strengths.add(new CategoryStrengthDTO(
                        category,
                        userTotal.setScale(3, RoundingMode.HALF_UP),
                        belowAverage
                ));

                if (belowAverage) {
                    habitTips.add(
                            "Recorded below-average emissions in "
                                    + category.toLowerCase(Locale.ROOT)
                                    + " during the last 30 days."
                    );
                }
            }

            entries.add(new LeaderboardEntryDTO(
                    i + 1,
                    user.username(),
                    user.totalCo2eKg().setScale(
                            3, RoundingMode.HALF_UP),
                    user.totalActivities(),
                    badgesByUser.getOrDefault(
                            user.userId(), Collections.emptyList()),
                    strengths,
                    habitTips
            ));
        }

        return new LeaderboardResponseDTO(
                PERIOD_DAYS,
                startDate,
                endDate,
                totalParticipants,
                entries
        );
    }
}
