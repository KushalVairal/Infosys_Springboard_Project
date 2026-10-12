package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.Organisation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrganisationRepository extends JpaRepository<Organisation, Long> {
    Optional<Organisation> findByName(String name);
    boolean existsByName(String name);
}