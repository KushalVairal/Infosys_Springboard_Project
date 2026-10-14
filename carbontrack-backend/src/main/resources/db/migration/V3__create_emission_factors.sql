
CREATE TABLE emission_factors (
                                  id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                  activity_type VARCHAR(80) NOT NULL,
                                  unit VARCHAR(30) NOT NULL,
                                  kg_co2e_per_unit DECIMAL(12, 6) NOT NULL,
                                  source VARCHAR(500) NOT NULL,
                                  effective_date DATE NOT NULL,
                                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                  CONSTRAINT chk_emission_factor_nonnegative
                                      CHECK (kg_co2e_per_unit >= 0),

                                  CONSTRAINT uq_emission_factor_type_unit_date
                                      UNIQUE (activity_type, unit, effective_date)
);
