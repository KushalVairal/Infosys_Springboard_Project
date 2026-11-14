package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.achievement.AchievementResponseDTO;
import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardPeriod;
import com.carbontrack.carbontrackbackend.dto.leaderboard.LeaderboardResponseDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.entity.UserAchievement;
import com.carbontrack.carbontrackbackend.repository.UserAchievementRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    @Mock
    private UserAchievementRepository achievementRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LeaderboardService leaderboardService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AchievementService achievementService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 42L);
        testUser.setEmail("player@carbontrack.com");
        testUser.setUsername("player_one");
    }

    @Test
    @DisplayName("claimAchievement awards SILVER_LEAF when rank is #2 on ORGANISATION leaderboard")
    void shouldAwardSilverLeafForRank2InOrganisationScope() {
        when(userRepository.findByEmail("player@carbontrack.com")).thenReturn(Optional.of(testUser));

        LocalDate startDate = LocalDate.of(2026, 11, 9);
        LocalDate endDate = LocalDate.of(2026, 11, 15);

        LeaderboardResponseDTO orgLeaderboard = new LeaderboardResponseDTO(
                LeaderboardPeriod.WEEKLY,
                7,
                startDate,
                endDate,
                10,
                2,                                 // Rank 2!
                new BigDecimal("45.500"),
                true,
                Collections.emptyList()
        );

        when(leaderboardService.getLeaderboard("player@carbontrack.com", LeaderboardPeriod.WEEKLY, "ORGANISATION"))
                .thenReturn(orgLeaderboard);

        when(achievementRepository.existsByUserIdAndLeaderboardPeriodAndPeriodStartDateAndScope(
                42L, "WEEKLY", startDate, "ORGANISATION"
        )).thenReturn(false);

        when(achievementRepository.save(any(UserAchievement.class))).thenAnswer(invocation -> {
            UserAchievement a = invocation.getArgument(0);
            ReflectionTestUtils.setField(a, "id", 999L);
            ReflectionTestUtils.setField(a, "claimedAt", LocalDateTime.now());
            return a;
        });

        AchievementResponseDTO result = achievementService.claimAchievement(
                "player@carbontrack.com",
                LeaderboardPeriod.WEEKLY,
                "ORGANISATION"
        );

        assertNotNull(result);
        assertEquals("SILVER_LEAF", result.achievementType());
        assertEquals("WEEKLY", result.leaderboardPeriod());
        assertEquals("ORGANISATION", result.scope());
        assertEquals(2, result.rankAtClaim());
        assertEquals(new BigDecimal("45.500"), result.emissionsKgAtClaim());

        verify(notificationService).createNotification(
                eq(testUser),
                eq("ACHIEVEMENT_UNLOCKED"),
                eq("Achievement Unlocked: Silver Leaf"),
                contains("Organisation Leaderboard (Rank #2)"),
                eq(999L)
        );
    }

    @Test
    @DisplayName("claimAchievement awards GOLD_LEAF for rank #1 on OVERALL leaderboard")
    void shouldAwardGoldLeafForRank1InOverallScope() {
        when(userRepository.findByEmail("player@carbontrack.com")).thenReturn(Optional.of(testUser));

        LocalDate startDate = LocalDate.of(2026, 11, 1);
        LocalDate endDate = LocalDate.of(2026, 11, 30);

        LeaderboardResponseDTO overallLeaderboard = new LeaderboardResponseDTO(
                LeaderboardPeriod.MONTHLY,
                30,
                startDate,
                endDate,
                20,
                1,                                 // Rank 1!
                new BigDecimal("120.000"),
                true,
                Collections.emptyList()
        );

        when(leaderboardService.getLeaderboard("player@carbontrack.com", LeaderboardPeriod.MONTHLY, "OVERALL"))
                .thenReturn(overallLeaderboard);

        when(achievementRepository.existsByUserIdAndLeaderboardPeriodAndPeriodStartDateAndScope(
                42L, "MONTHLY", startDate, "OVERALL"
        )).thenReturn(false);

        when(achievementRepository.save(any(UserAchievement.class))).thenAnswer(invocation -> {
            UserAchievement a = invocation.getArgument(0);
            ReflectionTestUtils.setField(a, "id", 888L);
            ReflectionTestUtils.setField(a, "claimedAt", LocalDateTime.now());
            return a;
        });

        AchievementResponseDTO result = achievementService.claimAchievement(
                "player@carbontrack.com",
                LeaderboardPeriod.MONTHLY,
                "OVERALL"
        );

        assertNotNull(result);
        assertEquals("GOLD_LEAF", result.achievementType());
        assertEquals(1, result.rankAtClaim());
        assertEquals("OVERALL", result.scope());

        verify(notificationService).createNotification(
                eq(testUser),
                eq("ACHIEVEMENT_UNLOCKED"),
                eq("Achievement Unlocked: Gold Leaf"),
                contains("Community Leaderboard (Rank #1)"),
                eq(888L)
        );
    }

    @Test
    @DisplayName("claimAchievement throws FORBIDDEN when user rank is 4 or worse")
    void shouldRejectClaimWhenRankIsNotInTop3() {
        when(userRepository.findByEmail("player@carbontrack.com")).thenReturn(Optional.of(testUser));

        LocalDate startDate = LocalDate.of(2026, 11, 9);
        LocalDate endDate = LocalDate.of(2026, 11, 15);

        LeaderboardResponseDTO orgLeaderboard = new LeaderboardResponseDTO(
                LeaderboardPeriod.WEEKLY,
                7,
                startDate,
                endDate,
                10,
                4,                                 // Rank 4
                new BigDecimal("210.000"),
                false,
                Collections.emptyList()
        );

        when(leaderboardService.getLeaderboard("player@carbontrack.com", LeaderboardPeriod.WEEKLY, "ORGANISATION"))
                .thenReturn(orgLeaderboard);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                achievementService.claimAchievement("player@carbontrack.com", LeaderboardPeriod.WEEKLY, "ORGANISATION")
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("top 3"));
        verify(achievementRepository, never()).save(any());
    }

    @Test
    @DisplayName("claimAchievement throws CONFLICT when user has already claimed for that period, date and scope")
    void shouldRejectDuplicateClaim() {
        when(userRepository.findByEmail("player@carbontrack.com")).thenReturn(Optional.of(testUser));

        LocalDate startDate = LocalDate.of(2026, 11, 9);
        LocalDate endDate = LocalDate.of(2026, 11, 15);

        LeaderboardResponseDTO leaderboard = new LeaderboardResponseDTO(
                LeaderboardPeriod.WEEKLY,
                7,
                startDate,
                endDate,
                10,
                2,
                new BigDecimal("45.500"),
                true,
                Collections.emptyList()
        );

        when(leaderboardService.getLeaderboard("player@carbontrack.com", LeaderboardPeriod.WEEKLY, "OVERALL"))
                .thenReturn(leaderboard);

        when(achievementRepository.existsByUserIdAndLeaderboardPeriodAndPeriodStartDateAndScope(
                42L, "WEEKLY", startDate, "OVERALL"
        )).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                achievementService.claimAchievement("player@carbontrack.com", LeaderboardPeriod.WEEKLY, "OVERALL")
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("already claimed"));
    }

    @Test
    @DisplayName("getMyAchievements returns mapped achievements for user")
    void shouldReturnMyAchievements() {
        when(userRepository.findByEmail("player@carbontrack.com")).thenReturn(Optional.of(testUser));

        UserAchievement a1 = new UserAchievement();
        ReflectionTestUtils.setField(a1, "id", 1L);
        a1.setAchievementType("SILVER_LEAF");
        a1.setLeaderboardPeriod("WEEKLY");
        a1.setScope("ORGANISATION");
        a1.setRankAtClaim(2);
        a1.setEmissionsKgAtClaim(new BigDecimal("45.500"));
        a1.setPeriodStartDate(LocalDate.of(2026, 11, 9));
        a1.setPeriodEndDate(LocalDate.of(2026, 11, 15));
        ReflectionTestUtils.setField(a1, "claimedAt", LocalDateTime.now());

        when(achievementRepository.findByUserIdOrderByClaimedAtDesc(42L)).thenReturn(List.of(a1));

        List<AchievementResponseDTO> result = achievementService.getMyAchievements("player@carbontrack.com");

        assertEquals(1, result.size());
        assertEquals("SILVER_LEAF", result.get(0).achievementType());
        assertEquals("ORGANISATION", result.get(0).scope());
    }
}
