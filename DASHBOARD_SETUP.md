# Dashboard Setup Guide

This guide explains how to set up the dashboard with test scoring and leaderboard functionality.

## Database Tables Setup

Copy and paste each SQL query into your Supabase SQL Editor to create the necessary tables.

### 1. Users Table (Already Created)
This table stores user information.

```sql
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  roll_number VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number);
```

### 2. Scores Table
This table stores user test attempts and scores.

```sql
CREATE TABLE IF NOT EXISTS scores (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INT NOT NULL,
  score INT NOT NULL,
  total_questions INT DEFAULT 10,
  correct_answers INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT score_range CHECK (score >= 0 AND score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_level ON scores(level);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at);
```

### 3. Progress Table
This table tracks user progress through levels.

```sql
CREATE TABLE IF NOT EXISTS progress (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_level INT DEFAULT 1,
  tests_completed INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
```

### 4. Enable Row Level Security (RLS)

```sql
-- Scores table RLS
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert scores"
ON scores FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow read scores"
ON scores FOR SELECT
USING (true);

-- Progress table RLS
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert progress"
ON progress FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow read progress"
ON progress FOR SELECT
USING (true);

CREATE POLICY "Allow update progress"
ON progress FOR UPDATE
USING (true)
WITH CHECK (true);
```

## Features Implemented

### ✅ Profile Dashboard
- User roll number display
- Tests completed count
- Current level tracking
- Average score calculation
- Best score display
- Recent test scores table
- Performance statistics

### ✅ Attend Test (Gateway)
- 3 difficulty levels:
  - Level 1: Beginner (10 questions, 10 mins)
  - Level 2: Intermediate (15 questions, 15 mins)
  - Level 3: Advanced (20 questions, 20 mins)
- Start test button for each level
- Test instructions

### ✅ Test Component
- Multiple choice questions
- Progress bar
- Question navigation (Previous/Next)
- Quick question selector
- Answer submission
- Result display with score calculation
- Performance feedback

### ✅ Leaderboard
- Top 20 student scores
- Medal system (🥇 🥈 🥉)
- Ranking system
- Student roll numbers
- Score display
- Level completed
- Date of submission
- Sorted by highest score

## User Flow

1. **Login** → Authentication
2. **Dashboard** → Three tabs:
   - Profile: View progress and scores
   - Attend Test: Select test level
   - Leaderboard: View rankings
3. **Test** → Answer questions and submit
4. **Results** → View score and return to dashboard

## Key Functions

### Dashboard Actions (`app/actions/dashboard.ts`)
- `getUserById()` - Fetch user information
- `getUserScores()` - Get all user test scores
- `getUserProgress()` - Get user progress
- `getLeaderboard()` - Get top scores
- `submitTestScore()` - Save test score
- `updateUserProgress()` - Update user progress

### Components
- **ProfileDashboard** - User statistics and progress
- **TestGateway** - Level selection
- **TestComponent** - Test interface
- **LeaderboardSection** - Rankings display

## Testing

1. Register multiple users with different roll numbers
2. Each user takes tests at different levels
3. Scores are automatically saved to the database
4. Leaderboard updates in real-time
5. Profile dashboard shows personal progress

## Next Steps

You can enhance this system by:
- Adding time limits for tests
- Implementing level-based question banks
- Adding certificates for high scores
- Email notifications for score improvements
- Student filtering on leaderboard
- Performance analysis charts
- Difficulty adaptive tests

