package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.organisation.CreateInvitationRequestDTO;
import com.carbontrack.carbontrackbackend.dto.organisation.OrganisationInvitationDTO;
import com.carbontrack.carbontrackbackend.dto.organisation.OrganisationMemberDTO;
import com.carbontrack.carbontrackbackend.service.OrganisationMemberService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class OrganisationMemberController {

    private final OrganisationMemberService memberService;

    public OrganisationMemberController(OrganisationMemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping("/api/organisation/members")
    public List<OrganisationMemberDTO> getMembers(Authentication authentication) {
        return memberService.getMembers(authentication.getName());
    }

    @DeleteMapping("/api/organisation/members/{memberId}")
    public ResponseEntity<?> removeMember(
            @PathVariable Long memberUserId,
            Authentication authentication) {
        memberService.removeMember(authentication.getName(), memberUserId);
        return ResponseEntity.ok(Map.of("message", "Member successfully removed from organisation"));
    }

    @PostMapping("/api/organisation/members/{memberId}/remove")
    public ResponseEntity<?> removeMemberPost(
            @PathVariable Long memberUserId,
            Authentication authentication) {
        memberService.removeMember(authentication.getName(), memberUserId);
        return ResponseEntity.ok(Map.of("message", "Member successfully removed from organisation"));
    }

    @GetMapping("/api/organisation/invitations")
    public List<OrganisationInvitationDTO> getInvitations(Authentication authentication) {
        return memberService.getInvitations(authentication.getName());
    }

    @PostMapping("/api/organisation/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public OrganisationInvitationDTO createInvitation(
            @Valid @RequestBody CreateInvitationRequestDTO request,
            Authentication authentication) {
        return memberService.createInvitation(authentication.getName(), request.email());
    }

    @DeleteMapping("/api/organisation/invitations/{id}")
    public OrganisationInvitationDTO cancelInvitation(
            @PathVariable Long id,
            Authentication authentication) {
        return memberService.cancelInvitation(authentication.getName(), id);
    }

    @PostMapping("/api/organisation/invitations/{id}/cancel")
    public OrganisationInvitationDTO cancelInvitationPost(
            @PathVariable Long id,
            Authentication authentication) {
        return memberService.cancelInvitation(authentication.getName(), id);
    }

    @PostMapping(path = {"/api/organisation/invitations/{id}/accept", "/api/invitations/{id}/accept"})
    public OrganisationInvitationDTO acceptInvitation(
            @PathVariable Long id,
            Authentication authentication) {
        return memberService.acceptInvitation(authentication.getName(), id);
    }

    @PostMapping(path = {"/api/organisation/invitations/{id}/reject", "/api/invitations/{id}/reject"})
    public OrganisationInvitationDTO rejectInvitation(
            @PathVariable Long id,
            Authentication authentication) {
        return memberService.rejectInvitation(authentication.getName(), id);
    }
}
