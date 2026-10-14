
ALTER TABLE email_otp_verifications
    ADD COLUMN reset_token_hash VARCHAR(64) NULL,
    ADD COLUMN reset_token_expires_at TIMESTAMP NULL;
