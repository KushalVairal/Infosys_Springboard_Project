-- V19: Organisation visibility, lifecycle management, and lifetime creation restrictions
-- Also add scope support to user_achievement

-- 1. Add visibility, creator, and soft-delete fields to organisations
ALTER TABLE organisations
    ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    ADD COLUMN creator_user_id BIGINT NULL,
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN deleted_at TIMESTAMP NULL;

ALTER TABLE organisations
    ADD CONSTRAINT fk_organisations_creator
        FOREIGN KEY (creator_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL;

CREATE INDEX idx_organisations_visibility ON organisations (visibility, is_active);
CREATE INDEX idx_organisations_creator ON organisations (creator_user_id);

-- 2. Permanent tracking table to ensure a user can NEVER create more than ONE organisation in their lifetime
CREATE TABLE organisation_creations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    org_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_organisation_creations_user UNIQUE (user_id),
    CONSTRAINT fk_org_creations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_org_creations_org FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE
);

-- Backfill creator_user_id and organisation_creations for existing organisations
INSERT INTO organisation_creations (user_id, org_id, created_at)
SELECT u.id, u.org_id, CURRENT_TIMESTAMP
FROM users u
WHERE u.role IN ('ORG_ADMIN', 'ROLE_ORG_ADMIN') AND u.org_id IS NOT NULL
ON DUPLICATE KEY UPDATE org_id = VALUES(org_id);

UPDATE organisations o
JOIN users u ON u.org_id = o.id AND u.role IN ('ORG_ADMIN', 'ROLE_ORG_ADMIN')
SET o.creator_user_id = u.id
WHERE o.creator_user_id IS NULL;

-- 3. Add scope column to user_achievement to differentiate OVERALL and ORGANISATION rewards
ALTER TABLE user_achievement
    ADD COLUMN scope VARCHAR(30) NOT NULL DEFAULT 'OVERALL';

ALTER TABLE user_achievement
    DROP INDEX uq_user_achievement_period,
    ADD CONSTRAINT uq_user_achievement_period_scope UNIQUE (user_id, leaderboard_period, period_start_date, scope);

