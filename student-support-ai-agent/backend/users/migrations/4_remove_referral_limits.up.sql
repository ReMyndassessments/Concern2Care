-- Remove referral limit related columns from the users table
ALTER TABLE users DROP COLUMN IF EXISTS referrals_used_this_month;
ALTER TABLE users DROP COLUMN IF EXISTS referrals_limit;
ALTER TABLE users DROP COLUMN IF EXISTS additional_referral_packages;
