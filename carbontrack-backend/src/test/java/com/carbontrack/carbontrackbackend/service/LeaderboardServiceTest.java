package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.leaderboard.*;
import com.carbontrack.carbontrackbackend.entity.Badge;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.entity.UserBadge;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.UserBadgeRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private UserBadgeRepository userBadgeRepository;

    @Mock
    private UserRepository userRepository;

    private LeaderboardService leaderboardService;
    private User testUser;

    @BeforeEach
    void setUp() {
        leaderboardService = new LeaderboardService(
                activityLogRepository,
                userBadgeRepository,
                userRepository
        );

        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 1L);
        testUser.setEmail("green_leader@example.com");
        testUser.setUsername("EcoWarrior");
    }

    @Test
    @DisplayName("Activity-based habit tips map correctly and exclude low-emission activities")
    void shouldReturnCorrectHabitTipsForActivityTypes() {
        // High-emission or actionable activities
        assertEquals("Consider public transport or carpooling for suitable trips.",
                LeaderboardService.getHabitTipForActivityType("CAR_PETROL"));
        assertEquals("Combine trips or consider public transport for suitable journeys.",
                LeaderboardService.getHabitTipForActivityType("MOTORCYCLE_PETROL"));
        assertEquals("Charge with renewable energy sources where possible.",
                LeaderboardService.getHabitTipForActivityType("CAR_ELECTRIC"));
        assertEquals("Combine errands to optimize your public transit trips.",
                LeaderboardService.getHabitTipForActivityType("BUS"));
        assertEquals("Plan journeys efficiently and combine local travel.",
                LeaderboardService.getHabitTipForActivityType("TRAIN"));
        assertEquals("Consider rail or virtual meetings when practical alternatives exist.",
                LeaderboardService.getHabitTipForActivityType("FLIGHT"));
        assertEquals("Switch off unused appliances.",
                LeaderboardService.getHabitTipForActivityType("ELECTRICITY"));
        assertEquals("Use energy-efficient cooking methods and maintain burners.",
                LeaderboardService.getHabitTipForActivityType("LPG"));
        assertEquals("Replace some beef meals with plant-based alternatives.",
                LeaderboardService.getHabitTipForActivityType("FOOD_BEEF"));
        assertEquals("Try introducing plant-based days into your meal planning.",
                LeaderboardService.getHabitTipForActivityType("FOOD_NON_VEGETARIAN"));
        assertEquals("Choose seasonal and locally sourced ingredients when practical.",
                LeaderboardService.getHabitTipForActivityType("FOOD_VEGETARIAN"));
        assertEquals("Consider reusing or buying second-hand clothing.",
                LeaderboardService.getHabitTipForActivityType("CLOTHING"));
        assertEquals("Repair devices before replacing them.",
                LeaderboardService.getHabitTipForActivityType("ELECTRONICS"));
        assertEquals("Reduce waste and reuse recyclable materials.",
                LeaderboardService.getHabitTipForActivityType("WASTE"));

        // Low emission activities must return null (avoid recommending users reduce low-emission activities)
        assertNull(LeaderboardService.getHabitTipForActivityType("BICYCLE"));
        assertNull(LeaderboardService.getHabitTipForActivityType("WALKING"));
        assertNull(LeaderboardService.getHabitTipForActivityType("UNKNOWN_TYPE"));
        assertNull(LeaderboardService.getHabitTipForActivityType(null));
    }

    @Test
    @DisplayName("Leaderboard generates at most 3 tips prioritized by highest emissions and ignores zero/low-emission")
    void shouldGenerateTopThreeTipsPrioritizedByEmissions() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 12);

        List<LeaderboardUserAggregateDTO> users = List.of(
                new LeaderboardUserAggregateDTO(1L, "EcoWarrior", new BigDecimal("50.000"), 5L)
        );
        when(activityLogRepository.findLeaderboardTotalsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(users);

        when(activityLogRepository.findLeaderboardCategoryTotalsBetween(any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());

        // User logged FLIGHT (100 kg), FOOD_BEEF (30 kg), CAR_PETROL (20 kg), ELECTRICITY (10 kg), BICYCLE (5 kg)
        List<LeaderboardActivityAggregateDTO> activityAggregates = List.of(
                new LeaderboardActivityAggregateDTO(1L, "ELECTRICITY", new BigDecimal("10.000")),
                new LeaderboardActivityAggregateDTO(1L, "BICYCLE", new BigDecimal("5.000")),
                new LeaderboardActivityAggregateDTO(1L, "FOOD_BEEF", new BigDecimal("30.000")),
                new LeaderboardActivityAggregateDTO(1L, "CAR_PETROL", new BigDecimal("20.000")),
                new LeaderboardActivityAggregateDTO(1L, "FLIGHT", new BigDecimal("100.000"))
        );
        when(activityLogRepository.findLeaderboardActivityTotalsBetween(any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(activityAggregates);

        when(userBadgeRepository.findByUserIdsWithBadge(any())).thenReturn(List.of());

        LeaderboardResponseDTO response = leaderboardService.buildLeaderboard(1L, LeaderboardPeriod.WEEKLY, asOfDate);

        assertNotNull(response);
        assertEquals(1, response.leaderboard().size());
        LeaderboardEntryDTO entry = response.leaderboard().get(0);

        // Maximum 3 tips, ordered by highest emission: FLIGHT (100) -> FOOD_BEEF (30) -> CAR_PETROL (20)
        List<String> tips = entry.habitTips();
        assertEquals(3, tips.size());
        assertEquals("Consider rail or virtual meetings when practical alternatives exist.", tips.get(0));
        assertEquals("Replace some beef meals with plant-based alternatives.", tips.get(1));
        assertEquals("Consider public transport or carpooling for suitable trips.", tips.get(2));
        assertFalse(tips.contains("Switch off unused appliances.")); // 4th highest excluded
    }

    @Test
    @DisplayName("Category average calculation accurately compares participants including zero-emission users")
    void shouldCalculateCategoryAveragesAccuratelyWithZeroEmissionParticipants() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 12);

        // 2 participants: User 1 has 10 kg, User 2 has 20 kg
        List<LeaderboardUserAggregateDTO> users = List.of(
                new LeaderboardUserAggregateDTO(1L, "UserOne", new BigDecimal("10.000"), 1L),
                new LeaderboardUserAggregateDTO(2L, "UserTwo", new BigDecimal("20.000"), 2L)
        );
        when(activityLogRepository.findLeaderboardTotalsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(users);

        // User 2 has 20 kg in TRANSPORT. User 1 has 0 kg in TRANSPORT.
        // Community average for TRANSPORT is 20 / 2 = 10 kg.
        when(activityLogRepository.findLeaderboardCategoryTotalsBetween(any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(
                        new LeaderboardCategoryAggregateDTO(2L, "TRANSPORT", new BigDecimal("20.000"))
                ));

        when(activityLogRepository.findLeaderboardActivityTotalsBetween(any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(userBadgeRepository.findByUserIdsWithBadge(any())).thenReturn(List.of());

        LeaderboardResponseDTO response = leaderboardService.buildLeaderboard(1L, LeaderboardPeriod.WEEKLY, asOfDate);

        assertEquals(2, response.leaderboard().size());

        // User 1 (rank 1, 10.000 kg total)
        LeaderboardEntryDTO user1Entry = response.leaderboard().get(0);
        CategoryStrengthDTO transportStrengthUser1 = user1Entry.categoryStrengths().stream()
                .filter(c -> "TRANSPORT".equals(c.category()))
                .findFirst().orElseThrow();
        assertEquals(new BigDecimal("0.000"), transportStrengthUser1.totalCo2eKg());
        // Since community average is 10.000 > 0 and User 1 has 0.000 < 10.000, belowCommunityAverage must be true
        assertTrue(transportStrengthUser1.belowCommunityAverage());

        // User 2 (rank 2, 20.000 kg total)
        LeaderboardEntryDTO user2Entry = response.leaderboard().get(1);
        CategoryStrengthDTO transportStrengthUser2 = user2Entry.categoryStrengths().stream()
                .filter(c -> "TRANSPORT".equals(c.category()))
                .findFirst().orElseThrow();
        assertEquals(new BigDecimal("20.000"), transportStrengthUser2.totalCo2eKg());
        // User 2 has 20.000 >= 10.000 -> belowCommunityAverage must be false
        assertFalse(transportStrengthUser2.belowCommunityAverage());
    }

    @Test
    @DisplayName("Ranking places lowest CO2e at rank 1 and breaks ties deterministically by username")
    void shouldRankLowestEmissionsFirstAndBreakTiesDeterministicallyByUsername() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 12);

        // 3 participants: Charlie and Alice tie at 15.000 kg, Bob has 10.000 kg
        List<LeaderboardUserAggregateDTO> users = List.of(
                new LeaderboardUserAggregateDTO(3L, "Charlie", new BigDecimal("15.000"), 2L),
                new LeaderboardUserAggregateDTO(2L, "Bob", new BigDecimal("10.000"), 1L),
                new LeaderboardUserAggregateDTO(1L, "Alice", new BigDecimal("15.000"), 2L)
        );
        when(activityLogRepository.findLeaderboardTotalsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(users);

        when(activityLogRepository.findLeaderboardCategoryTotalsBetween(any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(activityLogRepository.findLeaderboardActivityTotalsBetween(any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(userBadgeRepository.findByUserIdsWithBadge(any())).thenReturn(List.of());

        // Current user is Alice (id 1)
        LeaderboardResponseDTO response = leaderboardService.buildLeaderboard(1L, LeaderboardPeriod.WEEKLY, asOfDate);

        // Expected order:
        // Rank 1: Bob (10.000)
        // Rank 2: Alice (15.000, alphabetically before Charlie)
        // Rank 3: Charlie (15.000)
        assertEquals(3, response.leaderboard().size());

        assertEquals("Bob", response.leaderboard().get(0).username());
        assertEquals(1, response.leaderboard().get(0).rank());

        assertEquals("Alice", response.leaderboard().get(1).username());
        assertEquals(2, response.leaderboard().get(1).rank());

        assertEquals("Charlie", response.leaderboard().get(2).username());
        assertEquals(3, response.leaderboard().get(2).rank());

        // Alice is current user -> rank 2, emissions 15.000, isTopThree = true
        assertEquals(2, response.myRank());
        assertEquals(new BigDecimal("15.000"), response.myEmissionsKg());
        assertTrue(response.isTopThree());
    }

    @Test
    @DisplayName("Date boundaries for DAILY, WEEKLY, and MONTHLY periods are accurate and exclude future activities")
    void shouldHandleDateBoundariesAndExcludeFutureDates() {
        // Suppose asOfDate is Thursday, Nov 12, 2026
        LocalDate asOfDate = LocalDate.of(2026, 11, 12);

        when(activityLogRepository.findLeaderboardTotalsBetween(any(), any())).thenReturn(List.of());

        // 1. DAILY
        LeaderboardResponseDTO daily = leaderboardService.buildLeaderboard(1L, LeaderboardPeriod.DAILY, asOfDate);
        assertEquals(LocalDate.of(2026, 11, 12), daily.startDate());
        assertEquals(LocalDate.of(2026, 11, 12), daily.endDate());
        assertEquals(1, daily.periodDays());

        // 2. WEEKLY (Monday Nov 9 to Sunday Nov 15)
        LeaderboardResponseDTO weekly = leaderboardService.buildLeaderboard(1L, LeaderboardPeriod.WEEKLY, asOfDate);
        assertEquals(LocalDate.of(2026, 11, 9), weekly.startDate());
        assertEquals(LocalDate.of(2026, 11, 15), weekly.endDate());
        assertEquals(7, weekly.periodDays());

        // 3. MONTHLY (Nov 1 to Nov 30)
        LeaderboardResponseDTO monthly = leaderboardService.buildLeaderboard(1L, LeaderboardPeriod.MONTHLY, asOfDate);
        assertEquals(LocalDate.of(2026, 11, 1), monthly.startDate());
        assertEquals(LocalDate.of(2026, 11, 30), monthly.endDate());
        assertEquals(30, monthly.periodDays());
    }

    @Test
    @DisplayName("Empty leaderboard returns zero counts and empty leaderboard list safely")
    void shouldHandleEmptyLeaderboardGracefully() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 12);

        when(activityLogRepository.findLeaderboardTotalsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        LeaderboardResponseDTO response = leaderboardService.buildLeaderboard(1L, LeaderboardPeriod.DAILY, asOfDate);

        assertNotNull(response);
        assertEquals(0, response.totalParticipants());
        assertNull(response.myRank());
        assertEquals(new BigDecimal("0.000"), response.myEmissionsKg());
        assertFalse(response.isTopThree());
        assertTrue(response.leaderboard().isEmpty());
    }

    @Test
    @DisplayName("Returns only top 50 participants while total count includes all eligible participants")
    void shouldLimitLeaderboardToFiftyParticipantsAndRetainPersonalRank() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 12);

        List<LeaderboardUserAggregateDTO> users = new ArrayList<>();
        for (int i = 1; i <= 60; i++) {
            users.add(new LeaderboardUserAggregateDTO(
                    (long) i,
                    "User_" + String.format("%02d", i),
                    BigDecimal.valueOf(i).setScale(3),
                    (long) i
            ));
        }

        when(activityLogRepository.findLeaderboardTotalsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(users);
        when(activityLogRepository.findLeaderboardCategoryTotalsBetween(any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(activityLogRepository.findLeaderboardActivityTotalsBetween(any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(userBadgeRepository.findByUserIdsWithBadge(any())).thenReturn(List.of());

        // User 55 is tested (outside top 50)
        LeaderboardResponseDTO response = leaderboardService.buildLeaderboard(55L, LeaderboardPeriod.WEEKLY, asOfDate);

        assertNotNull(response);
        assertEquals(60, response.totalParticipants());
        assertEquals(50, response.leaderboard().size());
        assertEquals(55, response.myRank());
        assertEquals(new BigDecimal("55.000"), response.myEmissionsKg());
        assertFalse(response.isTopThree());
    }

    @Test
    @DisplayName("Privacy check: Leaderboard response exposes public username only, never email or user ID")
    void shouldPreservePrivacyWithoutExposingEmailOrUserId() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 12);

        List<LeaderboardUserAggregateDTO> users = List.of(
                new LeaderboardUserAggregateDTO(999L, "PublicHero", new BigDecimal("12.500"), 3L)
        );
        when(activityLogRepository.findLeaderboardTotalsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(users);
        when(activityLogRepository.findLeaderboardCategoryTotalsBetween(any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(activityLogRepository.findLeaderboardActivityTotalsBetween(any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());

        Badge badge = new Badge();
        ReflectionTestUtils.setField(badge, "id", 10L);
        badge.setName("Eco Master");
        badge.setDescription("Master badge");
        badge.setIconUrl("badge.png");

        User user = new User();
        ReflectionTestUtils.setField(user, "id", 999L);
        user.setEmail("confidential@example.com");
        user.setUsername("PublicHero");

        UserBadge ub = new UserBadge();
        ub.setUser(user);
        ub.setBadge(badge);
        ReflectionTestUtils.setField(ub, "awardedAt", LocalDateTime.now());

        when(userBadgeRepository.findByUserIdsWithBadge(any())).thenReturn(List.of(ub));

        LeaderboardResponseDTO response = leaderboardService.buildLeaderboard(999L, LeaderboardPeriod.WEEKLY, asOfDate);

        LeaderboardEntryDTO entry = response.leaderboard().get(0);
        assertEquals("PublicHero", entry.username());
        assertEquals(1, entry.rank());
        assertEquals(new BigDecimal("12.500"), entry.totalCo2eKg());

        // Verify that entry only contains public fields
        assertNotNull(entry.badges());
        assertEquals(1, entry.badges().size());
        assertEquals("Eco Master", entry.badges().get(0).name());

        // The DTO itself does not have getUserId() or getEmail() methods or fields
        assertFalse(entry.toString().contains("confidential@example.com"));
        assertFalse(entry.toString().contains("999"));

        // Verify DTO structural privacy
        for (var field : LeaderboardEntryDTO.class.getDeclaredFields()) {
            assertNotEquals("email", field.getName().toLowerCase());
            assertNotEquals("userid", field.getName().toLowerCase());
        }
        for (var field : LeaderboardResponseDTO.class.getDeclaredFields()) {
            assertNotEquals("email", field.getName().toLowerCase());
            assertNotEquals("userid", field.getName().toLowerCase());
        }
    }

    @Test
    @DisplayName("getLeaderboard resolves user by email or username")
    void shouldResolveUserInGetLeaderboard() {
        when(userRepository.findByEmail("green_leader@example.com")).thenReturn(Optional.of(testUser));
        when(activityLogRepository.findLeaderboardTotalsBetween(any(), any())).thenReturn(List.of());

        LeaderboardResponseDTO response = leaderboardService.getLeaderboard("green_leader@example.com", LeaderboardPeriod.DAILY);
        assertNotNull(response);
    }

    @Test
    @DisplayName("getLeaderboard with ORGANISATION scope returns empty if user has no organisation")
    void shouldReturnEmptyLeaderboardForUserWithoutOrganisation() {
        when(userRepository.findByEmail("green_leader@example.com")).thenReturn(Optional.of(testUser));
        testUser.setOrganisation(null);

        LeaderboardResponseDTO response = leaderboardService.getLeaderboard("green_leader@example.com", LeaderboardPeriod.MONTHLY, "ORGANISATION");

        assertNotNull(response);
        assertEquals(0, response.totalParticipants());
        assertTrue(response.leaderboard().isEmpty());
    }

    @Test
    @DisplayName("getLeaderboard with ORGANISATION scope queries organisation totals")
    void shouldQueryOrganisationTotalsWhenScopeIsOrganisation() {
        com.carbontrack.carbontrackbackend.entity.Organisation org = new com.carbontrack.carbontrackbackend.entity.Organisation();
        ReflectionTestUtils.setField(org, "id", 42L);
        org.setName("CleanTech");
        testUser.setOrganisation(org);

        when(userRepository.findByEmail("green_leader@example.com")).thenReturn(Optional.of(testUser));
        when(activityLogRepository.findLeaderboardTotalsByOrganisationBetween(eq(42L), any(), any()))
                .thenReturn(List.of(new LeaderboardUserAggregateDTO(1L, "EcoWarrior", new BigDecimal("10.000"), 3L)));

        when(activityLogRepository.findLeaderboardCategoryTotalsBetween(any(), any(), any())).thenReturn(List.of());
        when(activityLogRepository.findLeaderboardActivityTotalsBetween(any(), any(), any())).thenReturn(List.of());
        when(userBadgeRepository.findByUserIdsWithBadge(any())).thenReturn(List.of());

        LeaderboardResponseDTO response = leaderboardService.getLeaderboard("green_leader@example.com", LeaderboardPeriod.MONTHLY, "ORGANISATION");

        assertNotNull(response);
        assertEquals(1, response.totalParticipants());
        assertEquals("EcoWarrior", response.leaderboard().get(0).username());
    }
}
