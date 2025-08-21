-- Update the default referral limit from 5 to 20
ALTER TABLE users ALTER COLUMN referrals_limit SET DEFAULT 20;

-- Update existing users to have the new limit
UPDATE users SET referrals_limit = 20 WHERE referrals_limit = 5;
