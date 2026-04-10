# Drive 2.0 Quick Reference Guide

## Quick Start

### 1. Setup Database
```bash
# Open Supabase SQL Editor and run:
# Content of: COMPLETE_SQL_SINGLE_SHOT.sql
# This creates all tables, views, and functions
```

### 2. Configure Environment
```bash
# Create .env.local with:
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_WEBHOOK_URL=webhook_endpoint
```

### 3. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## Key Pages & Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Home page | Public |
| `/login` | User login | Public |
| `/dashboard` | User dashboard | Authenticated |
| `/dashboard/test/l1` | Level 1 test | Authenticated |
| `/dashboard/test/l2` | Level 2 test | Authenticated |
| `/admin/superadmin` | Admin panel | Konami code required |

---

## Admin Panel Access

**Activation Code:** Press this key sequence:
```
↑ ↑ ↓ ↓ ← → ← → B A
```

**Admin Panel Features:**
- Generate New Questions (from webhook)
- View sync progress
- See error details
- Check question statistics

---

## User Test Flow

### Level 1 Test (10 Questions)
```
Login → Dashboard → Click "Take L1 Test" 
→ Answer 10 questions → Submit 
→ View Score → See History
```

### Level 2 Test (15 Questions)
```
Login → Dashboard → Click "Take L2 Test" 
→ Answer 15 questions → Submit 
→ View Score → See History
```

---

## Database Quick Queries

### Add Sample Questions
```sql
-- L1 Sample Question
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, 
  correct_option, category, difficulty, source) 
VALUES ('What is 2+2?', '3', '4', '5', '6', 2, 'math', 'L1', 'manual');

-- L2 Sample Question  
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d,
  correct_option, category, difficulty, source)
VALUES ('What is the derivative of x²?', '2x', 'x', 'x³', '1', 1, 'math', 'L2', 'manual');
```

### Create Test User
```sql
INSERT INTO users (roll_number, password_hash)
VALUES ('CS001', 'hash_here');
```

### View User Statistics
```sql
SELECT * FROM user_statistics WHERE user_id = 1;
```

### View Leaderboard
```sql
SELECT * FROM leaderboard LIMIT 10;
```

### Check Admin Logs
```sql
SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 20;
```

---

## Common Server Actions

### Fetch Questions
```typescript
import { getQuestionsByLevel } from '@/app/actions/questions';

const result = await getQuestionsByLevel(1, 10); // Level 1, 10 questions
if (result.success) {
  console.log(result.data); // Array of Question objects
}
```

### Save Test Attempt
```typescript
import { saveSampleTestAttempt } from '@/app/actions/sampleTests';

const result = await saveSampleTestAttempt(
  userId,           // number
  questions,        // Question[]
  answers,          // number[]
  marks             // number
);
```

### Get User Statistics
```typescript
import { getSampleTestStats } from '@/app/actions/sampleTests';

const result = await getSampleTestStats(userId);
// Returns:
// {
//   total_attempts: 5,
//   average_percentage: 72,
//   best_percentage: 85,
//   total_marks: 360
// }
```

### Sync Webhook Questions
```typescript
import { syncQuestionsFromWebhook } from '@/app/actions/questions';

const result = await syncQuestionsFromWebhook();
// Returns detailed sync result with error handling
```

---

## TypeScript Types Quick Reference

```typescript
// Question Type
interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number; // 1-4
  category: string;       // physics, chemistry, math, biology
  difficulty: string;     // L1, L2
}

// User Type (from database)
interface User {
  id: number;
  roll_number: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

// Sample Test Type
interface SampleTest {
  id: number;
  user_id: number;
  total_questions: number;
  correct_answers: number;
  percentage: number;  // 0-100
  marks: number;
  attempted_at: string;
}

// API Response Type
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
```

---

## Webhook Response Format

