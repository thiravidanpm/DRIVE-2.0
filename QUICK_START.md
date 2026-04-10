# QUICK START: Dynamic Questions System

## What We Just Set Up

✅ Dynamic question database with Supabase  
✅ Admin panel to manage questions  
✅ Automatic question updates every 7 days  
✅ Direct integration with the test system  

---

## 🚀 Get Started in 5 Minutes

### Step 1: Create Database Tables (1 min)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your DRIVE 2.0 project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy-paste the SQL from [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) (Step 1.1)
6. Click **Run**

Result: Two new tables created: `questions` & `question_update_log`

### Step 2: Add Sample Questions (2 min)

**Choose ONE option:**

#### Option A: Use Admin Panel (Easiest)
```bash
# Run the dev server
npm run dev

# Open in browser
http://localhost:3000/admin/questions

# Fill the form and add questions!
```

#### Option B: Run Seed Script
```bash
npx ts-node scripts/seed-questions.ts
```

#### Option C: Manual Import
Manually paste questions using the Python script in `scripts/import-questions.py`

### Step 3: Test It! (2 min)

```bash
# Open browser
http://localhost:3000/dashboard

# Click on any test
# Verify questions load from database
```

---

## 📊 Question Structure

Each question needs:
```
Level: 1, 2, or 3
Category: "Aptitude", "Series", "Coding", etc.
Question: The question text
Options: A, B, C, D
Correct: Which option is correct (1-4, where 1=A, 2=B, etc.)
Difficulty: "Easy", "Medium", or "Hard"
```

---

## 🔄 Automatic Updates Every 7 Days

### How It Works:
1. Every Sunday at 00:00 UTC, a scheduled job runs
2. Updates questions based on your logic
3. Logs the update in `question_update_log` table

### Setup Automatic Updates:

#### Choose your provider:

**Option 1: Vercel (Free with Vercel Hosting)**
- Deploy to Vercel
- Vercel automatically handles cron jobs in `vercel.json`
- Requires `CRON_SECRET` in environment

**Option 2: EasyCron (Free External Service)**
- Go to https://www.easycron.com
- Create cron job pointing to your API
- Set to run every 7 days

**Option 3: GitHub Actions (Free)**
- Create `.github/workflows/update-questions.yml`
- Runs on schedule automatically
- No external dependencies

---

## 📁 New Files Created

```
app/
  ├── actions/questions.ts                 ← Question CRUD operations
  ├── admin/questions/page.tsx             ← Admin panel UI
  ├── api/cron/update-questions/route.ts   ← Scheduled update API
  └── components/TestComponent.tsx         ← Updated to use database

scripts/
  ├── seed-questions.ts                    ← Initial import script
  └── import-questions.py                  ← Python import tool

IMPLEMENTATION_GUIDE.md                     ← Full setup guide
QUESTIONS_SETUP.md                         ← Database schema reference
QUICK_START.md                             ← This file!
```

---

## 🎯 Common Tasks

### Add More Questions
1. Go to `http://localhost:3000/admin/questions`
2. Select level
3. Fill form and submit
4. Instant update in database

### Check Question Count
```sql
SELECT level, COUNT(*) as count 
FROM questions 
GROUP BY level;
```

### Update Specific Question
```sql
UPDATE questions 
SET question_text = 'New question'
WHERE id = 123;
```

### Delete Old Questions
```sql
DELETE FROM questions 
WHERE level = 1 AND updated_at < NOW() - INTERVAL '30 days';
```

---

## 🔗 Fetch Questions from Sources

### India Bix (Free Aptitude Questions)
1. Visit https://www.indiabix.com/aptitude/
2. Copy questions manually
3. Paste into admin panel

### LeetCode (Coding Questions)
1. Use Premium API or manual copy
2. Format into question structure
3. Import via admin panel

### Other Sources
- HackerRank (has API)
- CodeChef (has API)
- GATE Questions (free archive)
- Geeksforgeeks (free problems)

---

## ✅ Verification Checklist

- [ ] Database tables created in Supabase
- [ ] Questions added (min 5 per level)
- [ ] Admin panel accessible at `/admin/questions`
- [ ] Tests load questions correctly
- [ ] `CRON_SECRET` set in `.env.local` for auto updates
- [ ] Cron job configured (Vercel/EasyCron/GitHub Actions)

---

## 🐛 Troubleshooting

**Q: Tests show "No questions available"**
A: 
1. Check database has questions: Go to Supabase → questions table
2. Verify questions exist for that level

**Q: Admin panel is blank**
A:
1. Ensure you're logged in
2. Check browser console for errors
3. Verify Supabase connection in .env.local

**Q: Cron job not running**
A:
1. Verify `CRON_SECRET` is set
2. Check provider's logs (Vercel, EasyCron, GitHub)
3. Manually test: `curl http://yoursite.com/api/cron/update-questions`

**Q: How to add questions programmatically?**
A: Use the `addQuestion` function in `app/actions/questions.ts`:
```typescript
await addQuestion(
  1,                          // level
  "Aptitude",                // category
  "What is 2+2?",           // question text
  ["3", "4", "5", "6"],     // options
  2,                        // correct option (1-4)
  "Easy"                    // difficulty
);
```

---

## 📈 Next Steps

1. ✅ Set up database
2. ✅ Add sample questions (20-30 per level recommended)
3. ✅ Test the system thoroughly
4. ✅ Set up automatic weekly updates
5. ✅ Monitor question quality
6. ✅ Get feedback from users
7. ✅ Adjust difficulty/categories as needed

---

## 🎓 Question Categories by Level

**Level 1 (Beginner - Aptitude)**
- Numbers & Counting
- Percentages
- Ratio & Proportion
- Time & Work
- Average
- Problems on Ages
- Speed & Distance
- Profit & Loss

**Level 2 (Intermediate - Logical Reasoning)**
- Number Series
- Coding-Decoding
- Blood Relations
- Syllogism
- Data Arrangement
- Analogy

**Level 3 (Advanced - Coding/DSA)**
- Data Structures
- Algorithms
- Complexity Analysis
- System Design Basics
- Problem Solving

---

## 📞 Support

- Check `IMPLEMENTATION_GUIDE.md` for detailed setup
- Review `app/actions/questions.ts` for API reference
- Check `app/admin/questions/page.tsx` for UI customization

---

**Your DRIVE 2.0 platform now has a complete dynamic question system! 🎉**
