# DRIVE 2.0 - Dynamic Questions System Implementation Guide

## Overview
This guide will set up a dynamic question management system that:
- ✅ Stores questions in Supabase database
- ✅ Allows admin to add/edit/delete questions
- ✅ Fetches questions at test runtime
- ✅ Supports automatic updates every 7 days
- ✅ Tracks question update history

## Step 1: Setup Database

### 1.1 Create Tables in Supabase

Go to **Supabase Dashboard** → **SQL Editor** and run this:

```sql
-- Create questions table
CREATE TABLE questions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  level INT NOT NULL CHECK(level IN (1, 2, 3)),
  category VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(500) NOT NULL,
  option_b VARCHAR(500) NOT NULL,
  option_c VARCHAR(500) NOT NULL,
  option_d VARCHAR(500) NOT NULL,
  correct_option INT NOT NULL CHECK(correct_option IN (1, 2, 3, 4)),
  difficulty VARCHAR(20) DEFAULT 'Medium' CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
  source VARCHAR(100) DEFAULT 'Manual',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_questions_level ON questions(level);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_updated ON questions(updated_at);

-- Create update log table
CREATE TABLE question_update_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  level INT NOT NULL,
  questions_added INT DEFAULT 0,
  questions_replaced INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for logs
CREATE INDEX idx_update_log_level ON question_update_log(level);
```

### 1.2 Set Row Level Security (Optional but Recommended)

```sql
-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_update_log ENABLE ROW LEVEL SECURITY;

-- Allow all users to view questions
CREATE POLICY "Allow public read questions" ON questions
  FOR SELECT USING (true);

-- Allow only authenticated admins to insert/update/delete
CREATE POLICY "Allow admin write questions" ON questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

## Step 2: Add Sample Questions

### Option A: Using the Script (Recommended)

1. Update `.env.local` with Supabase credentials
2. Install Supabase CLI:
```bash
npm install --save-dev @supabase/supabase-js
```

3. Run the seed script:
```bash
npx ts-node scripts/seed-questions.ts
```

### Option B: Manual Entry via Admin Panel

1. Navigate to: `http://localhost:3000/admin/questions`
2. Fill the form and add questions one by one
3. Questions are immediately available for tests

### Option C: Bulk Import (CSV)

```bash
# Export from India Bix or other source as CSV
# Format: level,category,question,optionA,optionB,optionC,optionD,correctOption

# Use Supabase API to bulk import
curl -X POST 'https://your-project.supabase.co/rest/v1/questions' \
  -H 'apikey: your-anon-key' \
  -H 'Content-Type: application/json' \
  -d @questions.json
```

## Step 3: Admin Question Manager

The admin panel is now available at `/admin/questions`

### Features:
- ✅ View all questions by level
- ✅ Add new questions with category and difficulty
- ✅ Delete questions
- ✅ Show question count per level
- ✅ Real-time updates

### Access:
```
http://localhost:3000/admin/questions
```

## Step 4: Automatic Weekly Updates (Every 7 Days)

### Option 1: Using Vercel Cron (Free with Vercel)

1. Deploy to Vercel
2. Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/update-questions",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

### Option 2: Using EasyCron (Free External Service)

1. Go to https://www.easycron.com/
2. Create new cron job
3. URL: `https://your-domain.com/api/cron/update-questions`
4. Schedule: Every Sunday at 00:00 UTC
5. HTTP Headers:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```

### Option 3: Using GitHub Actions

Create `.github/workflows/update-questions.yml`:
```yaml
name: Update Questions Weekly
on:
  schedule:
    - cron: '0 0 * * 0'

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger update
        run: |
          curl -X GET 'https://your-domain.com/api/cron/update-questions' \
            -H 'authorization: Bearer ${{ secrets.CRON_SECRET }}'
```

### Setup CRON_SECRET in .env.local:
```
CRON_SECRET=your-super-secret-key-here
```

## Step 5: Export Questions from India Bix (Manual Process)

Since India Bix doesn't have a public API, manual extraction is recommended:

1. Visit https://www.indiabix.com/
2. Select category (e.g., Aptitude → Numbers)
3. Copy questions manually or use browser console:
```javascript
// Browser console on India Bix page
const questions = Array.from(document.querySelectorAll('.question')).map(q => ({
  question: q.querySelector('.prq_que')?.textContent,
  optionA: q.querySelector('label:nth-of-type(1)')?.textContent,
  optionB: q.querySelector('label:nth-of-type(2)')?.textContent,
  optionC: q.querySelector('label:nth-of-type(3)')?.textContent,
  optionD: q.querySelector('label:nth-of-type(4)')?.textContent
}));
console.log(JSON.stringify(questions, null, 2));
```

4. Format and import via admin panel

## Step 6: Testing the System

### Test 1: Add Questions via Admin Panel
```bash
npm run dev
# Open http://localhost:3000/admin/questions
# Add 5-10 questions for each level
```

### Test 2: Take a Test
```bash
# Open http://localhost:3000/dashboard
# Click on a test and see if questions load
```

### Test 3: Verify Database
```sql
-- Check questions in Supabase
SELECT COUNT(*) as total, level, COUNT(*) as count 
FROM questions 
GROUP BY level;
```

### Test 4: Test Automatic Updates (Optional)
```bash
# Manually trigger the cron job
curl -X GET 'http://localhost:3000/api/cron/update-questions' \
  -H 'authorization: Bearer your-secret'
```

## Step 7: Monitoring & Maintenance

### Check Update History:
```sql
SELECT * FROM question_update_log ORDER BY updated_at DESC LIMIT 10;
```

### Monitor Question Quality:
```sql
SELECT level, category, difficulty, COUNT(*) as count
FROM questions
GROUP BY level, category, difficulty;
```

### Retire Old Questions (Optional):
```sql
-- Archive questions not updated in 30 days
-- First create an archive table
CREATE TABLE questions_archive AS 
SELECT * FROM questions WHERE updated_at < NOW() - INTERVAL '30 days';

-- Then delete from main table (optional)
DELETE FROM questions WHERE updated_at < NOW() - INTERVAL '30 days';
```

## Question Schema Reference

### Correct Option Values:
- `1` = Option A
- `2` = Option B
- `3` = Option C
- `4` = Option D

### Difficulty Levels:
- `Easy` - Basic concepts
- `Medium` - Application of concepts
- `Hard` - Complex problem solving

### Levels:
- `1` - Beginner (Aptitude)
- `2` - Intermediate (Logical Reasoning)
- `3` - Advanced (Coding/DSA)

## Troubleshooting

### Questions not loading in test:
1. Check if questions exist in database:
   ```sql
   SELECT COUNT(*) FROM questions WHERE level = 1;
   ```
2. Check browser console for errors
3. Verify Supabase connection in `.env.local`

### Admin panel not loading:
1. Check that `app/admin/questions/page.tsx` exists
2. Verify user is authenticated
3. Check RLS policies allow read access

### Automatic updates not working:
1. Verify `CRON_SECRET` is set correctly
2. Check API endpoint responds:
   ```bash
   curl http://localhost:3000/api/cron/update-questions
   ```
3. View cron job logs in Vercel/GitHub Actions dashboard

## Next Steps

1. ✅ Set up database (Step 1)
2. ✅ Add sample questions (Step 2)
3. ✅ Test admin panel (Step 3)
4. ✅ Add more questions as needed
5. ✅ Set up automatic updates (Step 4)
6. ✅ Monitor system health

## Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [India Bix Aptitude Questions](https://www.indiabix.com/aptitude/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
