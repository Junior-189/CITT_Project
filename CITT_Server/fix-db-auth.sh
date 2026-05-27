#!/bin/bash
# Fix CITT PostgreSQL authentication
# Run from terminal: bash fix-db-auth.sh

DB_USER="citt_users"
DB_PASSWORD="Suni%jr443"
DB_NAME="citt_db"

echo "========================================="
echo "CITT PostgreSQL Auth Fix"
echo "========================================="

echo ""
echo "Step 1: Checking superuser access..."

if ! sudo -u postgres psql -c "SELECT 1" > /dev/null 2>&1; then
  echo "  FAILED: Cannot connect as postgres."
  echo "  Run manually: sudo -u postgres psql"
  exit 1
fi
echo "  OK"

echo ""
echo "Step 2: Fixing user and database..."

# Create or reset user
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}' CREATEDB; ELSE ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}'; END IF; END \$\$;"

# Create database if not exists
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" -tA | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" 2>/dev/null || true

echo ""
echo "Step 3: Testing connection..."
if PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1 AS result" 2>&1; then
  echo ""
  echo "========================================="
  echo "  SUCCESS! Now run: npm run migrate"
  echo "========================================="
else
  echo ""
  echo "FAILED. Run the manual fix:"
  echo "  sudo -u postgres psql"
  echo "  ALTER USER citt_users WITH PASSWORD 'Suni%jr443';"
  echo "  \\q"
fi
