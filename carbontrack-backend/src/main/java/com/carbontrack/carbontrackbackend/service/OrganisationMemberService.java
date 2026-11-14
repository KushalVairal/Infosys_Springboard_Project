package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.organisation.OrganisationInvitationDTO;
import com.carbontrack.carbontrackbackend.dto.organisation.OrganisationMemberDTO;
import com.carbontrack.carbontrackbackend.entity.Notification;
import com.carbontrack.carbontrackbackend.entity.Organisation;
import com.carbontrack.carbontrackbackend.entity.OrganisationInvitation;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.NotificationRepository;
import com.carbontrack.carbontrackbackend.repository.OrganisationInvitationRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
public class OrganisationMemberService {

    private static final Logger log = LoggerFactory.getLogger(OrganisationMemberService.class);

    private final UserRepository userRepository;
    private final OrganisationInvitationRepository invitationRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public OrganisationMemberService(
            UserRepository userRepository,
            OrganisationInvitationRepository invitationRepository,
            NotificationService notificationService,
            NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<OrganisationMemberDTO> getMembers(String adminEmail) {
        User admin = resolveAndValidateAdmin(adminEmail);
        Organisation org = admin.getOrganisation();

        return userRepository.findByOrganisationId(org.getId()).stream()
                .map(u -> new OrganisationMemberDTO(
                        u.getId(),
                        u.getUsername(),
                        u.getEmail(),
                        u.getFullName(),
                        u.getRole(),
                        u.getCreatedAt(),
                        u.getAvatarSeed()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrganisationInvitationDTO> getInvitations(String adminEmail) {
        User admin = resolveAndValidateAdmin(adminEmail);
        Organisation org = admin.getOrganisation();

        LocalDateTime now = LocalDateTime.now();
        List<OrganisationInvitation> invitations = invitationRepository.findByOrganisationIdOrderByCreatedAtDesc(org.getId());

        // Mark expired invitations dynamically
        for (OrganisationInvitation inv : invitations) {
            if ("PENDING".equals(inv.getStatus()) && inv.getExpiresAt().isBefore(now)) {
                inv.setStatus("EXPIRED");
            }
        }

        return invitations.stream()
                .map(this::toInvitationDTO)
                .toList();
    }

    @Transactional
    public OrganisationInvitationDTO createInvitation(String adminEmail, String rawInviteeEmail) {
        User admin = resolveAndValidateAdmin(adminEmail);
        Organisation org = admin.getOrganisation();

        String inviteeEmail = rawInviteeEmail.trim().toLowerCase();

        // 1. Check if user already exists and belongs to an organisation
        User existingUser = userRepository.findByEmail(inviteeEmail).orElse(null);
        if (existingUser != null) {
            if (existingUser.getOrganisation() != null) {
                if (existingUser.getOrganisation().getId().equals(org.getId())) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "User is already a member of this organisation."
                    );
                } else {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "User is already a member of another organisation. Members cannot be transferred between organisations."
                    );
                }
            }
        }

        // 2. Check if active pending invitation already exists
        LocalDateTime now = LocalDateTime.now();
        boolean activeExists = invitationRepository.existsByOrganisationIdAndInviteeEmailIgnoreCaseAndStatusAndExpiresAtAfter(
                org.getId(),
                inviteeEmail,
                "PENDING",
                now
        );
        if (activeExists) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An active invitation has already been sent to this email address."
            );
        }

        // 3. Generate cryptographically secure token & hash it
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        String tokenHash = hashToken(rawToken);

        LocalDateTime expiresAt = now.plusDays(7);

        OrganisationInvitation invitation = new OrganisationInvitation(
                org,
                admin,
                inviteeEmail,
                existingUser,
                tokenHash,
                expiresAt
        );

        invitation = invitationRepository.save(invitation);
        log.info("Created organisation invitation ID {} for {} to org {}", invitation.getId(), inviteeEmail, org.getName());

