CREATE TABLE referrals (
  id BIGSERIAL PRIMARY KEY,
  student_first_name TEXT NOT NULL,
  student_last_initial TEXT NOT NULL,
  grade TEXT NOT NULL,
  teacher TEXT NOT NULL,
  concern_description TEXT NOT NULL,
  additional_info TEXT,
  ai_recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
