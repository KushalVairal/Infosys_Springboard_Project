
package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.GoalAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GoalAlertRepository
        extends JpaRepository<GoalAlert, Long> {

    Optional<GoalAlert> findByGoalIdAndAlertType(
            Long goalId,
            String alertType);

    List<GoalAlert> findByGoalIdOrderByCreatedAtDesc(Long goalId);

    @Modifying
    @Query("DELETE FROM GoalAlert ga WHERE ga.goal.id = :goalId")
    void deleteByGoalId(@Param("goalId") Long goalId);
}
