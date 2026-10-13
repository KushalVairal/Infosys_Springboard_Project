
package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.Organisation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganisationRepository
        extends JpaRepository<Organisation, Long> {
}

