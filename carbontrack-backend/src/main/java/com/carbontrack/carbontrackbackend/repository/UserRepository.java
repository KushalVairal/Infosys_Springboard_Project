package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    long countByOrganisationId(Long orgId);

    List<User> findByOrganisationId(Long orgId);
}
