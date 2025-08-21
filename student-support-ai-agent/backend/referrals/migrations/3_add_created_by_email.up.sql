-- Add created_by_email column to track which user created each referral
ALTER TABLE referrals ADD COLUMN created_by_email TEXT;

-- Add index for faster queries by user
CREATE INDEX idx_referrals_created_by_email ON referrals(created_by_email);
