
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.activity.ActivityLogRequestDTO;
import com.carbontrack.carbontrackbackend.dto.activity.ActivityLogResponseDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.test.context.ActiveProfiles;

import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
class ActivityLogServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private EmissionCalculationService emissionCalculationService;

    @Mock
    private UserRepository userRepository;

    private ActivityLogService activityLogService;

    private User user;

    @BeforeEach
    void setUp() {
        activityLogService = new ActivityLogService(
                activityLogRepository,
                emissionCalculationService,
                userRepository
        );

        user = mock(User.class);
    }

    @Test
    void shouldSaveActivityWithCalculatedEmissions() {
        when(userRepository.findByEmail("carbonuser@example.com"))
                .thenReturn(Optional.of(user));


        LocalDate date = LocalDate.now().minusDays(1);

        ActivityLogRequestDTO request = new ActivityLogRequestDTO();
        request.setCategory("transport");
        request.setActivityType("car_petrol");
        request.setQuantity(new BigDecimal("12"));
        request.setUnit("km");
        request.setLogDate(date);

        when(emissionCalculationService.calculateEmissions(
                "CAR_PETROL",
                "km",
                new BigDecimal("12"),
                date
        )).thenReturn(new BigDecimal("2.160000"));

        when(activityLogRepository.save(any(ActivityLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ActivityLogResponseDTO response =
                activityLogService.createActivity(
                        "carbonuser@example.com", request);

        assertEquals("TRANSPORT", response.getCategory());
        assertEquals("CAR_PETROL", response.getActivityType());
        assertEquals(
                0,
                new BigDecimal("2.160000")
                        .compareTo(response.getCo2eKg())
        );

        ArgumentCaptor<ActivityLog> captor =
                ArgumentCaptor.forClass(ActivityLog.class);

        verify(activityLogRepository).save(captor.capture());

        ActivityLog savedActivity = captor.getValue();

        assertEquals(user, savedActivity.getUser());
        assertEquals("TRANSPORT", savedActivity.getCategory());
        assertEquals("CAR_PETROL", savedActivity.getActivityType());
        assertEquals(date, savedActivity.getLogDate());

        verify(emissionCalculationService).calculateEmissions(
                "CAR_PETROL", "km", new BigDecimal("12"), date);
    }

    @Test
    void shouldRejectInvalidCategory() {
        when(userRepository.findByEmail("carbonuser@example.com"))
                .thenReturn(Optional.of(user));

        ActivityLogRequestDTO request = new ActivityLogRequestDTO();
        request.setCategory("GAMING");
        request.setActivityType("CAR_PETROL");
        request.setQuantity(new BigDecimal("12"));
        request.setUnit("km");
        request.setLogDate(LocalDate.now().minusDays(1));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> activityLogService.createActivity(
                        "carbonuser@example.com", request)
        );

        assertEquals(400, exception.getStatusCode().value());

        verifyNoInteractions(emissionCalculationService);
        verify(activityLogRepository, never()).save(any(ActivityLog.class));
    }


    @Test
    void shouldRejectFutureActivityDate() {

        when(userRepository.findByEmail("carbonuser@example.com"))
                .thenReturn(Optional.of(user));

        ActivityLogRequestDTO request = new ActivityLogRequestDTO();
        request.setCategory("TRANSPORT");
        request.setActivityType("CAR_PETROL");
        request.setQuantity(new BigDecimal("12"));
        request.setUnit("km");
        request.setLogDate(LocalDate.now().plusDays(1));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> activityLogService.createActivity(
                        "carbonuser@example.com", request)
        );

        assertEquals(400, exception.getStatusCode().value());

        verifyNoInteractions(emissionCalculationService);
        verify(activityLogRepository, never()).save(any(ActivityLog.class));
    }

    @Test
    void shouldUpdateActivitySuccessfully() {
        // Setup user and activity
        when(user.getEmail()).thenReturn("carbonuser@example.com");
        ActivityLog existing = new ActivityLog();
        existing.setId(1L);
        existing.setUser(user);
        existing.setCategory("TRANSPORT");
        existing.setActivityType("CAR_PETROL");
        existing.setQuantity(new BigDecimal("5"));
        existing.setUnit("km");
        existing.setLogDate(LocalDate.now().minusDays(2));
        existing.setCo2eKg(new BigDecimal("1.0"));
        when(activityLogRepository.findById(1L)).thenReturn(Optional.of(existing));
        // New request data
        ActivityLogRequestDTO request = new ActivityLogRequestDTO();
        request.setCategory("transport");
        request.setActivityType("car_petrol");
        request.setQuantity(new BigDecimal("10"));
        request.setUnit("km");
        request.setLogDate(LocalDate.now().minusDays(1));
        // Mock emission calculation
        when(emissionCalculationService.calculateEmissions("CAR_PETROL", "km", new BigDecimal("10"), request.getLogDate()))
                .thenReturn(new BigDecimal("2.160000"));
        // Save returns the updated entity
        when(activityLogRepository.save(any(ActivityLog.class))).thenAnswer(inv -> inv.getArgument(0));
        ActivityLogResponseDTO resp = activityLogService.updateActivity("carbonuser@example.com", 1L, request);
        assertEquals("TRANSPORT", resp.getCategory());
        assertEquals("CAR_PETROL", resp.getActivityType());
        assertEquals(0, new BigDecimal("2.160000").compareTo(resp.getCo2eKg()));
        // Verify fields updated on entity
        verify(activityLogRepository).save(existing);
    }

    @Test
    void shouldRejectUpdateWhenActivityNotFound() {
        when(activityLogRepository.findById(99L)).thenReturn(Optional.empty());
        ActivityLogRequestDTO request = new ActivityLogRequestDTO();
        request.setCategory("transport");
        request.setActivityType("car_petrol");
        request.setQuantity(BigDecimal.ONE);
        request.setUnit("km");
        request.setLogDate(LocalDate.now());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> activityLogService.updateActivity("user@example.com", 99L, request));
        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void shouldRejectUpdateWhenUserNotOwner() {
        // activity belongs to another user
        User otherUser = mock(User.class);
        when(otherUser.getEmail()).thenReturn("other@example.com");
        ActivityLog existing = new ActivityLog();
        existing.setUser(otherUser);
        when(activityLogRepository.findById(2L)).thenReturn(Optional.of(existing));
        ActivityLogRequestDTO request = new ActivityLogRequestDTO();
        request.setCategory("transport");
        request.setActivityType("car_petrol");
        request.setQuantity(BigDecimal.ONE);
        request.setUnit("km");
        request.setLogDate(LocalDate.now());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> activityLogService.updateActivity("owner@example.com", 2L, request));
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void shouldDeleteActivitySuccessfully() {
        when(user.getEmail()).thenReturn("carbonuser@example.com");
        ActivityLog existing = new ActivityLog();
        existing.setUser(user);
        when(activityLogRepository.findById(3L)).thenReturn(Optional.of(existing));
        // No exception expected
        activityLogService.deleteActivity("carbonuser@example.com", 3L);
        verify(activityLogRepository).delete(existing);
    }

    @Test
    void shouldRejectDeleteWhenActivityNotFound() {
        when(activityLogRepository.findById(88L)).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> activityLogService.deleteActivity("user@example.com", 88L));
        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void shouldRejectDeleteWhenUserNotOwner() {
        User other = mock(User.class);
        when(other.getEmail()).thenReturn("other@example.com");
        ActivityLog existing = new ActivityLog();
        existing.setUser(other);
        when(activityLogRepository.findById(4L)).thenReturn(Optional.of(existing));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> activityLogService.deleteActivity("owner@example.com", 4L));
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void shouldPublishEventOnCreateActivity() {
        org.springframework.context.ApplicationEventPublisher publisher = mock(org.springframework.context.ApplicationEventPublisher.class);
        ActivityLogService serviceWithPublisher = new ActivityLogService(
                activityLogRepository,
                emissionCalculationService,
                userRepository,
                publisher
        );

        when(userRepository.findByEmail("carbonuser@example.com")).thenReturn(Optional.of(user));
        when(user.getId()).thenReturn(101L);

        LocalDate date = LocalDate.now().minusDays(1);
        ActivityLogRequestDTO request = new ActivityLogRequestDTO();
        request.setCategory("TRANSPORT");
        request.setActivityType("CAR_PETROL");
        request.setQuantity(new BigDecimal("10"));
        request.setUnit("km");
        request.setLogDate(date);

        when(emissionCalculationService.calculateEmissions(any(), any(), any(), any()))
                .thenReturn(new BigDecimal("1.800000"));

        when(activityLogRepository.save(any(ActivityLog.class))).thenAnswer(inv -> {
            ActivityLog a = inv.getArgument(0);
            org.springframework.test.util.ReflectionTestUtils.setField(a, "id", 999L);
            return a;
        });

        serviceWithPublisher.createActivity("carbonuser@example.com", request);

        verify(publisher, times(1)).publishEvent(any(com.carbontrack.carbontrackbackend.event.ActivityLoggedEvent.class));
    }
}


