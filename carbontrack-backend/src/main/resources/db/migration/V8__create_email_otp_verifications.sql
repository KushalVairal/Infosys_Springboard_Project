
CREATE TABLE email_otp_verifications (
                                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                         user_id BIGINT NOT NULL,
                                         otp_hash VARCHAR(255) NOT NULL,
                                         expires_at TIMESTAMP NOT NULL,
                                         attempts INT NOT NULL DEFAULT 0,
                                         verified_at TIMESTAMP NULL,
                                         consumed_at TIMESTAMP NULL,
                                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                         CONSTRAINT fk_email_otp_user
                                             FOREIGN KEY (user_id) REFERENCES users(id),

                                         INDEX idx_email_otp_user (user_id),
                                         INDEX idx_email_otp_expiry (expires_at)
);
