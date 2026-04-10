-- ============================================
-- ⚡ CLEAR STEP-BY-STEP SQL INSTRUCTIONS
-- ONLY 2 LEVELS: L1 and L2
-- ============================================

-- 📌 COPY AND PASTE IN THIS ORDER:
-- Step 1: Tables
-- Step 2: Indexes  
-- That's it! Done!

-- ============================================
-- ✅ STEP 1️⃣: CREATE TABLES (COPY ALL BELOW AND RUN IN SUPABASE)
-- ============================================
-- Go to Supabase → SQL Editor → New Query
-- Copy everything from "CREATE TABLE users" to "CREATE TABLE admin_logs"
-- Paste in Supabase and click RUN

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  roll_number VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option INTEGER NOT NULL CHECK (correct_option >= 1 AND correct_option <= 4),
  category VARCHAR(100) NOT NULL DEFAULT 'General' CHECK (category IN ('Aptitude', 'Logical Reasoning', 'Pattern Recognition', 'General', 'Verbal', 'Quantitative', 'Technical')),
  difficulty VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 2),
  source VARCHAR(50) DEFAULT 'Webhook' CHECK (source IN ('Webhook', 'Manual', 'Admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sample_tests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 2),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  marks INTEGER NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scores (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 2),
  score INTEGER NOT NULL DEFAULT 0,
  percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  best_percentage DECIMAL(5, 2) DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, level)
);

CREATE TABLE IF NOT EXISTS progress (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 2),
  status VARCHAR(50) NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'Passed', 'Failed')),
  completion_percentage INTEGER DEFAULT 0,
  last_attempted TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, level)
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL CHECK (action IN ('Sync Questions', 'Delete Question', 'Add Question', 'Update Question', 'Delete User', 'Download Questions')),
  target_table VARCHAR(50),
  target_id BIGINT,
  details TEXT,
  status VARCHAR(50) DEFAULT 'Success' CHECK (status IN ('Success', 'Failed', 'Pending')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ✅ STEP 2️⃣: CREATE INDEXES (COPY ALL BELOW AND RUN IN SUPABASE)
-- ============================================
-- WAIT for Step 1 to finish first!
-- Then create a NEW query and paste everything from here onwards
-- Click RUN

CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number);

CREATE INDEX IF NOT EXISTS idx_questions_level ON questions(level);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source);
CREATE INDEX IF NOT EXISTS idx_questions_level_source ON questions(level, source);

CREATE INDEX IF NOT EXISTS idx_sample_tests_user_id ON sample_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_sample_tests_level ON sample_tests(level);
CREATE INDEX IF NOT EXISTS idx_sample_tests_user_level ON sample_tests(user_id, level);
CREATE INDEX IF NOT EXISTS idx_sample_tests_attempted_at ON sample_tests(attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_level ON scores(level);
CREATE INDEX IF NOT EXISTS idx_scores_user_level ON scores(user_id, level);

CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_level ON progress(level);
CREATE INDEX IF NOT EXISTS idx_progress_status ON progress(status);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- ============================================
-- ✅ DONE! Your database is ready
-- ============================================
