package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.Organisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganisationRepository extends JpaRepository<Organisation, Long> {

    Optional<Organisation> findByIdAndIsActiveTrue(Long id);

    List<Organisation> findByVisibilityAndIsActiveTrueOrderByCreatedAtDesc(String visibility);

    boolean existsByNameIgnoreCaseAndIsActiveTrue(String name);

    boolean existsByNameIgnoreCaseAndIdNotAndIsActiveTrue(String name, Long id);

    Optional<Organisation> findByNameIgnoreCaseAndIsActiveTrue(String name);

    @Query("SELECT o.id, COUNT(u.id) FROM User u JOIN u.organisation o WHERE o.isActive = true GROUP BY o.id")
    List<Object[]> countMembersPerActiveOrganisation();
}
