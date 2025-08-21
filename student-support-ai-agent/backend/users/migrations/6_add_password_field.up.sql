-- Add password field to users table for teacher authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add index for faster authentication queries
CREATE INDEX IF NOT EXISTS idx_users_email_password ON users(email, password_hash);
