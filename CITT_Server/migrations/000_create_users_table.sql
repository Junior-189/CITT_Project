-- Initial migration: Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'innovator',
    university VARCHAR(255),
    campus VARCHAR(255),
    college VARCHAR(255),
    year_of_study VARCHAR(50),
    firestore_id VARCHAR(255) UNIQUE,
    account_status VARCHAR(50) DEFAULT 'pending',
    profile_complete BOOLEAN DEFAULT FALSE,
    profile_photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
