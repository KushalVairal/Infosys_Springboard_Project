package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.ActivityResponse;
import com.carbontrack.carbontrackbackend.dto.CreateActivityRequest;
import com.carbontrack.carbontrackbackend.entity.Category;
import com.carbontrack.carbontrackbackend.service.ActivityService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping
    public ResponseEntity<ActivityResponse> createActivity(
            @Valid @RequestBody CreateActivityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(activityService.createActivity(request));
    }

    @GetMapping
    public ResponseEntity<Page<ActivityResponse>> getActivities(
            @RequestParam(required = false) Category category,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "logDate"));
        return ResponseEntity.ok(activityService.getActivities(category, from, to, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityResponse> getActivityById(@PathVariable Long id) {
        return ResponseEntity.ok(activityService.getActivityById(id));
    }
}