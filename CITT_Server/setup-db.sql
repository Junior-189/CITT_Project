-- Create CITT database user
-- IMPORTANT: Change the password below before running in production!
-- Use a strong, unique password and store it in your .env file as DB_PASSWORD
CREATE USER citt_users WITH PASSWORD 'CHANGE_ME_BEFORE_PRODUCTION' CREATEDB;

-- Create CITT database
CREATE DATABASE citt_db OWNER citt_users;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE citt_db TO citt_users;
