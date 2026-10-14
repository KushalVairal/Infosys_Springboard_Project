
CREATE TABLE goals (
                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                       user_id BIGINT NOT NULL,
                       title VARCHAR(150) NOT NULL,
                       description VARCHAR(500),
                       target_co2e_kg DECIMAL(14, 3) NOT NULL,
                       start_date DATE NOT NULL,
                       end_date DATE NOT NULL,
                       status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                       CONSTRAINT fk_goals_user
                           FOREIGN KEY (user_id)
                               REFERENCES users(id),

                       CONSTRAINT chk_goal_target
                           CHECK (target_co2e_kg >= 0),

                       CONSTRAINT chk_goal_dates
                           CHECK (end_date >= start_date)
);
