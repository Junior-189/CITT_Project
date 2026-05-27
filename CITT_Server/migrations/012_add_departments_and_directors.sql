-- Migration 012: Add departments and directors system

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(20) NOT NULL UNIQUE,
  name        VARCHAR(200) NOT NULL,
  short_name  VARCHAR(50) NOT NULL,
  description TEXT,
  color       VARCHAR(50) DEFAULT 'teal',
  icon        VARCHAR(100),
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO departments (code, name, short_name, description, color) VALUES
(
  'DII',
  'Department of Innovations and Incubation',
  'DII',
  'Responsible for training and mentoring of inventors and innovators, handling complaints, coordinating technology transfer, and maintaining database of innovators.',
  'teal'
),
(
  'DEBM',
  'Department of Entrepreneurship and Business Management',
  'DEBM',
  'Responsible for entrepreneurship training, business plan development, marketing of innovative products, financial advisory, and commercialization of innovations.',
  'blue'
),
(
  'RTP',
  'Rural Technology Park',
  'RTP',
  'Located at MUST Rukwa Campus College. Brings technology to rural communities, commercializes innovations for rural impact, and supports spin-offs and start-ups.',
  'green'
)
ON CONFLICT (code) DO NOTHING;

-- Department functions table
CREATE TABLE IF NOT EXISTS department_functions (
  id            SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  order_num     INTEGER NOT NULL,
  description   TEXT NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert DII functions
INSERT INTO department_functions (department_id, order_num, description)
SELECT d.id, fn.order_num, fn.description FROM departments d
CROSS JOIN (VALUES
  (1, 'Conduct training and mentoring of inventors and innovators'),
  (2, 'Handle innovators complaints related to innovations and incubation'),
  (3, 'Establish and run Innovations and incubation in liaise with other partners'),
  (4, 'Coordinate all matters related to Technology Transfer'),
  (5, 'Maintain database of Innovators and track project progress'),
  (6, 'Handle all matters related to registration and assessment of student Innovation programmes'),
  (7, 'Coordinate evaluation of performance programs and keep periodic implementation reports')
) AS fn(order_num, description)
WHERE d.code = 'DII'
ON CONFLICT DO NOTHING;

-- Insert DEBM functions
INSERT INTO department_functions (department_id, order_num, description)
SELECT d.id, fn.order_num, fn.description FROM departments d
CROSS JOIN (VALUES
  (1, 'Conduct training and mentoring of Entrepreneurship and Business Management programmes'),
  (2, 'Develop a business plan of innovations'),
  (3, 'Advertising and marketing of innovative products'),
  (4, 'Management and financial advisory'),
  (5, 'Liaise with various experts in innovation and technology transfer worldwide'),
  (6, 'Promote Intellectual Property Rights (IPR) awareness at the university and beyond'),
  (7, 'Maintain a database of Entrepreneur and Business activities after completing all milestone stages'),
  (8, 'Design mechanisms to convert research outputs and business ideas to commercial companies'),
  (9, 'Handle all matters related to student Entrepreneurship and Business Management'),
  (10, 'Attract investment in innovation and commercialization of research results by creating funding mechanisms'),
  (11, 'Handle student and academic staff complaints related to DEBM programmes')
) AS fn(order_num, description)
WHERE d.code = 'DEBM'
ON CONFLICT DO NOTHING;

-- Insert RTP functions
INSERT INTO department_functions (department_id, order_num, description)
SELECT d.id, fn.order_num, fn.description FROM departments d
CROSS JOIN (VALUES
  (1, 'Support in bringing technology to rural communities'),
  (2, 'Commercialize innovation results in technologies with strongest impact to rural community'),
  (3, 'Look for new spin-off and start-up companies to generate rural economic activity and create jobs'),
  (4, 'Act as a driver of Public/Private Partnerships (PPP)'),
  (5, 'Complement the mission of the University in enhancing outreach services')
) AS fn(order_num, description)
WHERE d.code = 'RTP'
ON CONFLICT DO NOTHING;

-- Add department columns to users table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'department_code'
  ) THEN
    ALTER TABLE users ADD COLUMN department_code VARCHAR(20);
  END IF;
END $$;

-- Department activity log
CREATE TABLE IF NOT EXISTS department_activity (
  id            SERIAL PRIMARY KEY,
  department_id INTEGER REFERENCES departments(id),
  user_id       INTEGER REFERENCES users(id),
  action        VARCHAR(200) NOT NULL,
  details       TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaints table
CREATE TABLE IF NOT EXISTS department_complaints (
  id              SERIAL PRIMARY KEY,
  department_id   INTEGER NOT NULL REFERENCES departments(id),
  submitted_by    INTEGER NOT NULL REFERENCES users(id),
  assigned_to     INTEGER REFERENCES users(id),
  subject         VARCHAR(300) NOT NULL,
  description     TEXT NOT NULL,
  status          VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','closed')),
  resolution      TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at     TIMESTAMP WITH TIME ZONE
);

-- Training programmes table
CREATE TABLE IF NOT EXISTS training_programmes (
  id              SERIAL PRIMARY KEY,
  department_id   INTEGER NOT NULL REFERENCES departments(id),
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  target_audience VARCHAR(200),
  status          VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned','active','completed','cancelled')),
  start_date      DATE,
  end_date        DATE,
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business records table (DEBM)
CREATE TABLE IF NOT EXISTS business_records (
  id                SERIAL PRIMARY KEY,
  project_id        INTEGER NOT NULL REFERENCES projects(id),
  department_id     INTEGER NOT NULL REFERENCES departments(id),
  business_name     VARCHAR(300),
  business_plan     TEXT,
  market_status     VARCHAR(100),
  investment_amount NUMERIC(15,2),
  notes             TEXT,
  created_by        INTEGER REFERENCES users(id),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE departments TO citt_users;
GRANT ALL PRIVILEGES ON TABLE department_functions TO citt_users;
GRANT ALL PRIVILEGES ON TABLE department_activity TO citt_users;
GRANT ALL PRIVILEGES ON TABLE department_complaints TO citt_users;
GRANT ALL PRIVILEGES ON TABLE training_programmes TO citt_users;
GRANT ALL PRIVILEGES ON TABLE business_records TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE departments_id_seq TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE department_functions_id_seq TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE department_activity_id_seq TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE department_complaints_id_seq TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE training_programmes_id_seq TO citt_users;
GRANT USAGE, SELECT ON SEQUENCE business_records_id_seq TO citt_users;

SELECT 'Migration 012 completed successfully' AS result;
