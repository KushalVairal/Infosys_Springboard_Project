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
        log.info(
                "ActivityLoggedEvent received: userId={}, activityId={}, date={}",
                event.userId(),
                event.activityId(),
                event.logDate()
        );

        try {
            var awarded = badgeService.evaluateBadges(event.userId());
            log.info(
                    "Badge evaluation completed for userId={}. Newly awarded: {}",
                    event.userId(),
                    awarded
            );
        } catch (Exception ex) {
            log.error(
                    "Badge evaluation failed for userId={}",
                    event.userId(),
                    ex
            );
        }
    }
}
