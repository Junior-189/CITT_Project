#!/bin/bash

# CITT Database Setup - Simple Commands
# Copy and paste these commands one by one in your terminal

echo "Step 1: Connect to PostgreSQL as admin"
echo "Run this command:"
echo "sudo -u postgres psql"
echo ""
echo "Then paste the following SQL commands into the psql prompt:"
echo ""
echo "========== COPY EVERYTHING BELOW ==========="
echo ""

cat << 'EOF'
-- Create the user
CREATE USER citt_users WITH PASSWORD 'Suni%jr443' CREATEDB;

-- Create the database
CREATE DATABASE citt_db OWNER citt_users;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE citt_db TO citt_users;

-- Exit psql (type this at the psql prompt, don't paste)
-- \q

EOF

echo ""
echo "========== END OF SQL COMMANDS ==========="
echo ""
echo "Step 2: After exiting psql (type \q), run this to verify:"
echo ""
echo "PGPASSWORD='Suni%jr443' psql -U citt_users -h localhost -d citt_db -c 'SELECT 1;'"
echo ""
echo "Step 3: If successful, create tables by running:"
echo ""
echo "PGPASSWORD='Suni%jr443' psql -U citt_users -h localhost -d citt_db << 'EOF2'"
echo ""

cat << 'EOF2'
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firestore_id VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255),
    university VARCHAR(255),
    college VARCHAR(255),
    category VARCHAR(50),
    year_of_study VARCHAR(50),
    role VARCHAR(50) DEFAULT 'innovator',
    profile_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    location VARCHAR(255),
    category VARCHAR(50),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF2

echo "Step 4: Finally, test the full connection:"
echo "cd /home/phocie/Desktop/Project_CITT/CITT_Server && npm run dev"
