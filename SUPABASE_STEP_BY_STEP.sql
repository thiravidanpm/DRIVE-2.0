-- ============================================
-- SUPABASE SQL - EXECUTE IN ORDER
-- ============================================
-- Copy each SECTION below and run separately in Supabase SQL Editor
-- Wait for success before moving to next section

-- ============================================
-- SECTION 1: CREATE ALL TABLES (Run First)
-- ============================================

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
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 3),
  source VARCHAR(50) DEFAULT 'Webhook' CHECK (source IN ('Webhook', 'Manual', 'Admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sample_tests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 3),
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
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
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
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
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
-- SECTION 2: CREATE INDEXES (Run After Section 1)
-- ============================================

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
-- SECTION 3: INSERT TEST DATA (Run After Section 2)
-- ============================================

INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_option, category, difficulty, level, source)
VALUES 
  ('What is the capital of France?', 'Paris', 'London', 'Berlin', 'Madrid', 1, 'General', 'Easy', 1, 'Manual'),
  ('If 2 + 2 = 4, then 4 + 4 = ?', '6', '8', '10', '12', 2, 'Aptitude', 'Easy', 1, 'Manual'),
  ('Which number comes next in the sequence: 2, 4, 6, 8, ?', '10', '12', '14', '16', 1, 'Pattern Recognition', 'Easy', 1, 'Manual'),
  ('What is 15% of 200?', '20', '25', '30', '35', 3, 'Quantitative', 'Easy', 1, 'Manual'),
  ('Choose the odd one out: Apple, Orange, Carrot, Banana', 'Apple', 'Orange', 'Carrot', 'Banana', 3, 'Logical Reasoning', 'Medium', 1, 'Manual'),
  ('What is the LCM of 12, 18, and 24?', '36', '48', '72', '144', 3, 'Quantitative', 'Medium', 1, 'Manual'),
  ('If a train travels at 60 km/h for 2 hours and then 80 km/h for 3 hours, what is the average speed?', '70 km/h', '72 km/h', '75 km/h', '76 km/h', 2, 'Aptitude', 'Medium', 1, 'Manual');

-- Level 2: DSA and Logical/Numerical Operations
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_option, category, difficulty, level, source)
VALUES 
  ('What is the time complexity of binary search in a sorted array?', 'O(n)', 'O(log n)', 'O(n²)', 'O(n log n)', 2, 'Technical', 'Medium', 2, 'Manual'),
  ('Which data structure uses LIFO principle?', 'Queue', 'Stack', 'Tree', 'Graph', 2, 'Technical', 'Medium', 2, 'Manual'),
  ('In the sequence 3, 6, 12, 24, ?, what comes next and what is the pattern?', '48 (multiply by 2)', '36 (add 12)', '32 (add 8)', '40 (multiply by 1.5)', 1, 'Pattern Recognition', 'Hard', 2, 'Manual'),
  ('If a rectangle has perimeter 40 and length is 3 times the width, what is its area?', '75', '100', '120', '150', 1, 'Quantitative', 'Hard', 2, 'Manual'),
  ('What is the space complexity of a recursive Fibonacci function without memoization?', 'O(1)', 'O(n)', 'O(2^n)', 'O(log n)', 3, 'Technical', 'Hard', 2, 'Manual'),
  ('A man buys a cloth for Rs. 100 and sells it for Rs. 120. He then buys it back for Rs. 110. What is his total profit/loss?', 'Profit of Rs. 30', 'Loss of Rs. 10', 'Profit of Rs. 10', 'Loss of Rs. 30', 1, 'Logical Reasoning', 'Hard', 2, 'Manual'),
  ('Which sorting algorithm has the best average time complexity?', 'Bubble Sort', 'Quick Sort', 'Insertion Sort', 'Selection Sort', 2, 'Technical', 'Hard', 2, 'Manual');

