
CREATE TABLE goal_alerts (
                             id BIGINT NOT NULL AUTO_INCREMENT,
                             goal_id BIGINT NOT NULL,
                             alert_type VARCHAR(30) NOT NULL,
                             message VARCHAR(1000) NOT NULL,
                             created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                             CONSTRAINT pk_goal_alerts PRIMARY KEY (id),

                             CONSTRAINT uk_goal_alert_type
                                 UNIQUE (goal_id, alert_type),

                             CONSTRAINT fk_goal_alerts_goal
                                 FOREIGN KEY (goal_id)
                                     REFERENCES goals(id)
);
