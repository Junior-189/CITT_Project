-- Migration: Create Events Table
-- Purpose: Store events created by admins/superAdmins

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'hackathon',
  description TEXT,
  start_date DATE,
  end_date DATE,
  submission_deadline DATE,
  location VARCHAR(255),
  capacity INTEGER,
  requirements TEXT,
  prize VARCHAR(255),
  tags TEXT,
  published BOOLEAN DEFAULT false,
  banner_image TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_published ON events(published);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

-- Add constraint to ensure valid event types
ALTER TABLE events
  ADD CONSTRAINT check_event_type
  CHECK (type IN ('hackathon', 'workshop', 'challenge', 'exhibition', 'seminar', 'conference'));

-- Add check to ensure dates are logical
ALTER TABLE events
  ADD CONSTRAINT check_event_dates
  CHECK (
    (start_date IS NULL OR end_date IS NULL OR start_date <= end_date) AND
    (start_date IS NULL OR submission_deadline IS NULL OR submission_deadline <= start_date)
  );

-- Create event submissions table (for users submitting to events)
CREATE TABLE IF NOT EXISTS event_submissions (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  team_name VARCHAR(255),
  members TEXT,
  description TEXT NOT NULL,
  problem_statement TEXT,
  solution TEXT,
  pitch_url TEXT,
  status VARCHAR(50) DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for event submissions
CREATE INDEX IF NOT EXISTS idx_submissions_event ON event_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON event_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON event_submissions(status);

-- Add constraint for submission status
ALTER TABLE event_submissions
  ADD CONSTRAINT check_submission_status
  CHECK (status IN ('submitted', 'under_review', 'reviewed', 'finalist', 'winner', 'rejected'));

-- Create submission files table
CREATE TABLE IF NOT EXISTS submission_files (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES event_submissions(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submission feedback table
CREATE TABLE IF NOT EXISTS submission_feedback (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES event_submissions(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample events for testing
INSERT INTO events (title, type, description, start_date, end_date, submission_deadline, location, capacity, requirements, prize, tags, published, created_by)
VALUES
  (
    'Innovation Hackathon 2025',
    'hackathon',
    'A 48-hour hackathon focused on solving real-world problems using technology and innovation.',
    '2025-03-15',
    '2025-03-17',
    '2025-03-10',
    'CITT Innovation Hub, Dar es Salaam',
    100,
    'Team of 2-5 members
Original idea
Working prototype or demo
Pitch presentation (5 minutes)',
    'TZS 5,000,000 (1st Prize), TZS 3,000,000 (2nd Prize), TZS 2,000,000 (3rd Prize)',
    'hackathon,innovation,technology,startup',
    true,
    (SELECT id FROM users WHERE role = 'superAdmin' LIMIT 1)
  ),
  (
    'AI & Machine Learning Workshop',
    'workshop',
    'Hands-on workshop covering fundamentals of AI and machine learning applications.',
    '2025-02-20',
    '2025-02-20',
    '2025-02-15',
    'Virtual (Online)',
    50,
    'Basic programming knowledge
Laptop with Python installed
Willingness to learn',
    'Certificate of Completion',
    'workshop,ai,machine-learning,training',
    true,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
  ),
  (
    'Green Tech Challenge',
    'challenge',
    'Submit innovative solutions for environmental sustainability and climate change.',
    '2025-04-01',
    '2025-04-30',
    '2025-03-25',
    'Online Submission',
    NULL,
    'Detailed project proposal
Environmental impact assessment
Implementation plan
Budget breakdown',
    'TZS 10,000,000 funding + Mentorship',
    'challenge,environment,sustainability,green-tech',
    false,
    (SELECT id FROM users WHERE role = 'superAdmin' LIMIT 1)
  );

COMMENT ON TABLE events IS 'Events created by admins/superAdmins';
COMMENT ON TABLE event_submissions IS 'User submissions for events';
COMMENT ON TABLE submission_files IS 'Files attached to event submissions';
COMMENT ON TABLE submission_feedback IS 'Feedback from reviewers on submissions';
