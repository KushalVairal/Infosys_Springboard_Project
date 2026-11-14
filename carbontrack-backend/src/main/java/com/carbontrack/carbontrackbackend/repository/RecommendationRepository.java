package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Recommendation> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    List<Recommendation> findByUserIdAndCategoryAndStatusOrderByCreatedAtDesc(Long userId, String category, String status);

    Optional<Recommendation> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndTitleAndStatusIn(Long userId, String title, Collection<String> statuses);

    boolean existsByUserIdAndCategoryAndActivityTypeAndStatusIn(
            Long userId, String category, String activityType, Collection<String> statuses);

    long countByUserIdAndStatus(Long userId, String status);
}

