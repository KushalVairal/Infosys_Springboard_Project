package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.organisation.*;
import com.carbontrack.carbontrackbackend.service.OrganisationService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
public class OrganisationController {

    private final OrganisationService organisationService;

    public OrganisationController(OrganisationService organisationService) {
        this.organisationService = organisationService;
    }

    // ==========================================
    // Public Discovery & Membership Actions
    // ==========================================

    @GetMapping(path = {"/api/organisations/public", "/api/organisations/discover", "/api/organisation/public", "/api/organisation/discover"})
    public List<PublicOrganisationDTO> getPublicOrganisations(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return organisationService.getPublicOrganisations(email);
    }

    @PostMapping(path = {"/api/organisations", "/api/organisation/create"})
    @ResponseStatus(HttpStatus.CREATED)
    public OrganisationDetailsDTO createOrganisation(
            @Valid @RequestBody CreateOrganisationRequestDTO request,
            Authentication authentication) {
        return organisationService.createOrganisation(authentication.getName(), request);
    }

    @GetMapping("/api/organisation/details")
    public OrganisationDetailsDTO getOrganisationDetails(Authentication authentication) {
        return organisationService.getOrganisationDetails(authentication.getName());
    }

    @PutMapping("/api/organisation/details")
    public OrganisationDetailsDTO updateOrganisationDetails(
            @Valid @RequestBody UpdateOrganisationRequestDTO request,
            Authentication authentication) {
        return organisationService.updateOrganisationDetails(authentication.getName(), request);
    }

    @PostMapping(path = {"/api/organisations/{id}/join", "/api/organisation/{id}/join"})
    public OrganisationDetailsDTO joinPublicOrganisation(
            @PathVariable Long id,
            Authentication authentication) {
        return organisationService.joinPublicOrganisation(authentication.getName(), id);
    }

    @PostMapping("/api/organisation/leave")
    public ResponseEntity<?> leaveOrganisation(Authentication authentication) {
        organisationService.leaveOrganisation(authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Successfully left the organisation"));
    }

    @PostMapping("/api/organisation/transfer-ownership")
    public OrganisationDetailsDTO transferOwnership(
            @Valid @RequestBody TransferOwnershipRequestDTO request,
            Authentication authentication) {
        return organisationService.transferOwnership(authentication.getName(), request.newOwnerUserId());
    }

    @DeleteMapping("/api/organisation")
    public ResponseEntity<?> deleteOrganisation(Authentication authentication) {
        organisationService.deleteOrganisation(authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Organisation successfully deleted and archived"));
    }

    // ==========================================
    // Organisation Dashboard Aggregates (ORG_ADMIN)
    // ==========================================

    @GetMapping("/api/organisation/dashboard/summary")
    public OrganisationSummaryDTO getSummary(
            Authentication authentication,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        return organisationService.getSummary(
                authentication != null ? authentication.getName() : null,
                startDate,
                endDate
        );
    }

    @GetMapping("/api/organisation/dashboard/categories")
    public List<OrganisationCategoryDTO> getCategories(
            Authentication authentication,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        return organisationService.getCategories(
                authentication != null ? authentication.getName() : null,
                startDate,
                endDate
        );
    }

    @GetMapping("/api/organisation/dashboard/monthly-trends")
    public List<OrganisationTrendDTO> getMonthlyTrends(Authentication authentication) {

        return organisationService.getMonthlyTrends(
                authentication != null ? authentication.getName() : null
        );
    }

    @GetMapping("/api/organisation/dashboard/employees")
    public List<OrganisationEmployeeDTO> getEmployees(
            Authentication authentication,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        return organisationService.getEmployees(
                authentication != null ? authentication.getName() : null,
                startDate,
                endDate
        );
    }
}
