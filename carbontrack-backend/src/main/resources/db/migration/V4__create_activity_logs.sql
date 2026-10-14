
CREATE TABLE activity_logs (
                               id BIGINT AUTO_INCREMENT PRIMARY KEY,
                               user_id BIGINT NOT NULL,
                               category VARCHAR(30) NOT NULL,
                               activity_type VARCHAR(80) NOT NULL,
                               quantity DECIMAL(12, 3) NOT NULL,
                               unit VARCHAR(30) NOT NULL,
                               co2e_kg DECIMAL(14, 6) NOT NULL,
                               log_date DATE NOT NULL,
                               created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                               CONSTRAINT fk_activity_logs_user
                                   FOREIGN KEY (user_id)
                                       REFERENCES users(id),

                               CONSTRAINT chk_activity_quantity
                                   CHECK (quantity >= 0),

                               CONSTRAINT chk_activity_emissions
                                   CHECK (co2e_kg >= 0),

                               INDEX idx_activity_user_date (user_id, log_date),
                               INDEX idx_activity_type (activity_type)
);
