
CREATE TABLE users (
                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                       username VARCHAR(50) NOT NULL UNIQUE,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       role VARCHAR(30) NOT NULL DEFAULT 'USER',
                       org_id BIGINT,
                       preferred_unit VARCHAR(20) NOT NULL DEFAULT 'KG_CO2E',
                       goal_visibility BOOLEAN NOT NULL DEFAULT TRUE,
                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,

                       CONSTRAINT fk_users_organisation
                           FOREIGN KEY (org_id)
                               REFERENCES organisations(id)
);
