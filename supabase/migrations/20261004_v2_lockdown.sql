-- Betaal 1.0 — Schema v2 (run AFTER 20261003_sprint1_schema.sql)
-- Adds columns the app needs, and LOCKS DOWN the database:
-- the browser never talks to Supabase; only our Vercel server code does, using the
-- service-role key (which bypasses RLS). So we enable RLS with NO policies for anon/authenticated.

ALTER TABLE users ALTER COLUMN hostel DROP NOT NULL;
ALTER TABLE users ALTER COLUMN hostel SET DEFAULT '';

ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS priority_response_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reopen_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS held_for_review BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS held_reason TEXT;

ALTER TABLE email_outbox
  ADD COLUMN IF NOT EXISTS delivery_mode VARCHAR(20),
  ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS actor_name TEXT;

ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(255);
ALTER TABLE audit_log ALTER COLUMN details TYPE TEXT USING details::text;

CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_owner ON issues(owner_role_id);
CREATE INDEX IF NOT EXISTS idx_issues_raised_by ON issues(raised_by);
CREATE INDEX IF NOT EXISTS idx_comments_issue ON comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_updates_issue ON status_updates(issue_id);

-- Lock everything down: no policies => anon/authenticated roles get nothing.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_prefixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;

-- The v1 policy relied on Supabase Auth (auth.uid()), which we don't use (Google via NextAuth).
DROP POLICY IF EXISTS issues_read_policy ON issues;
