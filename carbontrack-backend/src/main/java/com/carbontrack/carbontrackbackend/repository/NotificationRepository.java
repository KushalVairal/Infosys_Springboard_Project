package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    long countByRecipientIdAndIsReadFalse(Long recipientId);

    Optional<Notification> findByIdAndRecipientId(Long id, Long recipientId);

    Optional<Notification> findFirstByRecipientIdAndRelatedEntityIdOrderByCreatedAtDesc(Long recipientId, Long relatedEntityId);

    List<Notification> findByRecipientIdAndRelatedEntityId(Long recipientId, Long relatedEntityId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now WHERE n.recipient.id = :recipientId AND n.isRead = false")
    int markAllAsReadForRecipient(@Param("recipientId") Long recipientId, @Param("now") LocalDateTime now);
}
