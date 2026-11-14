package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.organisation.*;
import com.carbontrack.carbontrackbackend.service.OrganisationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganisationControllerTest {

    @Mock
    private OrganisationService organisationService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private OrganisationController organisationController;

    @BeforeEach
    void setUp() {
        when(authentication.getName()).thenReturn("admin@acme.com");
    }

    @Test
    @DisplayName("GET /api/organisation/dashboard/summary delegates to service with authenticated username")
    void shouldReturnSummary() {
        OrganisationSummaryDTO expected = new OrganisationSummaryDTO(
                1L, "Acme", LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 12),
                new BigDecimal("500.000"), 10L, 20L, 50L,
                new BigDecimal("500.000"), new BigDecimal("400.000"), new BigDecimal("25.00")
        );
        when(organisationService.getSummary("admin@acme.com", null, null)).thenReturn(expected);

        OrganisationSummaryDTO actual = organisationController.getSummary(authentication, null, null);

        assertNotNull(actual);
        assertEquals(expected, actual);
        verify(organisationService).getSummary("admin@acme.com", null, null);
    }

    @Test
    @DisplayName("GET /api/organisation/dashboard/categories delegates to service")
    void shouldReturnCategories() {
        List<OrganisationCategoryDTO> expected = List.of(
                new OrganisationCategoryDTO("TRANSPORT", new BigDecimal("300.000"), new BigDecimal("60.00"), 20L)
        );
        when(organisationService.getCategories("admin@acme.com", null, null)).thenReturn(expected);

        List<OrganisationCategoryDTO> actual = organisationController.getCategories(authentication, null, null);

        assertEquals(expected, actual);
        verify(organisationService).getCategories("admin@acme.com", null, null);
    }

    @Test
    @DisplayName("GET /api/organisation/dashboard/monthly-trends delegates to service")
    void shouldReturnMonthlyTrends() {
        List<OrganisationTrendDTO> expected = List.of(
                new OrganisationTrendDTO(2026, 11, "Nov 2026", new BigDecimal("500.000"), 10L, 40L, new BigDecimal("10.00"))
        );
        when(organisationService.getMonthlyTrends("admin@acme.com")).thenReturn(expected);

        List<OrganisationTrendDTO> actual = organisationController.getMonthlyTrends(authentication);

        assertEquals(expected, actual);
        verify(organisationService).getMonthlyTrends("admin@acme.com");
    }

    @Test
    @DisplayName("GET /api/organisation/dashboard/employees delegates to service")
    void shouldReturnEmployees() {
        List<OrganisationEmployeeDTO> expected = List.of(
                new OrganisationEmployeeDTO(1, "john_doe", "John Doe", new BigDecimal("100.000"), 5L, new BigDecimal("20.00"))
        );
        when(organisationService.getEmployees("admin@acme.com", null, null)).thenReturn(expected);

        List<OrganisationEmployeeDTO> actual = organisationController.getEmployees(authentication, null, null);

        assertEquals(expected, actual);
        verify(organisationService).getEmployees("admin@acme.com", null, null);
    }
}

