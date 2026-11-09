
CREATE TABLE user_achievement (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    achievement_type VARCHAR(20) NOT NULL,
    leaderboard_period VARCHAR(20) NOT NULL,
    rank_at_claim INT NOT NULL,
    emissions_kg_at_claim DECIMAL(12,3) NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    claimed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_user_achievement_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_user_achievement_period
        UNIQUE (user_id, leaderboard_period, period_start_date)
);

