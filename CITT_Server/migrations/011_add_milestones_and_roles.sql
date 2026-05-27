-- Update role constraint to include new roles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_role_check' AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN (
    'superAdmin','admin','transferTechnologyOfficer','ipManager',
    'diiDirector','debmDirector','rtpDirector',
    'mentor','technicalCommittee','coordinator','innovator'
  )
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id                SERIAL PRIMARY KEY,
  project_id        INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_number      INTEGER NOT NULL CHECK (stage_number BETWEEN 1 AND 9),
  stage_name        VARCHAR(100) NOT NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','submitted','completed','rejected')),
  submitted_by      INTEGER REFERENCES users(id),
  approved_by       INTEGER REFERENCES users(id),
  submission_notes  TEXT,
  approval_notes    TEXT,
  rejection_reason  TEXT,
  file_url          VARCHAR(500),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at      TIMESTAMP WITH TIME ZONE,
  approved_at       TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, stage_number)
);

CREATE TABLE IF NOT EXISTS project_assignments (
  id               SERIAL PRIMARY KEY,
  project_id       INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_user_id INTEGER NOT NULL REFERENCES users(id),
  assigned_by      INTEGER REFERENCES users(id),
  assignment_type  VARCHAR(50) NOT NULL CHECK (assignment_type IN ('mentor','technical_committee','coordinator')),
  assigned_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active           BOOLEAN DEFAULT TRUE,
  notes            TEXT,
  UNIQUE(project_id, assigned_user_id, assignment_type)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='current_milestone') THEN
    ALTER TABLE projects ADD COLUMN current_milestone INTEGER DEFAULT 1;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='completed_milestones') THEN
    ALTER TABLE projects ADD COLUMN completed_milestones INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_project_milestone_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET
    completed_milestones = (SELECT COUNT(*) FROM project_milestones WHERE project_id = NEW.project_id AND status = 'completed'),
    current_milestone = COALESCE((SELECT MIN(stage_number) FROM project_milestones WHERE project_id = NEW.project_id AND status NOT IN ('completed')), 9)
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_milestone_count ON project_milestones;
CREATE TRIGGER trg_update_milestone_count
  AFTER INSERT OR UPDATE ON project_milestones
  FOR EACH ROW EXECUTE FUNCTION update_project_milestone_count();

GRANT ALL PRIVILEGES ON TABLE project_milestones TO citt_users;
GRANT ALL PRIVILEGES ON TABLE project_assignments TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE project_milestones_id_seq TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE project_assignments_id_seq TO citt_users;
