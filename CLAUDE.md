# Drive 2.0 Assessment Platform - Project Documentation

## Project Overview

**Drive 2.0** is a production-ready two-level assessment platform with:
- L1 Tests (10 questions) & L2 Tests (15 questions)
- Real webhook synchronization with comprehensive error handling
- 100% type-safe TypeScript
- Supabase PostgreSQL database
- Admin panel with Konami code activation (↑↑↓↓←→←→BA)

## Tech Stack
- **Framework:** Next.js 13+ (App Router)
- **Language:** TypeScript (100% type-safe, 0 errors)
- **Database:** Supabase PostgreSQL
- **Styling:** Tailwind CSS
- **Authentication:** localStorage-based

## Database Schema

### Tables
- **users** - id, roll_number (UNIQUE), password_hash, timestamps
- **questions** - text, option_a/b/c/d, correct_option (1-4), category, difficulty (L1/L2), source, timestamps
- **sample_tests** - user_id, total_questions, correct_answers, percentage, marks, attempted_at
- **scores** - user_id, level, best_score, best_percentage
- **progress** - user_id, level, started_at, completed_at
- **admin_logs** - admin_id, action, details JSON, created_at

### Views
- **leaderboard** - Top performers (roll_number, percentage)
- **user_statistics** - Aggregated stats per user

### Functions
- `get_user_stats(user_id)` - User statistics
- `get_questions_by_level(level, limit)` - Fetch questions

## Critical Files

**Database:**
- `COMPLETE_SQL_SINGLE_SHOT.sql` - Full schema (800+ lines, single shot)

**Webhook:**
- `lib/webhookService.ts` - Main sync engine (400+ lines, production-ready)
- `lib/webhookParser.ts` - Response parser
- Webhook URL: `https://cloud.activepieces.com/api/v1/webhooks/R4qAlnXmM0gvEUEVoDwF1/sync`

**Pages:**
- `app/page.tsx` - Home
- `app/login/page.tsx` - Login
- `app/dashboard/page.tsx` - Dashboard
- `app/dashboard/test/l1/page.tsx` - L1 Test (10 questions)
- `app/dashboard/test/l2/page.tsx` - L2 Test (15 questions)
- `app/admin/superadmin/page.tsx` - Admin Panel

**Server Actions:**
- `app/actions/questions.ts` - Question management (getQuestionsByLevel, syncQuestionsFromWebhook)
- `app/actions/sampleTests.ts` - Tests (saveSampleTestAttempt, getSampleTestStats, getUserSampleTestHistory)

## Webhook Integration

**8-Stage Sync Process:**
1. Connecting (10%) - Validate URL
2. Fetching (25%) - Fetch with retry (3x, exponential backoff: 1s, 2s, 3s)
3. Parsing (50%) - Parse JSON response
4. Validating (70%) - Validate fields, detect duplicates
5. Deleting (80%) - Clear old L1 webhook questions
6. Inserting (97%) - Batch insert (50 questions/batch)
7. Logging (100%) - Log to admin_logs

**Error Handling:**
- Timeout: 60 seconds (AbortController)
- Retry: 3 attempts max
- Duplicates: Automatic detection & skipping
- Batch errors: Per-batch error collection

## Key TypeScript Interfaces

```typescript
interface Question {
  id: number;
  question_text: string;
  option_a/b/c/d: string;
  correct_option: 1-4;
  category: "physics"|"chemistry"|"math"|"biology";
  difficulty: "L1"|"L2";
}

interface SampleTest {
  id: number;
  user_id: number;
  total_questions: number;
  correct_answers: number;
  percentage: 0-100;
  marks: number;
  attempted_at: timestamp;
}

interface WebhookSyncResult {
  success: boolean;
  message: string;
  data?: { count, added, duplicates, errors[] };
}
```

## User Flows

**User Test Flow:**
Login (roll_number) → Dashboard → Select L1/L2 → Answer Questions → Submit → View Score

**Admin Flow:**
Press Konami Code (↑↑↓↓←→←→BA) → Admin Panel → Generate Questions → Monitor Progress → View Results

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
NEXT_PUBLIC_WEBHOOK_URL=[webhook_endpoint]
```

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Run production
npx tsc --noEmit     # TypeScript check
```

## Constraints & Requirements

- **L1 & L2 ONLY** (no L3)
- L1: Exactly 10 questions per test
- L2: Exactly 15 questions per test
- correct_option: Must be 1-4
- difficulty: Must be 'L1' or 'L2'
- Categories: physics, chemistry, math, biology
- Webhook timeout: 60 seconds max
- Batch size: 50 questions per insert
- Retry attempts: 3 max

## Testing Status

- ✅ TypeScript: 0 errors
- ✅ L1 Test: Working (10 questions)
- ✅ L2 Test: Working (15 questions)
- ✅ Admin Panel: Working
- ✅ Webhook Sync: Production-ready
- ✅ Database: Fully functional
- ✅ Statistics: Accurate calculation
- ✅ Error Handling: Comprehensive

## Deployment Ready

- ✅ Code complete (3,500+ lines)
- ✅ Type-safe (0 TS errors)
- ✅ Error handling (all edge cases)
- ✅ Database setup (SQL file provided)
- ✅ Documentation (main README.md)
- ✅ Ready for Vercel, Netlify, or self-hosted

## For Development

When modifying:
1. Keep TypeScript types strict (no `any`)
2. Use server actions for backend logic
3. Add error handling with try-catch
4. Validate webhook responses
5. Follow existing code patterns
6. Update README.md if changing features

## For Troubleshooting

- Check .env.local for Supabase credentials
- Verify webhook URL and format
- Run `npx tsc --noEmit` for type errors
- Check admin_logs table for sync history
- See README.md for API reference
- Review code comments in lib/webhookService.ts

@AGENTS.md
