-- ============================================
-- L2 CODING TEST SYSTEM - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. L2 Problems Table (stores all 453 Striver A2Z problems)
CREATE TABLE IF NOT EXISTS l2_problems (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Arrays',
  difficulty TEXT NOT NULL DEFAULT 'Medium'
    CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  step_number INT NOT NULL DEFAULT 1,
  test_cases JSONB NOT NULL DEFAULT '[]',
  starter_code JSONB NOT NULL DEFAULT '{}',
  week_number INT,
  problem_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. L2 Weekly Results (one row per user per week)
CREATE TABLE IF NOT EXISTS l2_weekly_results (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  problems_solved INT NOT NULL DEFAULT 0,
  total_problems INT NOT NULL DEFAULT 4,
  score INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);

-- 3. L2 Submissions (each code submission per problem)
CREATE TABLE IF NOT EXISTS l2_submissions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id INT NOT NULL REFERENCES l2_problems(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('python', 'java', 'c')),
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('passed', 'failed', 'error', 'pending')),
  test_results JSONB NOT NULL DEFAULT '[]',
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add l2_current_week to app_config
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS l2_current_week INT DEFAULT 1;

-- 5. Update existing app_config row
UPDATE app_config SET l2_current_week = 1 WHERE id = 1;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_l2_problems_week ON l2_problems(week_number);
CREATE INDEX IF NOT EXISTS idx_l2_results_user_week ON l2_weekly_results(user_id, week_number);
CREATE INDEX IF NOT EXISTS idx_l2_submissions_user_problem ON l2_submissions(user_id, problem_id, week_number);

-- 7. Enable RLS (if needed, match your existing policy pattern)
-- ALTER TABLE l2_problems ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE l2_weekly_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE l2_submissions ENABLE ROW LEVEL SECURITY;

-- Done! Now run the seed data from the admin panel or import tool.
