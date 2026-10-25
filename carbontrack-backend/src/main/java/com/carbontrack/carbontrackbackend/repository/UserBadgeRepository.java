
package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserBadgeRepository
        extends JpaRepository<UserBadge, Long> {

    List<UserBadge> findByUserId(Long userId);

    boolean existsByUserIdAndBadgeId(Long userId, Long badgeId);

    @Query("SELECT ub FROM UserBadge ub JOIN FETCH ub.badge WHERE ub.user.id = :userId ORDER BY ub.awardedAt DESC")
    List<UserBadge> findByUserIdWithBadge(@Param("userId") Long userId);
}