**Expected Webhook Response:**
```json
{
  "questions": [
    {
      "question_text": "Sample question?",
      "options": [
        { "text": "Option A", "isCorrect": true },
        { "text": "Option B", "isCorrect": false },
        { "text": "Option C", "isCorrect": false },
        { "text": "Option D", "isCorrect": false }
      ],
      "category": "physics|chemistry|math|biology",
      "difficulty": "L1|L2"
    }
  ]
}
```

---

## Keyboard Shortcuts & Navigation

### Test Page
- **Next Question:** Click "Next" button or keyboard arrow key
- **Previous Question:** Click "Previous" button
- **Submit Test:** Click "Submit Test" button
- **Back to Dashboard:** Click "Back to Dashboard" link

### Admin Panel
- **Generate Questions:** Click "Generate New Questions"
- **View Progress:** Watch progress bar (0-100%)
- **Check Errors:** Scroll to error section
- **Refresh Stats:** Manual page refresh

---

## Performance Tips

### For Developers
1. **Cache questions**: Use useState to store fetched questions
2. **Lazy load history**: Load test history only when needed
3. **Optimize bundle**: Next.js handles automatic code splitting
4. **Use server actions**: Keep heavy computation on server

### For Users
1. **Complete L1 first**: Builds foundation for L2
2. **Review history**: Understand weak areas
3. **Practice regularly**: Improves scores over time
4. **Check leaderboard**: Motivational comparison

---

## Debugging

### Enable Browser Console Logs
```typescript
// In component
useEffect(() => {
  console.log('Component loaded', { userId, questions });
}, [userId, questions]);
```

### Check Supabase Queries
```typescript
// In server action
const { data, error } = await supabase.from('questions').select('*');
if (error) console.error('Supabase error:', error);
```

### Monitor Webhook Calls
```typescript
// In webhookService.ts
console.log('Fetching from webhook:', WEBHOOK_URL);
console.log('Retry attempt:', retryCount);
console.log('Parsed questions:', parsedQuestions.length);
```

### View Admin Logs
```sql
-- Check what admin operations were performed
SELECT action, details, created_at FROM admin_logs 
ORDER BY created_at DESC LIMIT 10;
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema loaded
- [ ] Webhook endpoint verified
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] Admin authentication improved
- [ ] Error logging setup
- [ ] Backup strategy
- [ ] Performance tested
- [ ] Security audit complete

---

## File Locations Reference

```
Critical Files:
├── DATABASE: COMPLETE_SQL_SINGLE_SHOT.sql
├── WEBHOOK: lib/webhookService.ts
├── PARSER: lib/webhookParser.ts
├── TESTS: app/dashboard/test/
├── ACTIONS: app/actions/
└── ADMIN: app/admin/superadmin/page.tsx

Config Files:
├── .env.local
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Build & Deploy
npm run build            # Build for production
npm run start            # Start production server

# TypeScript
npx tsc --noEmit        # Check for TS errors

# Database Reset (if needed)
# 1. Drop all tables in Supabase
# 2. Run COMPLETE_SQL_SINGLE_SHOT.sql again

# Clear Cache
rm -rf .next            # Clear Next.js cache
npm cache clean --force # Clear npm cache
```

---

## Error Messages & Solutions

| Error | Solution |
|-------|----------|
| "Webhook timeout" | Check webhook URL, retry manually |
| "Duplicate questions" | Click "Clear Old Questions" first |
| "No questions available" | Run webhook sync from admin panel |
| "Login page redirect" | User localStorage missing, login again |
| "Stats showing zero" | Complete a test first |
| "Admin panel not showing" | Enter Konami code correctly |

---

## Important Constraints

- **L1 Questions:** Exactly 10 per test
- **L2 Questions:** Exactly 15 per test
- **Webhook Timeout:** 60 seconds maximum
- **Retry Attempts:** 3 maximum with backoff
- **Batch Size:** 50 questions per insert
- **Correct Option:** Must be 1-4
- **Difficulty:** Must be L1 or L2 only
- **Category:** physics, chemistry, math, biology only

---

## Support Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **TypeScript:** https://www.typescriptlang.org/docs

---

*Last Updated: 2024*
*Version: 1.0*
*Status: Production Ready*
