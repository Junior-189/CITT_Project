-- Migration 014: Mentor workspace tables and notification enhancements
-- Run as citt_users (no cross-owner FK references)

-- 1. Director profile pictures table
CREATE TABLE IF NOT EXISTS director_profiles (
  id              SERIAL PRIMARY KEY,
  department_code VARCHAR(20) NOT NULL UNIQUE,
  director_name   VARCHAR(200),
  photo_url       VARCHAR(500),
  bio             TEXT,
  updated_by      INTEGER,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO director_profiles (department_code) VALUES ('DII'),('DEBM'),('RTP')
ON CONFLICT (department_code) DO NOTHING;

-- 2. Mentor/TC/Coordinator notes on milestone stages
CREATE TABLE IF NOT EXISTS milestone_comments (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL,
  milestone_id INTEGER,
  stage_number INTEGER NOT NULL,
  commented_by INTEGER NOT NULL,
  comment      TEXT NOT NULL,
  comment_type VARCHAR(50) DEFAULT 'feedback' CHECK (comment_type IN ('feedback','guidance','approval','rejection','general')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestone_comments_project ON milestone_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_milestone_comments_stage ON milestone_comments(stage_number);

-- 3. Mentor assignment notifications log
CREATE TABLE IF NOT EXISTS assignment_notifications (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER,
  assigned_to  INTEGER,
  assigned_by  INTEGER,
  role_type    VARCHAR(50),
  message      TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT 'Migration 014 completed' AS result;
