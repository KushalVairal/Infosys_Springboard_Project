package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.chat.ChatRequestDTO;
import com.carbontrack.carbontrackbackend.dto.chat.ChatResponseDTO;
import com.carbontrack.carbontrackbackend.entity.ActivityLog;
import com.carbontrack.carbontrackbackend.entity.Goal;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.GoalRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import com.carbontrack.carbontrackbackend.service.GroqChatService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assistant")
public class ChatController {

    private final GroqChatService groqChatService;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final GoalRepository goalRepository;

    public ChatController(
            GroqChatService groqChatService,
            UserRepository userRepository,
            ActivityLogRepository activityLogRepository,
            GoalRepository goalRepository) {
        this.groqChatService = groqChatService;
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
        this.goalRepository = goalRepository;
    }

    @PostMapping("/chat")
    public ChatResponseDTO chat(
            Authentication authentication,
            @Valid @RequestBody ChatRequestDTO request) {

        String userContext = null;
        if (authentication != null && authentication.isAuthenticated() && authentication.getName() != null) {
            userContext = buildUserSustainabilityContext(authentication.getName());
        }

        return groqChatService.chat(request, userContext);
    }

    private String buildUserSustainabilityContext(String email) {
        if (userRepository == null || activityLogRepository == null || goalRepository == null) {
            return null;
        }

        User user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByUsername(email))
                .orElse(null);

        if (user == null) return null;

        LocalDate today = LocalDate.now();
        LocalDate start30Days = today.minusDays(29);

        List<ActivityLog> recentLogs =
                activityLogRepository.findActivitiesForWeeklyAggregation(user.getId(), start30Days, today);

        BigDecimal total30DayCo2e = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryEmissions = new HashMap<>();

        for (ActivityLog log : recentLogs) {
            BigDecimal co2 = log.getCo2eKg() != null ? log.getCo2eKg() : BigDecimal.ZERO;
            total30DayCo2e = total30DayCo2e.add(co2);
            String cat = log.getCategory() != null ? log.getCategory().toUpperCase() : "OTHER";
            categoryEmissions.merge(cat, co2, BigDecimal::add);
        }

        List<Goal> activeGoals = goalRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(g -> "ACTIVE".equalsIgnoreCase(g.getStatus()))
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("USER PROFILE & VERIFIED DATA (GROUND TRUTH):\n");
        sb.append("- Username: ").append(user.getUsername()).append("\n");
        sb.append("- Verified 30-Day Total Footprint: ").append(total30DayCo2e.setScale(2, java.math.RoundingMode.HALF_UP)).append(" kg CO2e (across ").append(recentLogs.size()).append(" activities)\n");
        sb.append("- Category Breakdown:\n");
        if (categoryEmissions.isEmpty()) {
            sb.append("  (No activities logged in the last 30 days. Advise the user to log activities to calibrate their baseline.)\n");
        } else {
            categoryEmissions.forEach((cat, sum) ->
                    sb.append("  * ").append(cat).append(": ").append(sum.setScale(2, java.math.RoundingMode.HALF_UP)).append(" kg CO2e\n"));
        }

        sb.append("- Active Goals:\n");
        if (activeGoals.isEmpty()) {
            sb.append("  (None currently active. You can guide the user to set a category goal.)\n");
        } else {
            for (Goal g : activeGoals) {
                sb.append("  * Goal: '").append(g.getTitle()).append("' [Category: ").append(g.getCategory()).append(", Period: ").append(g.getPeriod())
                        .append(", Target Limit: ").append(g.getTargetCo2eKg()).append(" kg CO2e, Window: ")
                        .append(g.getStartDate()).append(" to ").append(g.getEndDate()).append("]\n");
            }
        }

        return sb.toString();
    }
}
