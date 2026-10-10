
ALTER TABLE users
    ADD COLUMN leaderboard_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
    CHANGE COLUMN preferred_unit preferred_units VARCHAR(20) NOT NULL DEFAULT 'KG_CO2E';