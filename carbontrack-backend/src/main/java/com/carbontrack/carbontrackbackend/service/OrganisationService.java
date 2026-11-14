package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.organisation.*;
import com.carbontrack.carbontrackbackend.entity.Organisation;
import com.carbontrack.carbontrackbackend.entity.OrganisationCreation;
import com.carbontrack.carbontrackbackend.entity.OrganisationInvitation;
import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.ActivityLogRepository;
import com.carbontrack.carbontrackbackend.repository.OrganisationCreationRepository;
import com.carbontrack.carbontrackbackend.repository.OrganisationInvitationRepository;
import com.carbontrack.carbontrackbackend.repository.OrganisationRepository;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;

@Service
public class OrganisationService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final OrganisationRepository organisationRepository;
    private final OrganisationCreationRepository organisationCreationRepository;
    private final NotificationService notificationService;
    private final OrganisationInvitationRepository invitationRepository;

    public OrganisationService(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository,
            OrganisationRepository organisationRepository) {
        this(activityLogRepository, userRepository, organisationRepository, null, null, null);
    }

    @Autowired
    public OrganisationService(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository,
            OrganisationRepository organisationRepository,
            OrganisationCreationRepository organisationCreationRepository,
            NotificationService notificationService,
            OrganisationInvitationRepository invitationRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.organisationRepository = organisationRepository;
        this.organisationCreationRepository = organisationCreationRepository;
        this.notificationService = notificationService;
        this.invitationRepository = invitationRepository;
    }

    public User resolveAndValidateAdmin(String authenticatedName) {
        if (authenticatedName == null || authenticatedName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        User user = userRepository.findByEmail(authenticatedName)
                .or(() -> userRepository.findByUsername(authenticatedName))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user was not found"
                ));

        String role = user.getRole();
        if (role == null || (!role.equalsIgnoreCase("ORG_ADMIN") && !role.equalsIgnoreCase("ROLE_ORG_ADMIN"))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Access denied: Only organisation admins can access this dashboard"
            );
        }

        if (user.getOrganisation() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Access denied: User does not belong to any organisation"
            );
        }

        return user;
    }

    @Transactional
    public OrganisationDetailsDTO createOrganisation(String userEmail, CreateOrganisationRequestDTO request) {
        User user = getUser(userEmail);

        if (user.getOrganisation() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You are already a member of an organisation (" + user.getOrganisation().getName() + ")."
            );
        }

        if (organisationCreationRepository != null && organisationCreationRepository.existsByUserId(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You have already created an organisation in your lifetime. Each user can create a maximum of one organisation."
            );
        }

        String orgName = request.name().trim();
        if (organisationRepository.existsByNameIgnoreCaseAndIsActiveTrue(orgName)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An active organisation with this name already exists."
            );
        }

        Organisation org = new Organisation(
                orgName,
                request.description() != null ? request.description().trim() : null,
                request.visibility(),
                user
        );

        org = organisationRepository.save(org);

        if (organisationCreationRepository != null) {
            organisationCreationRepository.save(new OrganisationCreation(user, org));
        }

        user.setOrganisation(org);
        user.setRole("ORG_ADMIN");
        userRepository.save(user);

        if (notificationService != null) {
            notificationService.createNotification(
                    user,
                    "ORGANISATION_UPDATE",
                    "Organisation Created: " + org.getName(),
                    "You have successfully created " + org.getName() + " and are now its administrator.",
                    org.getId()
            );
        }

        return toDetailsDTO(org, user, 1L);
    }

    @Transactional(readOnly = true)
    public OrganisationDetailsDTO getOrganisationDetails(String userEmail) {
        User user = getUser(userEmail);
        Organisation org = user.getOrganisation();

        if (org == null || !org.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "You do not belong to any active organisation."
            );
        }

        long memberCount = userRepository.countByOrganisationId(org.getId());
        return toDetailsDTO(org, user, memberCount);
    }

    @Transactional
    public OrganisationDetailsDTO updateOrganisationDetails(String adminEmail, UpdateOrganisationRequestDTO request) {
        User admin = resolveAndValidateAdmin(adminEmail);
        Organisation org = admin.getOrganisation();

        String newName = request.name().trim();
        if (organisationRepository.existsByNameIgnoreCaseAndIdNotAndIsActiveTrue(newName, org.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An active organisation with this name already exists."
            );
        }

        org.setName(newName);
        org.setDescription(request.description() != null ? request.description().trim() : null);
        org.setVisibility(request.visibility());
        org = organisationRepository.save(org);

        long memberCount = userRepository.countByOrganisationId(org.getId());
        return toDetailsDTO(org, admin, memberCount);
    }

    @Transactional(readOnly = true)
    public List<PublicOrganisationDTO> getPublicOrganisations(String userEmail) {
        List<Organisation> list = organisationRepository.findByVisibilityAndIsActiveTrueOrderByCreatedAtDesc("PUBLIC");

        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : organisationRepository.countMembersPerActiveOrganisation()) {
            Long orgId = (Long) row[0];
            Long cnt = ((Number) row[1]).longValue();
            counts.put(orgId, cnt);
        }

        return list.stream()
                .map(org -> new PublicOrganisationDTO(
                        org.getId(),
                        org.getName(),
                        org.getDescription(),
                        org.getCreator() != null ? org.getCreator().getUsername() : "Admin",
                        counts.getOrDefault(org.getId(), 0L),
                        org.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public OrganisationDetailsDTO joinPublicOrganisation(String userEmail, Long orgId) {
        User user = getUser(userEmail);

        if (user.getOrganisation() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You are already a member of an organisation (" + user.getOrganisation().getName() + "). You must leave your current organisation before joining another."
            );
        }

        Organisation org = organisationRepository.findByIdAndIsActiveTrue(orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organisation not found or inactive"));

        if (!"PUBLIC".equalsIgnoreCase(org.getVisibility())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This organisation is private and can only be joined via an invitation."
            );
        }

        user.setOrganisation(org);
        user.setRole("USER");
        userRepository.save(user);

        if (notificationService != null) {
            notificationService.createNotification(
                    user,
                    "ORGANISATION_UPDATE",
                    "Joined " + org.getName(),
                    "You have successfully joined " + org.getName() + " as a member.",
                    org.getId()
            );

            if (org.getCreator() != null && !org.getCreator().getId().equals(user.getId())) {
                notificationService.createNotification(
                        org.getCreator(),
                        "ORGANISATION_UPDATE",
                        "New Member Joined",
                        user.getUsername() + " has joined " + org.getName() + ".",
                        org.getId()
                );
            }
        }

        long memberCount = userRepository.countByOrganisationId(org.getId());
        return toDetailsDTO(org, user, memberCount);
    }

    @Transactional
    public void leaveOrganisation(String userEmail) {
        User user = getUser(userEmail);
        Organisation org = user.getOrganisation();

        if (org == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You do not belong to any organisation."
            );
        }

        boolean isAdmin = "ORG_ADMIN".equalsIgnoreCase(user.getRole()) || "ROLE_ORG_ADMIN".equalsIgnoreCase(user.getRole());
        List<User> members = userRepository.findByOrganisationId(org.getId());

        if (isAdmin) {
            long otherAdmins = members.stream()
                    .filter(m -> !m.getId().equals(user.getId()) &&
                            ("ORG_ADMIN".equalsIgnoreCase(m.getRole()) || "ROLE_ORG_ADMIN".equalsIgnoreCase(m.getRole())))
                    .count();

            if (members.size() > 1 && otherAdmins == 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "As the sole administrator, you cannot leave the organisation without first transferring ownership to another member."
                );
            }
        }

        user.setOrganisation(null);
        if (isAdmin) {
            user.setRole("USER");
        }
        userRepository.save(user);

        if (notificationService != null) {
            notificationService.createNotification(
                    user,
                    "ORGANISATION_UPDATE",
                    "Left " + org.getName(),
                    "You have successfully left " + org.getName() + ".",
                    null
            );

            if (org.getCreator() != null && !org.getCreator().getId().equals(user.getId())) {
                notificationService.createNotification(
                        org.getCreator(),
                        "ORGANISATION_UPDATE",
                        "Member Left",
                        user.getUsername() + " has left " + org.getName() + ".",
                        org.getId()
                );
            }
        }
    }

    @Transactional
    public OrganisationDetailsDTO transferOwnership(String adminEmail, Long newOwnerUserId) {
        User currentAdmin = resolveAndValidateAdmin(adminEmail);
        Organisation org = currentAdmin.getOrganisation();

        User newAdmin = userRepository.findById(newOwnerUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target member not found"));

        if (newAdmin.getOrganisation() == null || !newAdmin.getOrganisation().getId().equals(org.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Target user is not a member of your organisation."
            );
        }

        if (newAdmin.getId().equals(currentAdmin.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You are already the administrator of this organisation."
            );
        }

        newAdmin.setRole("ORG_ADMIN");
        currentAdmin.setRole("USER");
        org.setCreator(newAdmin);

        userRepository.save(newAdmin);
        userRepository.save(currentAdmin);
        organisationRepository.save(org);

        if (notificationService != null) {
            notificationService.createNotification(
                    newAdmin,
                    "ORGANISATION_UPDATE",
                    "Ownership Transferred",
                    currentAdmin.getUsername() + " transferred administration of " + org.getName() + " to you.",
                    org.getId()
            );

            notificationService.createNotification(
                    currentAdmin,
                    "ORGANISATION_UPDATE",
                    "Ownership Transferred",
                    "You transferred administration of " + org.getName() + " to " + newAdmin.getUsername() + ".",
                    org.getId()
            );
        }

        long memberCount = userRepository.countByOrganisationId(org.getId());
        return toDetailsDTO(org, currentAdmin, memberCount);
    }

    @Transactional
    public void deleteOrganisation(String adminEmail) {
        User admin = resolveAndValidateAdmin(adminEmail);
        Organisation org = admin.getOrganisation();

        org.setActive(false);
        org.setDeletedAt(LocalDateTime.now());
        organisationRepository.save(org);

        if (invitationRepository != null) {
            List<OrganisationInvitation> invites = invitationRepository.findByOrganisationIdOrderByCreatedAtDesc(org.getId());
            for (OrganisationInvitation inv : invites) {
                if ("PENDING".equalsIgnoreCase(inv.getStatus())) {
                    inv.setStatus("CANCELLED");
                    inv.setRespondedAt(LocalDateTime.now());
                    invitationRepository.save(inv);
                }
            }
        }

        List<User> members = userRepository.findByOrganisationId(org.getId());
        for (User member : members) {
            member.setOrganisation(null);
            if ("ORG_ADMIN".equalsIgnoreCase(member.getRole()) || "ROLE_ORG_ADMIN".equalsIgnoreCase(member.getRole())) {
                member.setRole("USER");
            }
            userRepository.save(member);

            if (notificationService != null) {
                notificationService.createNotification(
                        member,
                        "ORGANISATION_UPDATE",
                        "Organisation Closed",
                        "The organisation " + org.getName() + " has been closed by its administrator.",
                        null
                );
            }
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .or(() -> userRepository.findByUsername(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private OrganisationDetailsDTO toDetailsDTO(Organisation org, User currentUser, long memberCount) {
        boolean isCreator = org.getCreator() != null && org.getCreator().getId().equals(currentUser.getId());
        boolean isAdmin = "ORG_ADMIN".equalsIgnoreCase(currentUser.getRole()) || "ROLE_ORG_ADMIN".equalsIgnoreCase(currentUser.getRole());
        return new OrganisationDetailsDTO(
                org.getId(),
                org.getName(),
                org.getDescription(),
                org.getVisibility(),
                org.getCreator() != null ? org.getCreator().getId() : null,
                org.getCreator() != null ? org.getCreator().getUsername() : "Admin",
                isCreator,
                isAdmin,
                memberCount,
                org.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public OrganisationSummaryDTO getSummary(
            String authenticatedName,
            LocalDate startDate,
            LocalDate endDate) {
        return getSummary(authenticatedName, startDate, endDate, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public OrganisationSummaryDTO getSummary(
            String authenticatedName,
            LocalDate startDate,
            LocalDate endDate,
            LocalDate asOfDate) {

        User admin = resolveAndValidateAdmin(authenticatedName);
        Organisation org = admin.getOrganisation();
        Long orgId = org.getId();

        LocalDate today = asOfDate != null ? asOfDate : LocalDate.now();
        DateRange range = resolveDateRange(startDate, endDate, today);

        BigDecimal totalCo2eKg = scale(
                activityLogRepository.sumCo2eKgByOrganisationIdAndLogDateBetween(
                        orgId, range.startDate(), range.endDate()
                )
        );

        long activeEmployees = activityLogRepository
                .countDistinctActiveEmployeesByOrganisationIdBetween(
                        orgId, range.startDate(), range.endDate()
                );

        long totalEmployees = userRepository.countByOrganisationId(orgId);

        long totalActivities = activityLogRepository
                .countActivitiesByOrganisationIdBetween(
                        orgId, range.startDate(), range.endDate()
                );

        // Current calendar month emissions up to asOfDate
        YearMonth currentYm = YearMonth.from(today);
        LocalDate currentMonthStart = currentYm.atDay(1);
        LocalDate currentMonthEnd = today;

        BigDecimal currentMonthCo2e = scale(
                activityLogRepository.sumCo2eKgByOrganisationIdAndLogDateBetween(
                        orgId, currentMonthStart, currentMonthEnd
                )
        );

        // Previous calendar month emissions
        YearMonth prevYm = currentYm.minusMonths(1);
        LocalDate prevMonthStart = prevYm.atDay(1);
        LocalDate prevMonthEnd = prevYm.atEndOfMonth();

        BigDecimal prevMonthCo2e = scale(
                activityLogRepository.sumCo2eKgByOrganisationIdAndLogDateBetween(
                        orgId, prevMonthStart, prevMonthEnd
                )
        );

        BigDecimal momChange = calculatePercentageChange(currentMonthCo2e, prevMonthCo2e);

        return new OrganisationSummaryDTO(
                orgId,
                org.getName(),
                range.startDate(),
                range.endDate(),
                totalCo2eKg,
                activeEmployees,
                totalEmployees,
                totalActivities,
                currentMonthCo2e,
                prevMonthCo2e,
                momChange
        );
    }

    @Transactional(readOnly = true)
    public List<OrganisationCategoryDTO> getCategories(
            String authenticatedName,
            LocalDate startDate,
            LocalDate endDate) {

        User admin = resolveAndValidateAdmin(authenticatedName);
        Long orgId = admin.getOrganisation().getId();
        DateRange range = resolveDateRange(startDate, endDate, LocalDate.now());

        BigDecimal totalOrgEmissions = scale(
                activityLogRepository.sumCo2eKgByOrganisationIdAndLogDateBetween(
                        orgId, range.startDate(), range.endDate()
                )
        );

        List<OrganisationCategoryAggregateDTO> rows = activityLogRepository
                .findOrganisationCategoryTotalsBetween(orgId, range.startDate(), range.endDate());

        List<OrganisationCategoryDTO> result = new ArrayList<>();
        for (OrganisationCategoryAggregateDTO r : rows) {
            String category = r.category();
            BigDecimal sumCo2e = scale(r.totalCo2eKg());
            long activityCount = r.activityCount();

            BigDecimal pct = BigDecimal.ZERO;
            if (totalOrgEmissions.compareTo(BigDecimal.ZERO) > 0) {
                pct = sumCo2e.multiply(BigDecimal.valueOf(100))
                        .divide(totalOrgEmissions, 2, RoundingMode.HALF_UP);
            }

            result.add(new OrganisationCategoryDTO(
                    category,
                    sumCo2e,
                    pct,
                    activityCount
            ));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<OrganisationTrendDTO> getMonthlyTrends(String authenticatedName) {
        return getMonthlyTrends(authenticatedName, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<OrganisationTrendDTO> getMonthlyTrends(String authenticatedName, LocalDate asOfDate) {
        User admin = resolveAndValidateAdmin(authenticatedName);
        Long orgId = admin.getOrganisation().getId();

        LocalDate today = asOfDate != null ? asOfDate : LocalDate.now();
        YearMonth endYm = YearMonth.from(today);
        YearMonth startYm = endYm.minusMonths(5);

        LocalDate startDate = startYm.atDay(1);
        LocalDate endDate = today;

        List<OrganisationMonthlyAggregateDTO> rawAggs = activityLogRepository
                .findOrganisationMonthlyTotalsBetween(orgId, startDate, endDate);

        Map<YearMonth, MonthAggregate> aggsMap = new HashMap<>();
        for (OrganisationMonthlyAggregateDTO r : rawAggs) {
            aggsMap.put(YearMonth.of(r.year(), r.month()), new MonthAggregate(scale(r.totalCo2eKg()), r.activeEmployees(), r.totalActivities()));
        }

        List<OrganisationTrendDTO> trends = new ArrayList<>();
        BigDecimal previousMonthEmissions = null;

        YearMonth priorToWindowYm = startYm.minusMonths(1);
        LocalDate priorStart = priorToWindowYm.atDay(1);
        LocalDate priorEnd = priorToWindowYm.atEndOfMonth();
        BigDecimal priorSum = scale(
                activityLogRepository.sumCo2eKgByOrganisationIdAndLogDateBetween(orgId, priorStart, priorEnd)
        );
        previousMonthEmissions = priorSum;

        for (int i = 0; i < 6; i++) {
            YearMonth ym = startYm.plusMonths(i);
            MonthAggregate agg = aggsMap.getOrDefault(ym, new MonthAggregate(BigDecimal.ZERO, 0L, 0L));

            BigDecimal momChange = calculatePercentageChange(agg.sumCo2eKg, previousMonthEmissions);
            previousMonthEmissions = agg.sumCo2eKg;

            String label = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + ym.getYear();

            trends.add(new OrganisationTrendDTO(
                    ym.getYear(),
                    ym.getMonthValue(),
                    label,
                    agg.sumCo2eKg,
                    agg.activeEmployees,
                    agg.totalActivities,
                    momChange
            ));
        }

        return trends;
    }

    private record MonthAggregate(BigDecimal sumCo2eKg, long activeEmployees, long totalActivities) {}

    @Transactional(readOnly = true)
    public List<OrganisationEmployeeDTO> getEmployees(
            String authenticatedName,
            LocalDate startDate,
            LocalDate endDate) {

        User admin = resolveAndValidateAdmin(authenticatedName);
        Long orgId = admin.getOrganisation().getId();
        DateRange range = resolveDateRange(startDate, endDate, LocalDate.now());

        BigDecimal totalOrgEmissions = scale(
                activityLogRepository.sumCo2eKgByOrganisationIdAndLogDateBetween(
                        orgId, range.startDate(), range.endDate()
                )
        );

        List<OrganisationEmployeeAggregateDTO> rows = activityLogRepository
                .findOrganisationEmployeeTotalsBetween(orgId, range.startDate(), range.endDate());

        List<User> allOrgMembers = userRepository.findByOrganisationId(orgId);
        Map<Long, User> memberMap = new HashMap<>();
        for (User u : allOrgMembers) {
            memberMap.put(u.getId(), u);
        }

        Map<Long, OrganisationEmployeeAggregateDTO> aggMap = new HashMap<>();
        for (OrganisationEmployeeAggregateDTO agg : rows) {
            aggMap.put(agg.userId(), agg);
        }

        List<OrganisationEmployeeDTO> results = new ArrayList<>();
        int rank = 1;

        // Process active members in descending order of emissions
        for (OrganisationEmployeeAggregateDTO r : rows) {
            String username = r.username();
            String fullName = r.fullName();
            BigDecimal sumCo2e = scale(r.totalCo2eKg());
            long totalActivities = r.totalActivities();

            BigDecimal pct = BigDecimal.ZERO;
            if (totalOrgEmissions.compareTo(BigDecimal.ZERO) > 0) {
                pct = sumCo2e.multiply(BigDecimal.valueOf(100))
                        .divide(totalOrgEmissions, 2, RoundingMode.HALF_UP);
            }

            String displayName = (fullName != null && !fullName.isBlank()) ? fullName : username;
            User u = memberMap.get(r.userId());
            String avatarSeed = (u != null) ? u.getAvatarSeed() : null;
            String profileImageUrl = (u != null) ? u.getProfileImageUrl() : null;

            results.add(new OrganisationEmployeeDTO(
                    rank++,
                    username,
                    displayName,
                    sumCo2e,
                    totalActivities,
                    pct,
                    avatarSeed,
                    profileImageUrl
            ));
        }

        // Add inactive members (0 activities in the period)
        for (User member : allOrgMembers) {
            if (!aggMap.containsKey(member.getId())) {
                String displayName = (member.getFullName() != null && !member.getFullName().isBlank())
                        ? member.getFullName()
                        : member.getUsername();

                results.add(new OrganisationEmployeeDTO(
                        rank++,
                        member.getUsername(),
                        displayName,
                        BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP),
                        0L,
                        BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                        member.getAvatarSeed(),
                        member.getProfileImageUrl()
                ));
            }
        }

        return results;
    }

    public static BigDecimal calculatePercentageChange(BigDecimal current, BigDecimal previous) {
        if (current == null) current = BigDecimal.ZERO;
        if (previous == null) previous = BigDecimal.ZERO;

        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            if (current.compareTo(BigDecimal.ZERO) == 0) {
                return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            } else {
                return BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);
            }
        }

        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal scale(BigDecimal val) {
        return (val != null ? val : BigDecimal.ZERO).setScale(3, RoundingMode.HALF_UP);
    }

    private record DateRange(LocalDate startDate, LocalDate endDate) {}

    private DateRange resolveDateRange(LocalDate startDate, LocalDate endDate, LocalDate asOfDate) {
        LocalDate today = asOfDate != null ? asOfDate : LocalDate.now();

        LocalDate resolvedStart = startDate != null
                ? startDate
                : YearMonth.from(today).atDay(1);

        LocalDate resolvedEnd = endDate != null
                ? endDate
                : today;

        LocalDate queryEndDate = resolvedEnd.isAfter(today) ? today : resolvedEnd;

        if (resolvedStart.isAfter(queryEndDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "startDate cannot be after endDate"
            );
        }

        return new DateRange(resolvedStart, queryEndDate);
    }
}