        // 4. Send in-app notification if registered user exists
        if (existingUser != null) {
            notificationService.createNotification(
                    existingUser,
                    "ORGANISATION_INVITATION",
                    "Invitation to Join " + org.getName(),
                    admin.getUsername() + " has invited you to join " + org.getName() + " on CarbonTrack.",
                    invitation.getId()
            );
        }

        return toInvitationDTO(invitation);
    }

    @Transactional
    public OrganisationInvitationDTO cancelInvitation(String adminEmail, Long invitationId) {
        User admin = resolveAndValidateAdmin(adminEmail);
        Organisation org = admin.getOrganisation();

        OrganisationInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));

        if (!invitation.getOrganisation().getId().equals(org.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Invitation belongs to another organisation");
        }

        if (!"PENDING".equals(invitation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending invitations can be cancelled");
        }

        invitation.setStatus("CANCELLED");
        invitation.setRespondedAt(LocalDateTime.now());
        invitation = invitationRepository.save(invitation);

        return toInvitationDTO(invitation);
    }

    @Transactional
    public OrganisationInvitationDTO acceptInvitation(String userEmail, Long invitationId) {
        User user = userRepository.findByEmail(userEmail)
                .or(() -> userRepository.findByUsername(userEmail))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        OrganisationInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));

        // Validate recipient identity
        if (!invitation.getInviteeEmail().equalsIgnoreCase(user.getEmail()) &&
                (invitation.getInviteeUser() == null || !invitation.getInviteeUser().getId().equals(user.getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This invitation was sent to a different user");
        }

        // Idempotent acceptance check: if already accepted by this user into this organisation
        if ("ACCEPTED".equalsIgnoreCase(invitation.getStatus())) {
            if (user.getOrganisation() != null && user.getOrganisation().getId().equals(invitation.getOrganisation().getId())) {
                return toInvitationDTO(invitation);
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This invitation has already been accepted.");
        }

        if ("REJECTED".equalsIgnoreCase(invitation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This invitation was previously declined and cannot be accepted.");
        }

        if ("CANCELLED".equalsIgnoreCase(invitation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This invitation was cancelled by the organisation administrator.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (invitation.getExpiresAt().isBefore(now)) {
            invitation.setStatus("EXPIRED");
            invitationRepository.save(invitation);
            throw new ResponseStatusException(HttpStatus.GONE, "This invitation has expired.");
        }

        Organisation org = invitation.getOrganisation();
        if (org == null || !org.isActive()) {
            throw new ResponseStatusException(HttpStatus.GONE, "The organisation associated with this invitation is no longer active.");
        }

        if (user.getOrganisation() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You are already a member of an organisation (" + user.getOrganisation().getName() + "). You must leave your current organisation before accepting a new invitation."
            );
        }

        // Assign user to organisation
        user.setOrganisation(org);
        userRepository.save(user);

        invitation.setStatus("ACCEPTED");
        invitation.setRespondedAt(now);
        invitation.setInviteeUser(user);
        invitation = invitationRepository.save(invitation);

        log.info("User {} accepted invitation to join org {}", user.getUsername(), org.getName());

        // Update the recipient's in-app notification so it displays ACCEPTED permanently and removes action buttons
        List<Notification> recipientNotifications = notificationRepository.findByRecipientIdAndRelatedEntityId(user.getId(), invitation.getId());
        for (Notification n : recipientNotifications) {
            n.setNotificationType("INVITATION_ACCEPTED");
            n.setTitle("Joined " + org.getName());
            n.setMessage("You accepted the invitation and successfully joined " + org.getName() + ".");
            n.setRead(true);
            n.setReadAt(now);
            notificationRepository.save(n);
        }

        // Notify inviting admin
        notificationService.createNotification(
                invitation.getInvitedBy(),
                "INVITATION_ACCEPTED",
                "Invitation Accepted: " + user.getUsername(),
                user.getUsername() + " (" + user.getEmail() + ") has accepted your invitation to join " + org.getName() + ".",
                invitation.getId()
        );

        return toInvitationDTO(invitation);
    }

    @Transactional
    public OrganisationInvitationDTO rejectInvitation(String userEmail, Long invitationId) {
        User user = userRepository.findByEmail(userEmail)
                .or(() -> userRepository.findByUsername(userEmail))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        OrganisationInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));

        if (!invitation.getInviteeEmail().equalsIgnoreCase(user.getEmail()) &&
                (invitation.getInviteeUser() == null || !invitation.getInviteeUser().getId().equals(user.getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This invitation was sent to a different user");
        }

        // Idempotent rejection check
        if ("REJECTED".equalsIgnoreCase(invitation.getStatus())) {
            return toInvitationDTO(invitation);
        }

        if (!"PENDING".equalsIgnoreCase(invitation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation is not in pending status");
        }

        LocalDateTime now = LocalDateTime.now();
        invitation.setStatus("REJECTED");
        invitation.setRespondedAt(now);
        invitation.setInviteeUser(user);
        invitation = invitationRepository.save(invitation);

        log.info("User {} rejected invitation to org {}", user.getUsername(), invitation.getOrganisation().getName());

        // Update recipient notification
        List<Notification> recipientNotifications = notificationRepository.findByRecipientIdAndRelatedEntityId(user.getId(), invitation.getId());
        for (Notification n : recipientNotifications) {
            n.setNotificationType("INVITATION_REJECTED");
            n.setTitle("Invitation Declined");
            n.setMessage("You declined the invitation to join " + invitation.getOrganisation().getName() + ".");
            n.setRead(true);
            n.setReadAt(now);
            notificationRepository.save(n);
        }

        // Notify inviting admin
        notificationService.createNotification(
                invitation.getInvitedBy(),
                "INVITATION_REJECTED",
                "Invitation Declined",
                user.getUsername() + " (" + user.getEmail() + ") has declined your invitation to join " + invitation.getOrganisation().getName() + ".",
                invitation.getId()
        );

        return toInvitationDTO(invitation);
    }

    @Transactional
    public void removeMember(String adminEmail, Long memberUserId) {
        User admin = resolveAndValidateAdmin(adminEmail);
        Organisation org = admin.getOrganisation();

        User member = userRepository.findById(memberUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));

        if (member.getOrganisation() == null || !member.getOrganisation().getId().equals(org.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a member of your organisation");
        }

        if (member.getId().equals(admin.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot remove yourself. To leave, transfer ownership or delete the organisation.");
        }

        member.setOrganisation(null);
        if ("ORG_ADMIN".equalsIgnoreCase(member.getRole()) || "ROLE_ORG_ADMIN".equalsIgnoreCase(member.getRole())) {
            member.setRole("USER");
        }
        userRepository.save(member);

        log.info("Admin {} removed member {} from org {}", admin.getUsername(), member.getUsername(), org.getName());

        notificationService.createNotification(
                member,
                "ORGANISATION_UPDATE",
                "Membership Removed",
                "You have been removed from " + org.getName() + " by the organisation administrator.",
                null
        );
    }

    private User resolveAndValidateAdmin(String authenticatedName) {
        if (authenticatedName == null || authenticatedName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        User user = userRepository.findByEmail(authenticatedName)
                .or(() -> userRepository.findByUsername(authenticatedName))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));

        String role = user.getRole();
        if (role == null || (!role.equalsIgnoreCase("ORG_ADMIN") && !role.equalsIgnoreCase("ROLE_ORG_ADMIN"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Only organisation admins can perform this action");
        }

        if (user.getOrganisation() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: User does not belong to any organisation");
        }

        return user;
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm not available", ex);
        }
    }

    private OrganisationInvitationDTO toInvitationDTO(OrganisationInvitation inv) {
        return new OrganisationInvitationDTO(
                inv.getId(),
                inv.getOrganisation().getId(),
                inv.getOrganisation().getName(),
                inv.getInviteeEmail(),
                inv.getStatus(),
                inv.getInvitedBy() != null ? inv.getInvitedBy().getUsername() : "Admin",
                inv.getCreatedAt(),
                inv.getExpiresAt(),
                inv.getRespondedAt()
        );
    }
}
