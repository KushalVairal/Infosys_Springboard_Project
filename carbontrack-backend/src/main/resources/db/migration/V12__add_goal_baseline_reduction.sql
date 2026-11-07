
ALTER TABLE goals
    ADD COLUMN baseline_co2e_kg DECIMAL(12, 3) NULL,
    ADD COLUMN reduction_percentage DECIMAL(5, 2) NULL;
