-- Fix PostgreSQL permissions for citt_users
-- The citt_users user needs INSERT, UPDATE, SELECT permissions on the users table

-- Connect as postgres superuser and run these commands:

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO citt_users;

-- Grant table privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO citt_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO citt_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO citt_users;

-- Grant sequence privileges (for auto-increment IDs)
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE events_id_seq TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO citt_users;

-- Make these default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO citt_users;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO citt_users;
