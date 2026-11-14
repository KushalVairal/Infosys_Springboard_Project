package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.OrganisationCreation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganisationCreationRepository extends JpaRepository<OrganisationCreation, Long> {

    boolean existsByUserId(Long userId);

    Optional<OrganisationCreation> findByUserId(Long userId);
}

