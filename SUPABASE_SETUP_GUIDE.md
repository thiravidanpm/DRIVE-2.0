# Supabase Tables & Queries - Quick Reference

## Overview
This file contains all SQL queries needed to set up the complete database schema for the Drive 2.0 assessment platform.

## Step-by-Step Setup Instructions

### 1. Open Supabase SQL Editor
- Go to your Supabase project
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

### 2. Copy & Execute Each Section

#### Option A: Execute Everything at Once (Recommended)
1. Copy the entire content of `SUPABASE_QUERIES.sql`
2. Paste into Supabase SQL Editor
3. Click "Run" button
4. Wait for all queries to complete

#### Option B: Execute Section by Section (Safer)
Execute in this order:
1. **Tables Creation** (Users, Questions, Sample Tests, Scores, Progress)
2. **Indexes** (for query performance)
3. **Views** (for dashboards)
4. **Sample Data** (for testing)
5. **Functions** (helper procedures)
6. **RLS Policies** (row-level security)

---

## Database Schema Details

### TABLE: users
```
- id (BIGINT, Primary Key)
- roll_number (VARCHAR 255, UNIQUE)
- password_hash (VARCHAR 255)
- name (VARCHAR 255)
- email (VARCHAR 255)
- phone (VARCHAR 20)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```
**Purpose:** Store user authentication and profile information

---

### TABLE: questions
```
- id (BIGINT, Primary Key)
- question_text (TEXT)
- option_a, option_b, option_c, option_d (TEXT)
- correct_option (INTEGER 1-4)
- category (VARCHAR: Aptitude, Logical Reasoning, Pattern Recognition, etc.)
- difficulty (VARCHAR: Easy, Medium, Hard)
- level (INTEGER: 1, 2, or 3)
- source (VARCHAR: Webhook, Manual, Admin)
- created_at, updated_at (TIMESTAMP)
```
**Purpose:** Store all assessment questions from webhook or manual entry
**Indexes:** level, category, difficulty, source, level+source

---

### TABLE: sample_tests
```
- id (BIGINT, Primary Key)
- user_id (BIGINT, Foreign Key → users.id)
- level (INTEGER 1-3)
- total_questions (INTEGER)
- correct_answers (INTEGER)
- percentage (DECIMAL 5,2)
- marks (INTEGER)
- attempted_at (TIMESTAMP)
- created_at (TIMESTAMP)
```
**Purpose:** Track each test attempt by a user with score details
**Indexes:** user_id, level, user_id+level, attempted_at

---

### TABLE: scores
```
- id (BIGINT, Primary Key)
- user_id (BIGINT, Foreign Key → users.id)
- level (INTEGER 1-3)
- score (INTEGER)
- percentage (DECIMAL 5,2)
- best_score (INTEGER)
- best_percentage (DECIMAL 5,2)
- attempts (INTEGER)
- created_at, updated_at (TIMESTAMP)
- UNIQUE(user_id, level)
```
**Purpose:** Store aggregated score data per user per level
**Indexes:** user_id, level, user_id+level

---

### TABLE: progress
```
- id (BIGINT, Primary Key)
- user_id (BIGINT, Foreign Key → users.id)
- level (INTEGER 1-3)
- status (VARCHAR: Not Started, In Progress, Completed, Passed, Failed)
- completion_percentage (INTEGER)
- last_attempted (TIMESTAMP)
- completed_at (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
- UNIQUE(user_id, level)
```
**Purpose:** Track user progress through assessment levels
**Indexes:** user_id, level, status

---

### TABLE: admin_logs (Optional)
```
- id (BIGINT, Primary Key)
- admin_id (BIGINT, Foreign Key)
- action (VARCHAR: Sync Questions, Delete Question, etc.)
- target_table (VARCHAR)
- target_id (BIGINT)
- details (TEXT)
- status (VARCHAR: Success, Failed, Pending)
- created_at (TIMESTAMP)
```
**Purpose:** Audit trail for admin operations

---

## Views (For Dashboard & Analytics)

### VIEW: leaderboard
Provides real-time leaderboard with:
- User rank
- Total marks (sum of best scores)
- Average percentage
- Levels passed
- Total attempts
- Last attempted date

**Query:**
```sql
SELECT * FROM leaderboard ORDER BY rank LIMIT 10;
```

### VIEW: user_statistics
Provides platform-wide statistics:
- Total users
- Total scores recorded
- Total progress entries
- Average best score

**Query:**
```sql
SELECT * FROM user_statistics;
```

---

## Helper Functions

### get_user_stats(user_id)
Returns aggregated statistics for a user:
```sql
SELECT * FROM get_user_stats(123);
-- Returns: total_attempts, average_percentage, best_percentage, total_marks
```

### get_questions_by_level(level, limit)
Returns random questions from a specific level:
```sql
SELECT * FROM get_questions_by_level(1, 10);
-- Returns: 10 random Level 1 questions for test
```

---

## Important Notes

### Data Constraints
- `correct_option` must be 1-4
- `level` must be 1, 2, or 3
- `percentage` is stored as DECIMAL(5,2) → max value 999.99
- `category` is restricted to predefined values
- `difficulty` must be Easy, Medium, or Hard

### Cascade Deletes
- Deleting a user will cascade delete all their:
  - sample_tests
  - scores
  - progress entries
  - admin_logs

### Indexes
All tables have proper indexes for:
- Foreign key lookups (user_id)
- Filtering (level, category, difficulty)
- Sorting (attempted_at, created_at)

### Row-Level Security (RLS)
- Users can only see their own data
- Admins need special policies (implement based on your auth setup)

---

## Testing Sample Data

The SQL file includes sample questions for testing. After executing the queries, you should have:
- 5 Level 1 questions
- 3 Level 2 questions
- 2 Level 3 questions

---

## Common Queries You'll Use

### Get all Level 1 questions
```sql
SELECT * FROM questions WHERE level = 1 AND source = 'Webhook';
```

### Get user's test history
```sql
SELECT * FROM sample_tests WHERE user_id = 123 ORDER BY attempted_at DESC;
```

### Get user statistics
```sql
SELECT * FROM get_user_stats(123);
```

### Get leaderboard
```sql
SELECT * FROM leaderboard LIMIT 10;
```

### Get user scores by level
```sql
SELECT u.roll_number, s.level, s.best_percentage, s.attempts
FROM scores s
JOIN users u ON s.user_id = u.id
WHERE s.level = 1;
```

### Clear all Level 1 webhook questions
```sql
DELETE FROM questions WHERE level = 1 AND source = 'Webhook';
```

---

## Troubleshooting

### "Column does not exist" error
- Make sure all tables are created in proper order
- Check for typos in field names

### Foreign key constraint error
- Ensure parent records exist before inserting child records
- Check if cascade deletes are enabled

### Duplicate key error
- Check UNIQUE constraints (e.g., users.roll_number, scores(user_id, level))

### Performance issues
- Verify all indexes are created
- Use EXPLAIN ANALYZE for slow queries

---

## Security Best Practices

1. ✅ Enable RLS on user data tables
2. ✅ Use prepared statements (already in code via server actions)
3. ✅ Validate input on backend (already in code)
4. ✅ Audit admin operations (use admin_logs table)
5. ✅ Never expose correct answers in client-side code

---

## Next Steps

1. Copy the SQL from `SUPABASE_QUERIES.sql`
2. Execute in Supabase SQL Editor
3. Verify all tables created: check "Table Editor" in Supabase
4. Test with sample data provided
5. Your database is ready for the application!
