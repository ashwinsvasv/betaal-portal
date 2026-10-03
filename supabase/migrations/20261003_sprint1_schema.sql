-- Sunwai — Database Schema (Sprint 1)
-- PostgreSQL / Supabase Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email LIKE '%@iiml.ac.in'),
    course VARCHAR(50) NOT NULL,
    batch VARCHAR(20) NOT NULL,
    hostel VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Course prefixes table
CREATE TABLE IF NOT EXISTS course_prefixes (
    prefix VARCHAR(20) PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL
);

-- 3. Roles table
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category_domain VARCHAR(100),
    inbox_email VARCHAR(255) NOT NULL,
    holder_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Routing rules table
CREATE TABLE IF NOT EXISTS routing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    scope VARCHAR(50) NOT NULL,
    owner_role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    cc_role_ids TEXT[] DEFAULT '{}',
    UNIQUE (category, scope)
);

-- 5. Issues table
CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    raised_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    scope VARCHAR(50) NOT NULL,
    hostel VARCHAR(50) NOT NULL,
    visibility VARCHAR(20) NOT NULL CHECK (visibility IN ('public', 'private')),
    status VARCHAR(30) NOT NULL DEFAULT 'Raised' CHECK (status IN (
        'Raised', 'Acknowledged', 'In Progress', 'Completed', 'Rejected', 
        'Escalated L1', 'Escalated L2', 'Closed', 'Withdrawn'
    )),
    severity VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (severity IN ('Normal', 'High', 'Critical')),
    owner_role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    cc_role_ids TEXT[] DEFAULT '{}',
    ack_deadline TIMESTAMPTZ NOT NULL,
    next_update_due TIMESTAMPTZ,
    vote_count INTEGER DEFAULT 0 NOT NULL,
    redirect_count INTEGER DEFAULT 0 NOT NULL,
    is_priority BOOLEAN DEFAULT FALSE NOT NULL,
    is_reopened BOOLEAN DEFAULT FALSE NOT NULL,
    rejection_reason TEXT,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    withdrawn_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- 6. Issue photos table
CREATE TABLE IF NOT EXISTS issue_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    update_id TEXT,
    storage_path TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Votes table
CREATE TABLE IF NOT EXISTS votes (
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (issue_id, user_id)
);

-- 8. Comments table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    removed_by_admin BOOLEAN DEFAULT FALSE NOT NULL,
    removal_reason VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Status updates table (Append-only log)
CREATE TABLE IF NOT EXISTS status_updates (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    from_status VARCHAR(30) NOT NULL,
    to_status VARCHAR(30) NOT NULL,
    note TEXT NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Prevent updating or deleting from status_updates
CREATE OR REPLACE RULE no_update_status_updates AS ON UPDATE TO status_updates DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_status_updates AS ON DELETE TO status_updates DO INSTEAD NOTHING;

-- 10. Audit log table (Append-only)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE OR REPLACE RULE no_update_audit_log AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_audit_log AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- 11. Email outbox table
CREATE TABLE IF NOT EXISTS email_outbox (
    id TEXT PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    template VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    issue_id TEXT REFERENCES issues(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    attempts INTEGER DEFAULT 0 NOT NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Database Trigger for Vote Count Synchronization
CREATE OR REPLACE FUNCTION update_issue_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE issues 
        SET vote_count = vote_count + 1,
            is_priority = (vote_count + 1 >= 200)
        WHERE id = NEW.issue_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE issues 
        SET vote_count = GREATEST(0, vote_count - 1),
            is_priority = (vote_count - 1 >= 200)
        WHERE id = OLD.issue_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_vote_count ON votes;
CREATE TRIGGER trigger_sync_vote_count
AFTER INSERT OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_issue_vote_count();

-- Row Level Security (RLS) policies
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;

-- Issues policy: Public issues viewable by all active users.
-- Private issues viewable by raiser, role holder, or president.
CREATE POLICY issues_read_policy ON issues
FOR SELECT
USING (
    visibility = 'public' 
    OR raised_by = auth.uid()::text 
    OR EXISTS (
        SELECT 1 FROM roles r 
        WHERE r.id = issues.owner_role_id AND r.holder_user_id = auth.uid()::text
    )
    OR EXISTS (
        SELECT 1 FROM roles r 
        WHERE r.name = 'President' AND r.holder_user_id = auth.uid()::text
    )
);
