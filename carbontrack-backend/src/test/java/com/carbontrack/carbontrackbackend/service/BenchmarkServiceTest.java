package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.benchmark.BenchmarkResponseDTO;
import com.carbontrack.carbontrackbackend.dto.benchmark.CategoryEmissionAggregateDTO;
import com.carbontrack.carbontrackbackend.dto.benchmark.UserEmissionAggregateDTO;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BenchmarkServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private UserRepository userRepository;

    private BenchmarkService benchmarkService;
    private User testUser;

    @BeforeEach
    void setUp() {
        benchmarkService = new BenchmarkService(activityLogRepository, userRepository);

        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 101L);
        testUser.setEmail("peer@example.com");
    }

    @Test
    void shouldReturnEcoPercentileWhenUserIsCleanestInSufficientCohort() {
        when(userRepository.findByEmail("peer@example.com")).thenReturn(Optional.of(testUser));

        // 4 users: 101 has 10 kg (lowest), others have 20, 30, 40 kg
        List<UserEmissionAggregateDTO> userTotals = List.of(
                new UserEmissionAggregateDTO(101L, new BigDecimal("10.000")),
                new UserEmissionAggregateDTO(102L, new BigDecimal("20.000")),
                new UserEmissionAggregateDTO(103L, new BigDecimal("30.000")),
                new UserEmissionAggregateDTO(104L, new BigDecimal("40.000"))
        );

        when(activityLogRepository.findUserTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(userTotals);

        when(activityLogRepository.findCategoryTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(
                        new CategoryEmissionAggregateDTO("TRANSPORT", new BigDecimal("40.000")),
                        new CategoryEmissionAggregateDTO("ELECTRICITY", new BigDecimal("60.000"))
                ));

        when(activityLogRepository.findUserCategoryTotalsBetween(eq(101L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(
                        new CategoryEmissionAggregateDTO("TRANSPORT", new BigDecimal("10.000"))
                ));

        BenchmarkResponseDTO response = benchmarkService.getMyBenchmark("peer@example.com");

        assertNotNull(response);
        assertEquals(30, response.periodDays());
        assertEquals(4, response.cohortSize());
        assertEquals(new BigDecimal("10.000"), response.userTotalCo2eKg());
        assertEquals(new BigDecimal("25.000"), response.platformAverageCo2eKg());
        assertEquals("SUFFICIENT_DATA", response.status());

        // 3 peers emit more, 1 peer emits equal (itself) -> (3 + 0.5) / 4 = 87.5%
        assertEquals(87.5, response.ecoPercentile());
        assertFalse(response.categoryBenchmarks().isEmpty());
    }

    @Test
    void shouldReturnZeroPercentileWhenUserHasHighestEmissions() {
        when(userRepository.findByEmail("peer@example.com")).thenReturn(Optional.of(testUser));

        // 3 users: 101 has 100 kg (highest), peers have 20, 30 kg
        List<UserEmissionAggregateDTO> userTotals = List.of(
                new UserEmissionAggregateDTO(102L, new BigDecimal("20.000")),
                new UserEmissionAggregateDTO(103L, new BigDecimal("30.000")),
                new UserEmissionAggregateDTO(101L, new BigDecimal("100.000"))
        );

        when(activityLogRepository.findUserTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(userTotals);

        when(activityLogRepository.findCategoryTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        when(activityLogRepository.findUserCategoryTotalsBetween(eq(101L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        BenchmarkResponseDTO response = benchmarkService.getMyBenchmark("peer@example.com");

        assertEquals(3, response.cohortSize());
        // 0 peers emit more, 1 emits equal -> (0 + 0.5) / 3 * 100 = 16.7%
        assertEquals(16.7, response.ecoPercentile());
        assertEquals("SUFFICIENT_DATA", response.status());
    }

    @Test
    void shouldSuppressComparisonStatisticsWhenCohortIsSmallerThanThree() {
        when(userRepository.findByEmail("peer@example.com")).thenReturn(Optional.of(testUser));

        // Only 2 active users
        List<UserEmissionAggregateDTO> userTotals = List.of(
                new UserEmissionAggregateDTO(101L, new BigDecimal("15.000")),
                new UserEmissionAggregateDTO(102L, new BigDecimal("25.000"))
        );

        when(activityLogRepository.findUserTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(userTotals);

        BenchmarkResponseDTO response = benchmarkService.getMyBenchmark("peer@example.com");

        assertEquals(2, response.cohortSize());
        assertEquals("INSUFFICIENT_PEERS", response.status());
        assertNull(response.platformAverageCo2eKg(), "Platform average must be suppressed when cohort < 3");
        assertNull(response.ecoPercentile(), "Percentile must be suppressed when cohort < 3");
        assertTrue(response.categoryBenchmarks().isEmpty());
    }

    @Test
    void shouldReturnNoUserActivityStatusWhenUserHasLoggedNothingInWindow() {
        when(userRepository.findByEmail("peer@example.com")).thenReturn(Optional.of(testUser));

        // 3 active users, but testUser (101L) is NOT in the cohort
        List<UserEmissionAggregateDTO> userTotals = List.of(
                new UserEmissionAggregateDTO(201L, new BigDecimal("20.000")),
                new UserEmissionAggregateDTO(202L, new BigDecimal("30.000")),
                new UserEmissionAggregateDTO(203L, new BigDecimal("40.000"))
        );

        when(activityLogRepository.findUserTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(userTotals);

        when(activityLogRepository.findCategoryTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        BenchmarkResponseDTO response = benchmarkService.getMyBenchmark("peer@example.com");

        assertEquals(3, response.cohortSize());
        assertEquals(new BigDecimal("0.000"), response.userTotalCo2eKg());
        assertEquals(new BigDecimal("30.000"), response.platformAverageCo2eKg());
        assertNull(response.ecoPercentile(), "Percentile must be null for users with no activity");
        assertEquals("NO_USER_ACTIVITY", response.status());
    }

    @Test
    void shouldCalculateTotalAndShoppingAverageAccuratelyAcrossActiveCohort() {
        when(userRepository.findByEmail("peer@example.com")).thenReturn(Optional.of(testUser));

        // 4 active cohort members with varying category footprint
        // User 101: 50.000 kg total
        // User 102: 100.000 kg total
        // User 103: 150.000 kg total (0 shopping)
        // User 104: 100.000 kg total
        // Total platform = 400.000 kg -> Platform average = 100.000 kg
        List<UserEmissionAggregateDTO> userTotals = List.of(
                new UserEmissionAggregateDTO(101L, new BigDecimal("50.000")),
                new UserEmissionAggregateDTO(102L, new BigDecimal("100.000")),
                new UserEmissionAggregateDTO(103L, new BigDecimal("150.000")),
                new UserEmissionAggregateDTO(104L, new BigDecimal("100.000"))
        );

        when(activityLogRepository.findUserTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(userTotals);

        // Category breakdown:
        // TRANSPORT: 120.000 kg (avg = 30.000 kg)
        // ELECTRICITY: 90.000 kg (avg = 22.500 kg)
        // FOOD: 90.000 kg (avg = 22.500 kg)
        // SHOPPING: 100.000 kg (avg = 25.000 kg)
        when(activityLogRepository.findCategoryTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(
                        new CategoryEmissionAggregateDTO("TRANSPORT", new BigDecimal("120.000")),
                        new CategoryEmissionAggregateDTO("ELECTRICITY", new BigDecimal("90.000")),
                        new CategoryEmissionAggregateDTO("FOOD", new BigDecimal("90.000")),
                        new CategoryEmissionAggregateDTO("SHOPPING", new BigDecimal("100.000"))
                ));

        when(activityLogRepository.findUserCategoryTotalsBetween(eq(101L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(
                        new CategoryEmissionAggregateDTO("SHOPPING", new BigDecimal("10.000")),
                        new CategoryEmissionAggregateDTO("TRANSPORT", new BigDecimal("20.000")),
                        new CategoryEmissionAggregateDTO("ELECTRICITY", new BigDecimal("10.000")),
                        new CategoryEmissionAggregateDTO("FOOD", new BigDecimal("10.000"))
                ));

        BenchmarkResponseDTO response = benchmarkService.getMyBenchmark("peer@example.com");

        assertNotNull(response);
        assertEquals(4, response.cohortSize());
        assertEquals(new BigDecimal("50.000"), response.userTotalCo2eKg());
        assertEquals(new BigDecimal("100.000"), response.platformAverageCo2eKg());

        // Verify shopping category average specifically
        var shoppingBenchmark = response.categoryBenchmarks().stream()
                .filter(c -> "SHOPPING".equalsIgnoreCase(c.category()))
                .findFirst()
                .orElseThrow();
        assertEquals(new BigDecimal("10.000"), shoppingBenchmark.userCo2eKg());
        assertEquals(new BigDecimal("25.000"), shoppingBenchmark.platformAverageCo2eKg());

        // Sum of platform category averages should match platform average
        BigDecimal sumOfCategoryAvgs = response.categoryBenchmarks().stream()
                .map(c -> c.platformAverageCo2eKg())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("100.000"), sumOfCategoryAvgs);
    }

    @Test
    void shouldAggregateCategoriesCaseInsensitivelyAndDefensively() {
        when(userRepository.findByEmail("peer@example.com")).thenReturn(Optional.of(testUser));

        List<UserEmissionAggregateDTO> userTotals = List.of(
                new UserEmissionAggregateDTO(101L, new BigDecimal("30.000")),
                new UserEmissionAggregateDTO(102L, new BigDecimal("30.000")),
                new UserEmissionAggregateDTO(103L, new BigDecimal("30.000"))
        );

        when(activityLogRepository.findUserTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(userTotals);

        // Mixed casing and duplicate keys that should be safely summed:
        // "shopping" (30 kg) + "SHOPPING" (30 kg) -> SHOPPING sum = 60 kg, avg = 20 kg
        // " Food " (30 kg) -> FOOD avg = 10 kg
        when(activityLogRepository.findCategoryTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(
                        new CategoryEmissionAggregateDTO("shopping", new BigDecimal("30.000")),
                        new CategoryEmissionAggregateDTO("SHOPPING", new BigDecimal("30.000")),
                        new CategoryEmissionAggregateDTO(" Food ", new BigDecimal("30.000"))
                ));

        when(activityLogRepository.findUserCategoryTotalsBetween(eq(101L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(
                        new CategoryEmissionAggregateDTO("shopping", new BigDecimal("15.000")),
                        new CategoryEmissionAggregateDTO("SHOPPING", new BigDecimal("5.000"))
                ));

        BenchmarkResponseDTO response = benchmarkService.getMyBenchmark("peer@example.com");

        var shoppingBenchmark = response.categoryBenchmarks().stream()
                .filter(c -> "SHOPPING".equalsIgnoreCase(c.category()))
                .findFirst()
                .orElseThrow();

        // 15 + 5 = 20.000 kg user shopping
        assertEquals(new BigDecimal("20.000"), shoppingBenchmark.userCo2eKg());
        // (30 + 30) / 3 = 20.000 kg platform shopping average
        assertEquals(new BigDecimal("20.000"), shoppingBenchmark.platformAverageCo2eKg());
    }

    @Test
    void shouldCalculatePercentileRankingAccuratelyWithTiesAndMidpointConvention() {
        when(userRepository.findByEmail("peer@example.com")).thenReturn(Optional.of(testUser));

        // 5 users:
        // User 201: 20 kg (cleaner than user 101)
        // User 101: 50 kg (user)
        // User 202: 50 kg (tied with user 101)
        // User 203: 50 kg (tied with user 101)
        // User 204: 100 kg (emits more than user 101)
        List<UserEmissionAggregateDTO> userTotals = List.of(
                new UserEmissionAggregateDTO(201L, new BigDecimal("20.000")),
                new UserEmissionAggregateDTO(101L, new BigDecimal("50.000")),
                new UserEmissionAggregateDTO(202L, new BigDecimal("50.000")),
                new UserEmissionAggregateDTO(203L, new BigDecimal("50.000")),
                new UserEmissionAggregateDTO(204L, new BigDecimal("100.000"))
        );

        when(activityLogRepository.findUserTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(userTotals);

        when(activityLogRepository.findCategoryTotalEmissionsBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        when(activityLogRepository.findUserCategoryTotalsBetween(eq(101L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        BenchmarkResponseDTO response = benchmarkService.getMyBenchmark("peer@example.com");

        // 1 peer emits more (100 kg), 3 peers emit equal (50 kg)
        // Midpoint formula: (1 + 0.5 * 3) / 5 * 100 = 2.5 / 5 * 100 = 50.0%
        assertEquals(50.0, response.ecoPercentile());
    }
}
