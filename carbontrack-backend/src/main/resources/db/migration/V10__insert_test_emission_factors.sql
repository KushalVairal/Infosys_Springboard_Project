
-- CarbonTrack development test emission factors.
-- Illustrative values only; verify factors before production.

INSERT IGNORE INTO emission_factors
(activity_type, unit, kg_co2e_per_unit, source, effective_date)
VALUES
    ('CAR_PETROL', 'km', 0.18,
     'TEST DATA - replace with verified source', '2026-01-01'),
    ('CAR_DIESEL', 'km', 0.20,
     'TEST DATA - replace with verified source', '2026-01-01'),
    ('CAR_ELECTRIC', 'km', 0.05,
     'TEST DATA - replace with verified source', '2026-01-01'),
    ('MOTORCYCLE_PETROL', 'km', 0.05,
     'TEST DATA - replace with verified source', '2026-01-01'),
    ('BUS', 'km', 0.08,
     'TEST DATA - replace with verified source', '2026-01-01'),
    ('TRAIN', 'km', 0.04,
     'TEST DATA - replace with verified source', '2026-01-01'),
    ('FLIGHT', 'km', 0.15,
     'TEST DATA - replace with verified source', '2026-01-01'),
    ('BICYCLE', 'km', 0.00,
     'TEST DATA - direct operational emissions', '2026-01-01'),
    ('WALKING', 'km', 0.00,
     'TEST DATA - direct operational emissions', '2026-01-01'),
    ('ELECTRICITY', 'kWh', 0.70,
     'TEST DATA - replace with suitable grid factor', '2026-01-01'),
    ('FOOD_VEGETARIAN', 'serving', 0.80,
     'TEST DATA - verify lifecycle factor', '2026-01-01'),
    ('FOOD_NON_VEGETARIAN', 'serving', 2.50,
     'TEST DATA - verify lifecycle factor', '2026-01-01'),
    ('FOOD_BEEF', 'serving', 5.00,
     'TEST DATA - verify lifecycle factor', '2026-01-01'),
    ('CLOTHING', 'item', 10.00,
     'TEST DATA - verify lifecycle factor', '2026-01-01'),
    ('ELECTRONICS', 'item', 50.00,
     'TEST DATA - verify lifecycle factor', '2026-01-01'),
    ('LPG', 'kg', 3.00,
     'TEST DATA - verify fuel factor', '2026-01-01'),
    ('WASTE', 'kg', 0.50,
     'TEST DATA - verify waste treatment factor', '2026-01-01');
