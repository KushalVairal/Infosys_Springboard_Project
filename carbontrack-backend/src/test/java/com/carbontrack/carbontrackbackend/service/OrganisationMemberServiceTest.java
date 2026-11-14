package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.organisation.OrganisationInvitationDTO;
import com.carbontrack.carbontrackbackend.dto.organisation.OrganisationMemberDTO;
import com.carbontrack.carbontrackbackend.entity.Organisation;
import com.carbontrack.carbontrackbackend.entity.OrganisationInvitation;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.OrganisationInvitationRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganisationMemberServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganisationInvitationRepository invitationRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private com.carbontrack.carbontrackbackend.repository.NotificationRepository notificationRepository;

    @InjectMocks
    private OrganisationMemberService memberService;

    private User admin;
    private Organisation org;

    @BeforeEach
    void setUp() {
        org = new Organisation();
        ReflectionTestUtils.setField(org, "id", 10L);
        org.setName("Acme Eco");

        admin = new User();
        ReflectionTestUtils.setField(admin, "id", 1L);
        admin.setEmail("admin@acme.com");
        admin.setUsername("acmeadmin");
        admin.setRole("ORG_ADMIN");
        admin.setOrganisation(org);
    }

    @Test
    @DisplayName("getMembers returns organisation members")
    void shouldReturnOrganisationMembers() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(admin));

        User member = new User();
        ReflectionTestUtils.setField(member, "id", 2L);
        member.setEmail("member@acme.com");
        member.setUsername("acmemember");
        member.setRole("USER");
        member.setOrganisation(org);

        when(userRepository.findByOrganisationId(10L)).thenReturn(List.of(admin, member));

        List<OrganisationMemberDTO> members = memberService.getMembers("admin@acme.com");

        assertEquals(2, members.size());
        assertEquals("acmeadmin", members.get(0).username());
        assertEquals("acmemember", members.get(1).username());
    }

    @Test
    @DisplayName("createInvitation creates invitation and sends in-app notification to registered user")
    void shouldCreateInvitationSuccessfully() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(admin));

        User invitee = new User();
        ReflectionTestUtils.setField(invitee, "id", 2L);
        invitee.setEmail("invitee@example.com");
        invitee.setUsername("invitee");

        when(userRepository.findByEmail("invitee@example.com")).thenReturn(Optional.of(invitee));
        when(invitationRepository.existsByOrganisationIdAndInviteeEmailIgnoreCaseAndStatusAndExpiresAtAfter(
                eq(10L), eq("invitee@example.com"), eq("PENDING"), any(LocalDateTime.class))).thenReturn(false);

        when(invitationRepository.save(any(OrganisationInvitation.class))).thenAnswer(i -> {
            OrganisationInvitation inv = i.getArgument(0);
            ReflectionTestUtils.setField(inv, "id", 100L);
            return inv;
        });

        OrganisationInvitationDTO result = memberService.createInvitation("admin@acme.com", "invitee@example.com");

        assertNotNull(result);
        assertEquals("invitee@example.com", result.inviteeEmail());
        assertEquals("PENDING", result.status());

        verify(notificationService, times(1)).createNotification(
                eq(invitee),
                eq("ORGANISATION_INVITATION"),
                contains("Acme Eco"),
                anyString(),
                eq(100L)
        );
    }

    @Test
    @DisplayName("createInvitation throws CONFLICT when user is already in the organisation")
    void shouldRejectInvitationIfAlreadyInOrg() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(admin));

        User existingInOrg = new User();
        existingInOrg.setEmail("member@acme.com");
        existingInOrg.setOrganisation(org);
        when(userRepository.findByEmail("member@acme.com")).thenReturn(Optional.of(existingInOrg));

        assertThrows(ResponseStatusException.class, () ->
                memberService.createInvitation("admin@acme.com", "member@acme.com")
        );
    }

    @Test
    @DisplayName("createInvitation throws CONFLICT when user belongs to another organisation")
    void shouldRejectInvitationIfInDifferentOrg() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(admin));

        Organisation otherOrg = new Organisation();
        ReflectionTestUtils.setField(otherOrg, "id", 20L);
        otherOrg.setName("Other Corp");

        User existingInOtherOrg = new User();
        existingInOtherOrg.setEmail("member@other.com");
        existingInOtherOrg.setOrganisation(otherOrg);
        when(userRepository.findByEmail("member@other.com")).thenReturn(Optional.of(existingInOtherOrg));

        assertThrows(ResponseStatusException.class, () ->
                memberService.createInvitation("admin@acme.com", "member@other.com")
        );
    }

    @Test
    @DisplayName("cancelInvitation marks pending invitation as CANCELLED")
    void shouldCancelInvitationSuccessfully() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(admin));

        OrganisationInvitation inv = new OrganisationInvitation(org, admin, "pending@example.com", null, "hash", LocalDateTime.now().plusDays(5));
        ReflectionTestUtils.setField(inv, "id", 101L);
        when(invitationRepository.findById(101L)).thenReturn(Optional.of(inv));
        when(invitationRepository.save(any(OrganisationInvitation.class))).thenAnswer(i -> i.getArgument(0));

        OrganisationInvitationDTO result = memberService.cancelInvitation("admin@acme.com", 101L);

        assertEquals("CANCELLED", result.status());
    }

    @Test
    @DisplayName("acceptInvitation assigns member to organisation and notifies admin")
    void shouldAcceptInvitationSuccessfully() {
        User recipient = new User();
        ReflectionTestUtils.setField(recipient, "id", 5L);
        recipient.setEmail("invited@example.com");
        recipient.setUsername("invited_user");

        when(userRepository.findByEmail("invited@example.com")).thenReturn(Optional.of(recipient));

        OrganisationInvitation inv = new OrganisationInvitation(org, admin, "invited@example.com", recipient, "hash", LocalDateTime.now().plusDays(5));
        ReflectionTestUtils.setField(inv, "id", 102L);
        when(invitationRepository.findById(102L)).thenReturn(Optional.of(inv));
        when(invitationRepository.save(any(OrganisationInvitation.class))).thenAnswer(i -> i.getArgument(0));

        OrganisationInvitationDTO result = memberService.acceptInvitation("invited@example.com", 102L);

        assertEquals("ACCEPTED", result.status());
        assertEquals(org, recipient.getOrganisation());
        verify(userRepository).save(recipient);

        verify(notificationService).createNotification(
                eq(admin),
                eq("INVITATION_ACCEPTED"),
                anyString(),
                anyString(),
                eq(102L)
        );
    }

    @Test
    @DisplayName("rejectInvitation marks invitation as REJECTED and notifies admin")
    void shouldRejectInvitationSuccessfully() {
        User recipient = new User();
        ReflectionTestUtils.setField(recipient, "id", 5L);
        recipient.setEmail("declined@example.com");
        recipient.setUsername("declined_user");

        when(userRepository.findByEmail("declined@example.com")).thenReturn(Optional.of(recipient));

        OrganisationInvitation inv = new OrganisationInvitation(org, admin, "declined@example.com", recipient, "hash", LocalDateTime.now().plusDays(5));
        ReflectionTestUtils.setField(inv, "id", 103L);
        when(invitationRepository.findById(103L)).thenReturn(Optional.of(inv));
        when(invitationRepository.save(any(OrganisationInvitation.class))).thenAnswer(i -> i.getArgument(0));

        OrganisationInvitationDTO result = memberService.rejectInvitation("declined@example.com", 103L);

        assertEquals("REJECTED", result.status());
        assertNull(recipient.getOrganisation());

        verify(notificationService).createNotification(
                eq(admin),
                eq("INVITATION_REJECTED"),
                anyString(),
                anyString(),
                eq(103L)
        );
    }

    @Test
    @DisplayName("acceptInvitation is idempotent when invitation was already ACCEPTED")
    void shouldHandleAlreadyAcceptedInvitationIdempotently() {
        User recipient = new User();
        ReflectionTestUtils.setField(recipient, "id", 5L);
        recipient.setEmail("invited@example.com");
        recipient.setOrganisation(org);

        when(userRepository.findByEmail("invited@example.com")).thenReturn(Optional.of(recipient));

        OrganisationInvitation inv = new OrganisationInvitation(org, admin, "invited@example.com", recipient, "hash", LocalDateTime.now().plusDays(5));
        ReflectionTestUtils.setField(inv, "id", 104L);
        inv.setStatus("ACCEPTED");
        when(invitationRepository.findById(104L)).thenReturn(Optional.of(inv));

        OrganisationInvitationDTO result = memberService.acceptInvitation("invited@example.com", 104L);

        assertNotNull(result);
        assertEquals("ACCEPTED", result.status());
        verify(invitationRepository, never()).save(any());
    }

    @Test
    @DisplayName("rejectInvitation is idempotent when invitation was already REJECTED")
    void shouldHandleAlreadyRejectedInvitationIdempotently() {
        User recipient = new User();
        ReflectionTestUtils.setField(recipient, "id", 5L);
        recipient.setEmail("declined@example.com");

        when(userRepository.findByEmail("declined@example.com")).thenReturn(Optional.of(recipient));

        OrganisationInvitation inv = new OrganisationInvitation(org, admin, "declined@example.com", recipient, "hash", LocalDateTime.now().plusDays(5));
        ReflectionTestUtils.setField(inv, "id", 105L);
        inv.setStatus("REJECTED");
        when(invitationRepository.findById(105L)).thenReturn(Optional.of(inv));

        OrganisationInvitationDTO result = memberService.rejectInvitation("declined@example.com", 105L);

        assertNotNull(result);
        assertEquals("REJECTED", result.status());
        verify(invitationRepository, never()).save(any());
    }

    @Test
    @DisplayName("removeMember removes user from organisation and notifies them")
    void shouldRemoveMemberSuccessfully() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(admin));

        User member = new User();
        ReflectionTestUtils.setField(member, "id", 50L);
        member.setEmail("member@acme.com");
        member.setUsername("acmemember");
        member.setRole("USER");
        member.setOrganisation(org);

        when(userRepository.findById(50L)).thenReturn(Optional.of(member));

        memberService.removeMember("admin@acme.com", 50L);

        assertNull(member.getOrganisation());
        verify(userRepository).save(member);
        verify(notificationService).createNotification(
                eq(member),
                eq("ORGANISATION_UPDATE"),
                eq("Membership Removed"),
                anyString(),
                isNull()
        );
    }

    @Test
    @DisplayName("removeMember throws BAD_REQUEST when admin tries to remove themselves")
    void shouldPreventAdminFromRemovingSelf() {
        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(admin));
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                memberService.removeMember("admin@acme.com", 1L)
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }
}

