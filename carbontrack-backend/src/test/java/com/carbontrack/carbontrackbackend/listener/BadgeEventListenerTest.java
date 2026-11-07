package com.carbontrack.carbontrackbackend.listener;

import com.carbontrack.carbontrackbackend.event.ActivityLoggedEvent;
import com.carbontrack.carbontrackbackend.service.BadgeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BadgeEventListenerTest {

    @Mock
    private BadgeService badgeService;

    @InjectMocks
    private BadgeEventListener badgeEventListener;

    @Test
    void shouldInvokeBadgeEvaluationWhenActivityLoggedEventReceived() {
        ActivityLoggedEvent event = new ActivityLoggedEvent(
                101L,
                555L,
                LocalDate.now(),
                new BigDecimal("18.000")
        );

        badgeEventListener.onActivityLogged(event);

        verify(badgeService, times(1)).evaluateBadges(101L);
    }

    @Test
    void shouldSwallowAndLogExceptionsWithoutPropagating() {
        ActivityLoggedEvent event = new ActivityLoggedEvent(
                101L,
                555L,
                LocalDate.now(),
                new BigDecimal("18.000")
        );

        doThrow(new RuntimeException("Database error in badge engine"))
                .when(badgeService).evaluateBadges(101L);

        assertDoesNotThrow(() -> badgeEventListener.onActivityLogged(event));
        verify(badgeService, times(1)).evaluateBadges(101L);
    }
}
