
CREATE TABLE organisations (
                               id BIGINT AUTO_INCREMENT PRIMARY KEY,
                               name VARCHAR(150) NOT NULL UNIQUE,
                               description VARCHAR(500),
                               created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
