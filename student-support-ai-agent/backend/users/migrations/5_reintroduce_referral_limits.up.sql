-- Add referral tracking columns back to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referrals_used_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referrals_limit INTEGER DEFAULT 20;
ALTER TABLE users ADD COLUMN IF NOT EXISTS additional_referral_packages INTEGER DEFAULT 0;
