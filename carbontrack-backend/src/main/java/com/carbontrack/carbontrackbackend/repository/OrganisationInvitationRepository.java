package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.OrganisationInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrganisationInvitationRepository extends JpaRepository<OrganisationInvitation, Long> {

    List<OrganisationInvitation> findByOrganisationIdOrderByCreatedAtDesc(Long organisationId);

    List<OrganisationInvitation> findByInviteeEmailIgnoreCaseOrderByCreatedAtDesc(String inviteeEmail);

    Optional<OrganisationInvitation> findByTokenHash(String tokenHash);

    boolean existsByOrganisationIdAndInviteeEmailIgnoreCaseAndStatusAndExpiresAtAfter(
            Long organisationId,
            String inviteeEmail,
            String status,
            LocalDateTime now
    );
}

