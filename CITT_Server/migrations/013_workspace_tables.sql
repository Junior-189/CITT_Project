-- Run as postgres superuser:
-- sudo -u postgres psql -d citt_db -f /path/to/013_workspace_tables.sql

CREATE TABLE IF NOT EXISTS department_complaints (
  id            SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  submitted_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_to   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subject       TEXT NOT NULL,
  description   TEXT NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','in_review','resolved','closed')),
  resolution    TEXT,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_programmes (
  id              SERIAL PRIMARY KEY,
  department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  target_audience TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'planned'
                    CHECK (status IN ('planned','active','completed','cancelled')),
  start_date      DATE,
  end_date        DATE,
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_records (
  id                SERIAL PRIMARY KEY,
  project_id        INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  department_id     INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  business_name     TEXT,
  business_plan     TEXT,
  market_status     TEXT,
  investment_amount NUMERIC(15,2),
  notes             TEXT,
  created_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS department_activity (
  id            SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  entity_type   VARCHAR(50),
  entity_id     INTEGER,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON department_complaints TO citt_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON training_programmes    TO citt_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON business_records       TO citt_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON department_activity    TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE department_complaints_id_seq   TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE training_programmes_id_seq     TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE business_records_id_seq        TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE department_activity_id_seq     TO citt_users;
