package com.carbontrack.carbontrackbackend.listener;

import com.carbontrack.carbontrackbackend.event.ActivityLoggedEvent;
import com.carbontrack.carbontrackbackend.service.BadgeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class BadgeEventListener {

    private static final Logger log = LoggerFactory.getLogger(BadgeEventListener.class);
    private final BadgeService badgeService;

    public BadgeEventListener(BadgeService badgeService) {
        this.badgeService = badgeService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onActivityLogged(ActivityLoggedEvent event) {
        try {
            badgeService.evaluateBadges(event.userId());
        } catch (Exception ex) {
            log.warn("Badge evaluation encountered an error for user ID {}: {}", event.userId(), ex.getMessage());
        }
    }
}
