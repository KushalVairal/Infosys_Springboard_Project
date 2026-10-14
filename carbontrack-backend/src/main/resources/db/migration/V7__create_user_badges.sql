
CREATE TABLE user_badges (
                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                             user_id BIGINT NOT NULL,
                             badge_id BIGINT NOT NULL,
                             awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                             CONSTRAINT fk_user_badges_user
                                 FOREIGN KEY (user_id)
                                     REFERENCES users(id),

                             CONSTRAINT fk_user_badges_badge
                                 FOREIGN KEY (badge_id)
                                     REFERENCES badges(id),

                             CONSTRAINT uq_user_badge
                                 UNIQUE (user_id, badge_id)
);
