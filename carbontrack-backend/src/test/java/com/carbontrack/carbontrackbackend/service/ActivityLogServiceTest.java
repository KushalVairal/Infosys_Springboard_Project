
package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.ActivityLogRequestDTO;
import com.carbontrack.carbontrackbackend.dto.ActivityLogResponseDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

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

}

