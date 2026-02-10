-- Create missing tables for CITT system

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    project_status VARCHAR(50) DEFAULT 'submitted' CHECK (project_status IN ('submitted', 'on_progress', 'completed')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    deleted_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Funding Table
CREATE TABLE IF NOT EXISTS funding (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'TZS',
    grant_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'applied',
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    funding_status VARCHAR(50) DEFAULT 'applied' CHECK (funding_status IN ('applied', 'on_progress', 'approved', 'disbursed', 'completed')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    deleted_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IP Management Table
CREATE TABLE IF NOT EXISTS ip_management (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    ip_title VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    deleted_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ip_address)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_approval_status ON projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_funding_user_id ON funding(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_project_id ON funding(project_id);
CREATE INDEX IF NOT EXISTS idx_funding_approval_status ON funding(approval_status);
CREATE INDEX IF NOT EXISTS idx_funding_deleted_at ON funding(deleted_at);
CREATE INDEX IF NOT EXISTS idx_ip_management_user_id ON ip_management(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_management_approval_status ON ip_management(approval_status);
CREATE INDEX IF NOT EXISTS idx_ip_management_deleted_at ON ip_management(deleted_at);
