-- Add teacher-specific fields to users table
ALTER TABLE users ADD COLUMN school_name TEXT;
ALTER TABLE users ADD COLUMN school_district TEXT;
ALTER TABLE users ADD COLUMN primary_grade TEXT;
ALTER TABLE users ADD COLUMN primary_subject TEXT;
ALTER TABLE users ADD COLUMN class_id TEXT;
ALTER TABLE users ADD COLUMN additional_grades TEXT[]; -- For teachers who teach multiple grades
ALTER TABLE users ADD COLUMN additional_subjects TEXT[]; -- For teachers who teach multiple subjects
ALTER TABLE users ADD COLUMN teacher_type TEXT DEFAULT 'classroom'; -- 'classroom', 'specialist', 'support'
ALTER TABLE users ADD COLUMN school_year TEXT; -- e.g., "2024-2025"
ALTER TABLE users ADD COLUMN referrals_used_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN referrals_limit INTEGER DEFAULT 20;
ALTER TABLE users ADD COLUMN additional_referral_packages INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
