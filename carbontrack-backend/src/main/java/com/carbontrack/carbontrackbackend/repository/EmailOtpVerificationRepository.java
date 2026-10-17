
package com.carbontrack.carbontrackbackend.repository;

import com.carbontrack.carbontrackbackend.entity.EmailOtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailOtpVerificationRepository
        extends JpaRepository<EmailOtpVerification, Long> {

    List<EmailOtpVerification>
    findByUserIdAndConsumedAtIsNull(Long userId);

    Optional<EmailOtpVerification>
    findTopByUserIdAndConsumedAtIsNullOrderByCreatedAtDesc(
            Long userId);

    Optional<EmailOtpVerification>
    findByResetTokenHashAndConsumedAtIsNull(String resetTokenHash);
}
