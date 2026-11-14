CREATE TABLE notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    recipient_user_id BIGINT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_entity_id BIGINT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_notifications_recipient
        FOREIGN KEY (recipient_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_notifications_recipient ON notifications (recipient_user_id, is_read, created_at);

CREATE TABLE user_notification_preferences (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    browser_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    invitation_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    badge_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    achievement_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    leaderboard_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_notification_prefs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE organisation_invitations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    org_id BIGINT NOT NULL,
    invited_by_user_id BIGINT NOT NULL,
    invitee_email VARCHAR(255) NOT NULL,
    invitee_user_id BIGINT NULL,
    token_hash VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_org_invitations_org
        FOREIGN KEY (org_id)
        REFERENCES organisations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_org_invitations_sender
        FOREIGN KEY (invited_by_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_org_invitations_invitee
        FOREIGN KEY (invitee_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_org_invitations_org ON organisation_invitations (org_id, status);
CREATE INDEX idx_org_invitations_email ON organisation_invitations (invitee_email, status);
CREATE INDEX idx_org_invitations_token ON organisation_invitations (token_hash);

