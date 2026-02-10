#!/bin/bash

# ============================================
# CITT PostgreSQL Database Setup Script
# ============================================
# This script creates the PostgreSQL user and database needed for CITT_Server
# Run this with: bash setup-db.sh

echo "🔧 CITT PostgreSQL Database Setup"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database credentials (match .env file)
DB_USER="citt_users"
DB_PASSWORD="Suni%jr443"
DB_NAME="citt_db"
DB_HOST="localhost"
DB_PORT="5432"

echo "📝 Using the following credentials:"
echo "   Database User: $DB_USER"
echo "   Database Name: $DB_NAME"
echo "   Database Host: $DB_HOST"
echo "   Database Port: $DB_PORT"
echo ""

# Check if PostgreSQL is running
echo "✅ Checking PostgreSQL service..."
if sudo systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo "Starting PostgreSQL..."
    sudo systemctl start postgresql
    sleep 2
fi
echo ""

# Create the PostgreSQL user
echo "👤 Creating PostgreSQL user '$DB_USER'..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ User created successfully${NC}"
else
    echo "⚠️  User might already exist, attempting to update password..."
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ User password updated${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not update user${NC}"
    fi
fi
echo ""

# Create the database
echo "🗄️  Creating database '$DB_NAME'..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Database might already exist${NC}"
fi
echo ""

# Grant privileges
echo "🔐 Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
echo -e "${GREEN}✓ Privileges granted${NC}"
echo ""

# Connect to the database and create schema if needed
echo "📋 Creating initial schema..."
sudo -u postgres psql -d "$DB_NAME" -c "
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
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Users table created${NC}"
else
    echo -e "${YELLOW}⚠️  Users table might already exist${NC}"
fi
echo ""

# Create events table if needed
sudo -u postgres psql -d "$DB_NAME" -c "
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
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Events table created${NC}"
else
    echo -e "${YELLOW}⚠️  Events table might already exist${NC}"
fi
echo ""

# Test the connection
echo "🧪 Testing connection with provided credentials..."
PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "SELECT 1;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Connection test successful!${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Database setup completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "You can now run: npm run dev"
    echo ""
else
    echo -e "${RED}✗ Connection test failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify PostgreSQL is running: sudo systemctl status postgresql"
    echo "2. Check .env file has correct DB_PASSWORD"
    echo "3. Try manually: PGPASSWORD='$DB_PASSWORD' psql -U $DB_USER -h $DB_HOST -d $DB_NAME"
    echo ""
fi
