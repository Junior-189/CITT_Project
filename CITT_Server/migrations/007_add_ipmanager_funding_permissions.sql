-- Grant IP Manager permissions to review funding applications
-- Safe/idempotent: uses WHERE NOT EXISTS guards

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO role_permissions (role, resource, action, description)
SELECT 'ipManager', 'funding', 'read', 'View all funding applications'
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions WHERE role = 'ipManager' AND resource = 'funding' AND action = 'read'
);

INSERT INTO role_permissions (role, resource, action, description)
SELECT 'ipManager', 'funding', 'approve', 'Approve funding applications'
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions WHERE role = 'ipManager' AND resource = 'funding' AND action = 'approve'
);

INSERT INTO role_permissions (role, resource, action, description)
SELECT 'ipManager', 'funding', 'reject', 'Reject funding applications'
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions WHERE role = 'ipManager' AND resource = 'funding' AND action = 'reject'
);