-- Level 3: Advanced DSA and Complex Problem Solving
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_option, category, difficulty, level, source)
VALUES 
  ('What is the time complexity of finding the median of two sorted arrays of size n?', 'O(n²)', 'O(n)', 'O(log n)', 'O(n log n)', 3, 'Technical', 'Hard', 3, 'Manual'),
  ('In graph theory, which algorithm is used for finding the shortest path in a weighted graph with non-negative weights?', 'BFS', 'DFS', 'Dijkstra', 'Floyd-Warshall', 3, 'Technical', 'Hard', 3, 'Manual'),
  ('What is the recurrence relation T(n) = T(n-1) + O(n) solved to?', 'O(n)', 'O(n²)', 'O(2^n)', 'O(log n)', 2, 'Technical', 'Hard', 3, 'Manual'),
  ('If 5 men can build a wall in 12 days by working 8 hours a day, how many men are needed to build the same wall in 6 days working 10 hours a day?', '8', '10', '12', '15', 1, 'Quantitative', 'Hard', 3, 'Manual'),
  ('What is the LCS (Longest Common Subsequence) of strings "AGGTAB" and "GXTXAYB"?', 'GTAB', 'AGTA', 'GTXAB', 'XAYB', 1, 'Technical', 'Hard', 3, 'Manual'),
  ('In a group of 100 students, 60 pass in Math, 50 pass in Science, and 30 pass in both. How many fail both subjects?', '20', '30', '40', '50', 1, 'Logical Reasoning', 'Hard', 3, 'Manual'),
  ('What is the worst-case space complexity of merge sort algorithm including the input array?', 'O(1)', 'O(n)', 'O(log n)', 'O(n²)', 2, 'Technical', 'Hard', 3, 'Manual'),
  ('If a number is divided by 7, the remainder is 3. If the number is divided by 13, the remainder is 5. Find the number (mod 91)?', '24', '55', '38', '66', 2, 'Quantitative', 'Hard', 3, 'Manual');

-- ============================================
-- SECTION 4: CREATE VIEWS (Run After Section 3)
-- ============================================

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id,
  u.roll_number,
  u.name,
  COALESCE(SUM(s.best_score), 0) as total_marks,
  COALESCE(AVG(s.best_percentage), 0) as avg_percentage,
  COUNT(DISTINCT CASE WHEN s.best_percentage >= 70 THEN s.level END) as levels_passed,
  COUNT(DISTINCT st.id) as total_attempts,
  MAX(st.attempted_at) as last_attempted,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(s.best_score), 0) DESC) as rank
FROM users u
LEFT JOIN scores s ON u.id = s.user_id
LEFT JOIN sample_tests st ON u.id = st.user_id
GROUP BY u.id, u.roll_number, u.name
ORDER BY rank;

CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT s.id) as total_scores,
  COUNT(DISTINCT p.id) as total_progress,
  AVG(s.best_percentage) as avg_best_score
FROM users u
LEFT JOIN scores s ON u.id = s.user_id
LEFT JOIN progress p ON u.id = p.user_id;

-- ============================================
-- SECTION 5: CREATE HELPER FUNCTIONS (Run After Section 4)
-- ============================================

CREATE OR REPLACE FUNCTION get_user_stats(p_user_id BIGINT)
RETURNS TABLE (
  total_attempts BigInt,
  average_percentage DECIMAL,
  best_percentage DECIMAL,
  total_marks BigInt
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BigInt as total_attempts,
    AVG(percentage) as average_percentage,
    MAX(percentage) as best_percentage,
    SUM(marks)::BigInt as total_marks
  FROM sample_tests
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_questions_by_level(p_level INTEGER, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id BigInt,
  question_text TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_option INTEGER,
  category VARCHAR,
  difficulty VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
    q.correct_option,
    q.category,
    q.difficulty
  FROM questions q
  WHERE q.level = p_level AND q.source = 'Webhook'
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES (Run After All Sections)
-- ============================================
-- Verify all tables created
SELECT 
  current_database() as database,
  'users' as table_name, 
  COUNT(*) as row_count 
FROM users
UNION ALL
SELECT current_database(), 'questions', COUNT(*) FROM questions
UNION ALL
SELECT current_database(), 'scores', COUNT(*) FROM scores
UNION ALL
SELECT current_database(), 'progress', COUNT(*) FROM progress
UNION ALL
SELECT current_database(), 'sample_tests', COUNT(*) FROM sample_tests
UNION ALL
SELECT current_database(), 'admin_logs', COUNT(*) FROM admin_logs;

-- Test helper function
SELECT * FROM get_user_stats(1);

-- Test view
SELECT * FROM leaderboard LIMIT 5;

-- ============================================
-- END
-- ============================================
