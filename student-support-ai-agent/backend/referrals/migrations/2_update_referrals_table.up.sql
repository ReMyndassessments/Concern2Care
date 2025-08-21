-- Add new columns to the referrals table
ALTER TABLE referrals ADD COLUMN teacher_position TEXT NOT NULL DEFAULT '';
ALTER TABLE referrals ADD COLUMN incident_date TEXT NOT NULL DEFAULT '';
ALTER TABLE referrals ADD COLUMN location TEXT NOT NULL DEFAULT '';
ALTER TABLE referrals ADD COLUMN concern_types TEXT NOT NULL DEFAULT '[]';
ALTER TABLE referrals ADD COLUMN other_concern_type TEXT;
ALTER TABLE referrals ADD COLUMN severity_level TEXT NOT NULL DEFAULT '';
ALTER TABLE referrals ADD COLUMN actions_taken TEXT NOT NULL DEFAULT '[]';
ALTER TABLE referrals ADD COLUMN other_action_taken TEXT;

-- Remove the old additional_info column as it's replaced by more specific fields
ALTER TABLE referrals DROP COLUMN IF EXISTS additional_info;
