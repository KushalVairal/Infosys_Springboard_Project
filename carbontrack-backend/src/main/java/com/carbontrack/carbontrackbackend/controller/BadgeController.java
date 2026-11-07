package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.badge.UserBadgeResponseDTO;
import com.carbontrack.carbontrackbackend.service.BadgeService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    private final BadgeService badgeService;

    public BadgeController(BadgeService badgeService) {
        this.badgeService = badgeService;
    }

    @GetMapping("/me")
    public List<UserBadgeResponseDTO> getMyBadges(Authentication authentication) {
        return badgeService.getMyBadges(authentication.getName());
    }
}
