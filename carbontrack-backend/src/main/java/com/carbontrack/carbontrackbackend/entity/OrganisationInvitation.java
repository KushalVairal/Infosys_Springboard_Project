package com.carbontrack.carbontrackbackend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "organisation_invitations")
public class OrganisationInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    private Organisation organisation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_user_id", nullable = false)
    private User invitedBy;

    @Column(name = "invitee_email", nullable = false, length = 255)
    private String inviteeEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitee_user_id")
    private User inviteeUser;

    @Column(name = "token_hash", nullable = false, length = 255)
    private String tokenHash;

    @Column(nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    public OrganisationInvitation() {}

    public OrganisationInvitation(Organisation organisation, User invitedBy, String inviteeEmail, User inviteeUser, String tokenHash, LocalDateTime expiresAt) {
        this.organisation = organisation;
        this.invitedBy = invitedBy;
        this.inviteeEmail = inviteeEmail;
        this.inviteeUser = inviteeUser;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.status = "PENDING";
    }

    public Long getId() { return id; }

    public Organisation getOrganisation() { return organisation; }
    public void setOrganisation(Organisation organisation) { this.organisation = organisation; }

    public User getInvitedBy() { return invitedBy; }
    public void setInvitedBy(User invitedBy) { this.invitedBy = invitedBy; }

    public String getInviteeEmail() { return inviteeEmail; }
    public void setInviteeEmail(String inviteeEmail) { this.inviteeEmail = inviteeEmail; }

    public User getInviteeUser() { return inviteeUser; }
    public void setInviteeUser(User inviteeUser) { this.inviteeUser = inviteeUser; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }
}

