-- V20: Add category and period to goals, and create recommendations table

-- 1. Extend goals table with category and period
ALTER TABLE goals
    ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'ALL',
    ADD COLUMN period VARCHAR(30) NOT NULL DEFAULT 'CUSTOM';

-- 2. Create recommendations table
CREATE TABLE recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    activity_type VARCHAR(80) NULL,
    title VARCHAR(200) NOT NULL,
    observation VARCHAR(500) NOT NULL,
    action_description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    difficulty VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    estimated_savings_kg DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    savings_assumptions VARCHAR(500) NULL,
    timeframe VARCHAR(50) NOT NULL DEFAULT '1 - 2 weeks',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    connected_goal_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_recommendations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_recommendations_goal FOREIGN KEY (connected_goal_id) REFERENCES goals(id) ON DELETE SET NULL,
    INDEX idx_recommendations_user_status (user_id, status),
    INDEX idx_recommendations_user_cat (user_id, category)
);

