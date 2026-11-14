package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.UserNotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserNotificationPreferenceRepository extends JpaRepository<UserNotificationPreference, Long> {

    Optional<UserNotificationPreference> findByUserId(Long userId);
}

