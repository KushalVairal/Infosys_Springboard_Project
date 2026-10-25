-- CarbonTrack spend-based shopping emission factors (INR and USD)
-- Derived from frontend category definitions (categories.js):
-- CLOTHING: 0.005 kg CO2e / INR, and 0.415 kg CO2e / USD (fixed project rate: 83 INR/USD)
-- ELECTRONICS: 0.020 kg CO2e / INR, and 1.660 kg CO2e / USD (fixed project rate: 83 INR/USD)
-- GROCERIES: 0.002 kg CO2e / INR, and 0.166 kg CO2e / USD (fixed project rate: 83 INR/USD)

INSERT IGNORE INTO emission_factors
(activity_type, unit, kg_co2e_per_unit, source, effective_date)
VALUES
    ('CLOTHING', 'inr', 0.005000,
     'Spend-based emission factor (0.005 kg CO2e / INR)', '2026-01-01'),
    ('CLOTHING', 'usd', 0.415000,
     'Spend-based emission factor (0.415 kg CO2e / USD @ 83 INR/USD)', '2026-01-01'),
    ('ELECTRONICS', 'inr', 0.020000,
     'Spend-based emission factor (0.020 kg CO2e / INR)', '2026-01-01'),
    ('ELECTRONICS', 'usd', 1.660000,
     'Spend-based emission factor (1.660 kg CO2e / USD @ 83 INR/USD)', '2026-01-01'),
    ('GROCERIES', 'inr', 0.002000,
     'Spend-based emission factor (0.002 kg CO2e / INR)', '2026-01-01'),
    ('GROCERIES', 'usd', 0.166000,
     'Spend-based emission factor (0.166 kg CO2e / USD @ 83 INR/USD)', '2026-01-01');
