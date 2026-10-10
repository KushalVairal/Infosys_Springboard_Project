ALTER TABLE emission_factors
    ADD COLUMN category VARCHAR(20) NULL;

UPDATE emission_factors
SET category = CASE
    WHEN activity_type IN ('Bus', 'Car', 'Train', 'Flight', 'Motorcycle')
        THEN 'TRANSPORT'
    ELSE 'SHOPPING'
END
WHERE category IS NULL;

ALTER TABLE emission_factors
    MODIFY COLUMN category VARCHAR(20) NOT NULL;
