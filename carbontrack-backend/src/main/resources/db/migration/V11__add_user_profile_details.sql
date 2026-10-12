
ALTER TABLE users
    ADD COLUMN full_name VARCHAR(100) NULL,
    ADD COLUMN phone_number VARCHAR(25) NULL,
    ADD COLUMN location VARCHAR(150) NULL,
    ADD COLUMN profile_image_url VARCHAR(2048) NULL;
