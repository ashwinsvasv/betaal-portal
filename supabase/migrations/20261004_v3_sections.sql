-- Add Section support to users and issues tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS section VARCHAR(50) DEFAULT 'Section A';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS section VARCHAR(50);

-- Update RLS or defaults
UPDATE users SET section = 'Section A' WHERE section IS NULL OR section = '';
