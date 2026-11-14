package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.organisation.*;
import com.carbontrack.carbontrackbackend.entity.Organisation;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.entity.OrganisationCreation;
import com.carbontrack.carbontrackbackend.entity.OrganisationInvitation;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.OrganisationCreationRepository;
import com.carbontrack.carbontrackbackend.repository.OrganisationInvitationRepository;
import com.carbontrack.carbontrackbackend.repository.OrganisationRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganisationServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganisationRepository organisationRepository;

    @Mock
    private OrganisationCreationRepository creationRepository;

    @Mock
    private OrganisationInvitationRepository invitationRepository;

    @Mock
    private NotificationService notificationService;

    private OrganisationService organisationService;

    private Organisation testOrg;
    private User orgAdminUser;
    private User normalUser;

    @BeforeEach
    void setUp() {
        organisationService = new OrganisationService(
                activityLogRepository,
                userRepository,
                organisationRepository,
                creationRepository,
                notificationService,
                invitationRepository
        );

        testOrg = new Organisation();
        ReflectionTestUtils.setField(testOrg, "id", 10L);
        testOrg.setName("Acme Corporation");

        orgAdminUser = new User();
        ReflectionTestUtils.setField(orgAdminUser, "id", 101L);
        orgAdminUser.setUsername("admin_acme");
        orgAdminUser.setEmail("admin@acme.com");
        orgAdminUser.setRole("ORG_ADMIN");
        orgAdminUser.setOrganisation(testOrg);

        normalUser = new User();
        ReflectionTestUtils.setField(normalUser, "id", 102L);
        normalUser.setUsername("employee_john");
        normalUser.setEmail("john@acme.com");
        normalUser.setRole("USER");
        normalUser.setOrganisation(testOrg);
    }

    @Test
    @DisplayName("Organisation admin with valid org can access dashboard summary")
    void shouldAllowOrgAdminAccess() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 12);
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(orgAdminUser));
        when(activityLogRepository.sumCo2eKgByOrganisationIdAndLogDateBetween(eq(10L), any(), any()))
                .thenReturn(new BigDecimal("1250.500"));
        when(activityLogRepository.countDistinctActiveEmployeesByOrganisationIdBetween(eq(10L), any(), any()))
                .thenReturn(15L);
        when(userRepository.countByOrganisationId(10L)).thenReturn(25L);
        when(activityLogRepository.countActivitiesByOrganisationIdBetween(eq(10L), any(), any()))
                .thenReturn(120L);

        OrganisationSummaryDTO summary = organisationService.getSummary(
                "admin@acme.com",
                LocalDate.of(2026, 11, 1),
                LocalDate.of(2026, 11, 12),
                asOfDate
        );

        assertNotNull(summary);
        assertEquals(10L, summary.organisationId());
        assertEquals("Acme Corporation", summary.organisationName());
        assertEquals(new BigDecimal("1250.500"), summary.totalCo2eKg());
        assertEquals(15L, summary.activeEmployees());
        assertEquals(25L, summary.totalEmployees());
        assertEquals(120L, summary.totalActivities());
    }

    @Test
    @DisplayName("Normal user is rejected with 403 Forbidden")
    void shouldRejectNormalUserAccess() {
        when(userRepository.findByEmail("john@acme.com")).thenReturn(Optional.of(normalUser));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                organisationService.getSummary("john@acme.com", null, null)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Only organisation admins"));
    }

    @Test
    @DisplayName("Admin without an organisation is rejected with 403 Forbidden")
    void shouldRejectAdminWithoutOrganisation() {
        User orphanAdmin = new User();
        ReflectionTestUtils.setField(orphanAdmin, "id", 103L);
        orphanAdmin.setUsername("orphan_admin");
        orphanAdmin.setEmail("orphan@example.com");
        orphanAdmin.setRole("ORG_ADMIN");
        orphanAdmin.setOrganisation(null); // No org assigned

        when(userRepository.findByEmail("orphan@example.com")).thenReturn(Optional.of(orphanAdmin));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                organisationService.getSummary("orphan@example.com", null, null)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("User does not belong to any organisation"));
    }

    @Test
    @DisplayName("Cross-organisation data isolation: Admin from Org 1 can only query Org 1")
    void shouldEnforceCrossOrganisationDataIsolation() {
        Organisation orgBeta = new Organisation();
        ReflectionTestUtils.setField(orgBeta, "id", 20L);
        orgBeta.setName("Beta Industries");

        User adminBeta = new User();
        ReflectionTestUtils.setField(adminBeta, "id", 201L);
        adminBeta.setUsername("admin_beta");
        adminBeta.setEmail("admin@beta.com");
        adminBeta.setRole("ORG_ADMIN");
        adminBeta.setOrganisation(orgBeta);

        when(userRepository.findByEmail("admin@beta.com")).thenReturn(Optional.of(adminBeta));
        when(activityLogRepository.sumCo2eKgByOrganisationIdAndLogDateBetween(eq(20L), any(), any()))
                .thenReturn(new BigDecimal("300.000"));
        when(activityLogRepository.countDistinctActiveEmployeesByOrganisationIdBetween(eq(20L), any(), any()))
                .thenReturn(5L);
        when(userRepository.countByOrganisationId(20L)).thenReturn(8L);
        when(activityLogRepository.countActivitiesByOrganisationIdBetween(eq(20L), any(), any()))
                .thenReturn(30L);

        // Call dashboard for adminBeta
        OrganisationSummaryDTO summary = organisationService.getSummary("admin@beta.com", null, null);

        // Verification: query strictly uses Org ID 20, never Org ID 10
        assertEquals(20L, summary.organisationId());
        assertEquals("Beta Industries", summary.organisationName());
    }

    @Test
    @DisplayName("Empty organisation returns zero totals safely without errors")
    void shouldHandleEmptyOrganisation() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(orgAdminUser));
        when(activityLogRepository.sumCo2eKgByOrganisationIdAndLogDateBetween(eq(10L), any(), any()))
                .thenReturn(BigDecimal.ZERO);
        when(activityLogRepository.countDistinctActiveEmployeesByOrganisationIdBetween(eq(10L), any(), any()))
                .thenReturn(0L);
        when(userRepository.countByOrganisationId(10L)).thenReturn(0L);
        when(activityLogRepository.countActivitiesByOrganisationIdBetween(eq(10L), any(), any()))
                .thenReturn(0L);

        OrganisationSummaryDTO summary = organisationService.getSummary("admin@acme.com", null, null);

        assertNotNull(summary);
        assertEquals(new BigDecimal("0.000"), summary.totalCo2eKg());
        assertEquals(0L, summary.activeEmployees());
        assertEquals(0L, summary.totalEmployees());
        assertEquals(0L, summary.totalActivities());
        assertEquals(new BigDecimal("0.00"), summary.monthOverMonthChangePercentage());
    }

    @Test
    @DisplayName("Category aggregation computes accurate percentages of total emissions")
    void shouldAggregateCategoriesWithPercentages() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(orgAdminUser));

        List<OrganisationCategoryAggregateDTO> categoryRows = List.of(
                new OrganisationCategoryAggregateDTO("TRANSPORT", new BigDecimal("600.000"), 40L),
                new OrganisationCategoryAggregateDTO("ELECTRICITY", new BigDecimal("400.000"), 20L)
        );
        when(activityLogRepository.sumCo2eKgByOrganisationIdAndLogDateBetween(eq(10L), any(), any()))
                .thenReturn(new BigDecimal("1000.000"));
        when(activityLogRepository.findOrganisationCategoryTotalsBetween(eq(10L), any(), any()))
                .thenReturn(categoryRows);

        List<OrganisationCategoryDTO> categories = organisationService.getCategories(
                "admin@acme.com", null, null
        );

        assertNotNull(categories);
        assertEquals(2, categories.size());

        // Total = 1000 kg. TRANSPORT = 600 kg (60.00%), ELECTRICITY = 400 kg (40.00%)
        OrganisationCategoryDTO transport = categories.get(0);
        assertEquals("TRANSPORT", transport.category());
        assertEquals(new BigDecimal("600.000"), transport.totalCo2eKg());
        assertEquals(new BigDecimal("60.00"), transport.percentage());
        assertEquals(40L, transport.activityCount());

        OrganisationCategoryDTO electricity = categories.get(1);
        assertEquals("ELECTRICITY", electricity.category());
        assertEquals(new BigDecimal("400.000"), electricity.totalCo2eKg());
        assertEquals(new BigDecimal("40.00"), electricity.percentage());
        assertEquals(20L, electricity.activityCount());
    }

    @Test
    @DisplayName("Monthly trends generates exactly 6 continuous calendar months with MoM changes")
    void shouldAggregateMonthlyTrendsForSixMonths() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 12);
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(orgAdminUser));

        // Let's mock aggregate data for Oct (month 10) = 100 kg, and Nov (month 11) = 120 kg
        List<OrganisationMonthlyAggregateDTO> monthlyRows = List.of(
                new OrganisationMonthlyAggregateDTO(2026, 10, new BigDecimal("100.000"), 10L, 25L),
                new OrganisationMonthlyAggregateDTO(2026, 11, new BigDecimal("120.000"), 12L, 30L)
        );
        when(activityLogRepository.findOrganisationMonthlyTotalsBetween(eq(10L), any(), any()))
                .thenReturn(monthlyRows);

        List<OrganisationTrendDTO> trends = organisationService.getMonthlyTrends("admin@acme.com", asOfDate);

        assertNotNull(trends);
        assertEquals(6, trends.size()); // Jun, Jul, Aug, Sep, Oct, Nov

        // Month 4 in 0-indexed list (Oct 2026): 100.000 kg
        OrganisationTrendDTO oct = trends.get(4);
        assertEquals(2026, oct.year());
        assertEquals(10, oct.month());
        assertEquals(new BigDecimal("100.000"), oct.totalCo2eKg());
        assertEquals(10L, oct.activeEmployees());

        // Month 5 (Nov 2026): 120.000 kg, +20.00% compared to Oct
        OrganisationTrendDTO nov = trends.get(5);
        assertEquals(2026, nov.year());
        assertEquals(11, nov.month());
        assertEquals(new BigDecimal("120.000"), nov.totalCo2eKg());
        assertEquals(new BigDecimal("20.00"), nov.changePercentage());
    }

    @Test
    @DisplayName("Month-over-month percentage calculation handles zero and non-zero values safely")
    void shouldCalculateMonthOverMonthPercentageAccurately() {
        // Normal increase: 100 -> 125 (+25.00%)
        assertEquals(new BigDecimal("25.00"),
                OrganisationService.calculatePercentageChange(new BigDecimal("125"), new BigDecimal("100")));

        // Normal decrease: 100 -> 80 (-20.00%)
        assertEquals(new BigDecimal("-20.00"),
                OrganisationService.calculatePercentageChange(new BigDecimal("80"), new BigDecimal("100")));

        // Previous 0, Current 0 -> 0.00%
        assertEquals(new BigDecimal("0.00"),
                OrganisationService.calculatePercentageChange(BigDecimal.ZERO, BigDecimal.ZERO));

        // Previous 0, Current 50 -> +100.00%
        assertEquals(new BigDecimal("100.00"),
                OrganisationService.calculatePercentageChange(new BigDecimal("50"), BigDecimal.ZERO));

        // Null safety
        assertEquals(new BigDecimal("0.00"),
                OrganisationService.calculatePercentageChange(null, null));
    }

    @Test
    @DisplayName("Employee comparison ranks employees without exposing emails or internal IDs")
    void shouldAggregateAndRankEmployeesWithoutExposingPrivateData() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(orgAdminUser));

        User emp1 = new User();
        ReflectionTestUtils.setField(emp1, "id", 1001L);
        emp1.setUsername("alice_green");
        emp1.setFullName("Alice Green");
        emp1.setEmail("alice@acme.com");

        User emp2 = new User();
        ReflectionTestUtils.setField(emp2, "id", 1002L);
        emp2.setUsername("bob_smith");
        emp2.setFullName("Bob Smith");
        emp2.setEmail("bob@acme.com");

        User emp3 = new User();
        ReflectionTestUtils.setField(emp3, "id", 1003L);
        emp3.setUsername("charlie_inactive");
        emp3.setFullName("Charlie Doe");
        emp3.setEmail("charlie@acme.com");

        when(userRepository.findByOrganisationId(10L)).thenReturn(List.of(emp1, emp2, emp3));

        // Emp1 has 50 kg, Emp2 has 150 kg, Emp3 has 0 (inactive). Total = 200 kg.
        when(activityLogRepository.sumCo2eKgByOrganisationIdAndLogDateBetween(eq(10L), any(), any()))
                .thenReturn(new BigDecimal("200.000"));
        List<OrganisationEmployeeAggregateDTO> aggregates = List.of(
                new OrganisationEmployeeAggregateDTO(1002L, "bob_smith", "Bob Smith", new BigDecimal("150.000"), 8L),
                new OrganisationEmployeeAggregateDTO(1001L, "alice_green", "Alice Green", new BigDecimal("50.000"), 3L)
        );
        when(activityLogRepository.findOrganisationEmployeeTotalsBetween(eq(10L), any(), any()))
                .thenReturn(aggregates);

        List<OrganisationEmployeeDTO> employees = organisationService.getEmployees("admin@acme.com", null, null);

        assertNotNull(employees);
        assertEquals(3, employees.size());

        // Rank 1: Bob (150 kg = 75.00%)
        OrganisationEmployeeDTO rank1 = employees.get(0);
        assertEquals(1, rank1.rank());
        assertEquals("bob_smith", rank1.username());
        assertEquals("Bob Smith", rank1.displayName());
        assertEquals(new BigDecimal("150.000"), rank1.totalCo2eKg());
        assertEquals(8L, rank1.totalActivities());
        assertEquals(new BigDecimal("75.00"), rank1.percentageOfOrgEmissions());

        // Rank 2: Alice (50 kg = 25.00%)
        OrganisationEmployeeDTO rank2 = employees.get(1);
        assertEquals(2, rank2.rank());
        assertEquals("alice_green", rank2.username());
        assertEquals(new BigDecimal("50.000"), rank2.totalCo2eKg());
        assertEquals(new BigDecimal("25.00"), rank2.percentageOfOrgEmissions());

        // Rank 3: Charlie (0 kg = 0.00%)
        OrganisationEmployeeDTO rank3 = employees.get(2);
        assertEquals(3, rank3.rank());
        assertEquals("charlie_inactive", rank3.username());
        assertEquals(new BigDecimal("0.000"), rank3.totalCo2eKg());
        assertEquals(0L, rank3.totalActivities());
        assertEquals(new BigDecimal("0.00"), rank3.percentageOfOrgEmissions());

        // Privacy verification on DTO fields
        for (var field : OrganisationEmployeeDTO.class.getDeclaredFields()) {
            assertNotEquals("email", field.getName().toLowerCase());
            assertNotEquals("userid", field.getName().toLowerCase());
            assertNotEquals("id", field.getName().toLowerCase());
        }
    }

    @Test
    @DisplayName("createOrganisation succeeds and records lifetime creation")
    void shouldCreateOrganisationSuccessfully() {
        User standaloneUser = new User();
        ReflectionTestUtils.setField(standaloneUser, "id", 200L);
        standaloneUser.setEmail("creator@example.com");
        standaloneUser.setUsername("creator");
        standaloneUser.setRole("USER");

        when(userRepository.findByEmail("creator@example.com")).thenReturn(Optional.of(standaloneUser));
        when(creationRepository.existsByUserId(200L)).thenReturn(false);
        when(organisationRepository.existsByNameIgnoreCaseAndIsActiveTrue("GreenTech Innovations")).thenReturn(false);

        when(organisationRepository.save(any(Organisation.class))).thenAnswer(i -> {
            Organisation saved = i.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 55L);
            return saved;
        });

        CreateOrganisationRequestDTO req = new CreateOrganisationRequestDTO("GreenTech Innovations", "Eco initiatives", "PUBLIC");
        OrganisationDetailsDTO details = organisationService.createOrganisation("creator@example.com", req);

        assertNotNull(details);
        assertEquals("GreenTech Innovations", details.name());
        assertEquals("PUBLIC", details.visibility());
        assertEquals("ORG_ADMIN", standaloneUser.getRole());
        assertEquals(55L, standaloneUser.getOrganisation().getId());

        verify(creationRepository).save(any(OrganisationCreation.class));
        verify(userRepository).save(standaloneUser);
    }

    @Test
    @DisplayName("createOrganisation throws CONFLICT when user has already created an organisation in their lifetime")
    void shouldRejectSecondOrganisationCreation() {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", 201L);
        user.setEmail("multi@example.com");

        when(userRepository.findByEmail("multi@example.com")).thenReturn(Optional.of(user));
        when(creationRepository.existsByUserId(201L)).thenReturn(true);

        CreateOrganisationRequestDTO req = new CreateOrganisationRequestDTO("Second Org", "Desc", "PUBLIC");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                organisationService.createOrganisation("multi@example.com", req)
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("lifetime"));
    }

    @Test
    @DisplayName("createOrganisation throws CONFLICT when user already belongs to an active organisation")
    void shouldRejectCreationIfAlreadyBelongsToAnOrg() {
        User userInOrg = new User();
        ReflectionTestUtils.setField(userInOrg, "id", 202L);
        userInOrg.setEmail("member@example.com");
        userInOrg.setOrganisation(testOrg);

        when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(userInOrg));

        CreateOrganisationRequestDTO req = new CreateOrganisationRequestDTO("Another Org", "Desc", "PUBLIC");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                organisationService.createOrganisation("member@example.com", req)
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    @DisplayName("joinPublicOrganisation assigns user to public organisation")
    void shouldJoinPublicOrganisationSuccessfully() {
        User freeUser = new User();
        ReflectionTestUtils.setField(freeUser, "id", 205L);
        freeUser.setEmail("free@example.com");

        Organisation publicOrg = new Organisation();
        ReflectionTestUtils.setField(publicOrg, "id", 88L);
        publicOrg.setName("Public Corp");
        publicOrg.setVisibility("PUBLIC");
        publicOrg.setActive(true);

        when(userRepository.findByEmail("free@example.com")).thenReturn(Optional.of(freeUser));
        when(organisationRepository.findByIdAndIsActiveTrue(88L)).thenReturn(Optional.of(publicOrg));

        OrganisationDetailsDTO result = organisationService.joinPublicOrganisation("free@example.com", 88L);

        assertNotNull(result);
        assertEquals(publicOrg, freeUser.getOrganisation());
        verify(userRepository).save(freeUser);
    }

    @Test
    @DisplayName("joinPublicOrganisation throws CONFLICT if user already belongs to an organisation")
    void shouldRejectJoinIfUserAlreadyInAnOrg() {
        User alreadyMember = new User();
        ReflectionTestUtils.setField(alreadyMember, "id", 206L);
        alreadyMember.setEmail("member2@example.com");
        alreadyMember.setOrganisation(testOrg);

        when(userRepository.findByEmail("member2@example.com")).thenReturn(Optional.of(alreadyMember));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                organisationService.joinPublicOrganisation("member2@example.com", 88L)
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    @DisplayName("leaveOrganisation lets normal member leave successfully")
    void shouldAllowMemberToLeave() {
        User member = new User();
        ReflectionTestUtils.setField(member, "id", 207L);
        member.setEmail("leaver@example.com");
        member.setRole("USER");
        member.setOrganisation(testOrg);

        when(userRepository.findByEmail("leaver@example.com")).thenReturn(Optional.of(member));

        organisationService.leaveOrganisation("leaver@example.com");

        assertNull(member.getOrganisation());
        verify(userRepository).save(member);
    }

    @Test
    @DisplayName("leaveOrganisation blocks sole ORG_ADMIN from leaving")
    void shouldPreventSoleAdminFromLeaving() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(orgAdminUser));
        when(userRepository.findByOrganisationId(10L)).thenReturn(List.of(orgAdminUser, normalUser));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                organisationService.leaveOrganisation("admin@acme.com")
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("transferring ownership"));
    }

    @Test
    @DisplayName("transferOwnership promotes new admin and demotes previous admin to USER")
    void shouldTransferOwnershipSuccessfully() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(orgAdminUser));

        User targetMember = new User();
        ReflectionTestUtils.setField(targetMember, "id", 102L);
        targetMember.setUsername("employee_john");
        targetMember.setRole("USER");
        targetMember.setOrganisation(testOrg);

        when(userRepository.findById(102L)).thenReturn(Optional.of(targetMember));

        OrganisationDetailsDTO result = organisationService.transferOwnership("admin@acme.com", 102L);

        assertNotNull(result);
        assertEquals("USER", orgAdminUser.getRole());
        assertEquals("ORG_ADMIN", targetMember.getRole());
        assertEquals(targetMember, testOrg.getCreator());

        verify(userRepository).save(orgAdminUser);
        verify(userRepository).save(targetMember);
        verify(organisationRepository).save(testOrg);
    }
}

