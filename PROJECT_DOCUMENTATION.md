# Drive 2.0 Assessment Platform - Complete Documentation

## Project Overview

Drive 2.0 is a comprehensive online assessment platform built with **Next.js 13+** and **Supabase PostgreSQL**. It features a two-level (L1 & L2) assessment system with dynamic question loading via webhook integration.

**Key Features:**
- 🎯 Two-level assessment system (L1 & L2 only, no L3)
- 🔄 Real-time webhook question synchronization
- 📊 Comprehensive leaderboard and statistics
- 👨‍💼 Admin panel with Konami code activation ("↑↑↓↓←→←→BA")
- 📱 Responsive UI with Tailwind CSS
- 🛡️ Type-safe with TypeScript
- 🔐 User authentication with localStorage

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 13+ (App Router, TypeScript) |
| **Styling** | Tailwind CSS, PostCSS |
| **Database** | Supabase (PostgreSQL) |
| **Backend Logic** | Server Actions ("use server") |
| **Webhook Integration** | Custom `webhookService.ts` |
| **State Management** | React hooks (useState, useEffect) |

---

## Database Schema

### Tables

#### 1. `users`
```sql
- id (PRIMARY KEY, auto-increment)
- roll_number (UNIQUE, VARCHAR)
- password_hash (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. `questions`
```sql
- id (PRIMARY KEY, auto-increment)
- question_text (TEXT)
- option_a, option_b, option_c, option_d (TEXT)
- correct_option (INTEGER: 1-4)
- category (VARCHAR: physics, chemistry, math, biology)
- difficulty (VARCHAR: L1, L2)
- source (VARCHAR: webhook, manual)
- created_at (TIMESTAMP)
```

#### 3. `sample_tests`
```sql
- id (PRIMARY KEY, auto-increment)
- user_id (FOREIGN KEY → users.id)
- total_questions (INTEGER)
- correct_answers (INTEGER)
- percentage (INTEGER: 0-100)
- marks (INTEGER)
- attempted_at (TIMESTAMP)
```

#### 4. `scores`
```sql
- id (PRIMARY KEY, auto-increment)
- user_id (FOREIGN KEY → users.id)
- level (VARCHAR: L1, L2)
- best_score (INTEGER)
- best_percentage (INTEGER)
```

#### 5. `progress`
```sql
- id (PRIMARY KEY, auto-increment)
- user_id (FOREIGN KEY → users.id)
- level (VARCHAR: L1, L2)
- started_at (TIMESTAMP)
- completed_at (TIMESTAMP)
```

#### 6. `admin_logs`
```sql
- id (PRIMARY KEY, auto-increment)
- admin_id (INTEGER)
- action (VARCHAR)
- details (JSON)
- created_at (TIMESTAMP)
```

### Views

#### `leaderboard`
Shows top performers across all users:
```sql
SELECT roll_number, best_percentage as percentage
FROM sample_tests
WHERE level = 'L1' OR level = 'L2'
ORDER BY percentage DESC
```

#### `user_statistics`
Aggregated stats per user:
```sql
SELECT user_id, COUNT(*) as total_attempts,
       AVG(percentage) as avg_percentage,
       MAX(percentage) as best_percentage,
       SUM(marks) as total_marks
FROM sample_tests
GROUP BY user_id
```

### Functions

#### `get_user_stats(user_id INTEGER)`
Returns aggregated statistics for a specific user.

#### `get_questions_by_level(level VARCHAR, limit INTEGER)`
Fetches questions for the specified level (L1 or L2).

---

## Project Structure

```
drive-2.0/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   ├── globals.css                # Global styles
│   ├── actions/
│   │   ├── questions.ts           # Question server actions
│   │   └── sampleTests.ts         # Test attempt actions
│   ├── login/
│   │   └── page.tsx               # User login page
│   ├── dashboard/
│   │   ├── page.tsx               # Dashboard home
│   │   └── test/
│   │       ├── l1/page.tsx        # Level 1 test page
│   │       └── l2/page.tsx        # Level 2 test page
│   └── admin/
│       └── superadmin/
│           └── page.tsx           # Admin dashboard
├── lib/
│   ├── supabase.ts                # Supabase client config
│   ├── webhookParser.ts           # Webhook response parser
│   └── webhookService.ts          # Robust webhook sync service (NEW)
├── public/
│   └── [static assets]
├── .env.local                     # Environment variables
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── next.config.ts                 # Next.js config
├── tailwind.config.ts             # Tailwind config
└── COMPLETE_SQL_SINGLE_SHOT.sql   # Database schema
```

---

## Key Features Implementation

### 1. Two-Level Assessment System

**Level 1 (L1):**
- 10 questions per test
- Basic difficulty
- Focus on fundamentals

**Level 2 (L2):**
- 15 questions per test
- Advanced difficulty
- Builds on L1 concepts

### 2. Real Webhook Synchronization

The `lib/webhookService.ts` provides robust question synchronization with:

**8-Stage Process:**
1. **Connecting** (10%) - Validate webhook URL
2. **Fetching** (20-25%) - Fetch with retry logic (max 3 retries)
3. **Parsing** (40-50%) - Parse webhook response
4. **Validating** (55-70%) - Validate questions, check duplicates
5. **Deleting** (75-80%) - Clear old L1 webhook questions
6. **Inserting** (85-97%) - Batch insert new questions
7. **Logging** (97%) - Log operation to admin_logs
8. **Complete** (100%) - Final status

**Error Handling:**
- Fetch timeout: 60 seconds (AbortController)
- Retry logic: 3 retries with exponential backoff (1s, 2s, 3s)
- Duplicate detection: Checks existing questions
- Batch processing: 50 questions per batch
- Comprehensive error collection

```typescript
// Main function signature
export async function syncQuestionsFromWebhookRobust(
  onProgress?: (progress: SyncProgress) => void
): Promise<WebhookSyncResult>

// Result structure
{
  success: boolean,
  message: string,
  data: {
    count: number,        // Total questions fetched
    added: number,        // Successfully added
    duplicates: number,   // Detected duplicates
    errors: string[]      // Error messages
  }
}
```

### 3. Admin Panel Features

**Activation:** Press the Konami code: ↑↑↓↓←→←→BA

**Functions:**
- 📥 Generate new questions from webhook
- 📊 View sync progress in real-time
- 📋 Display question statistics
- 🔍 View sync errors (first 3 + remaining count)
- 📝 Admin operation logging

### 4. User Test Flow

1. User logs in with roll number
2. Selects test level (L1 or L2)
3. Takes test with auto-saving of answers
4. Receives immediate score and percentage
5. Views detailed test history and statistics

### 5. Dashboard & Statistics

**User Dashboard Shows:**
- Total test attempts
- Average percentage score
- Best percentage score
- Total marks accumulated
- Test history with timestamps
- Performance trends

---

## Server Actions Documentation

### `app/actions/questions.ts`

#### `getQuestionsByLevel(level: number, limit: number)`
Fetches questions for specified level.
```typescript
Return: { success: boolean, data: Question[] }
```

#### `syncQuestionsFromWebhook()`
Initiates webhook synchronization.
```typescript
Return: { 
  success: boolean, 
  message: string,
  data: { count: number, added: number, duplicates: number, errors: string[] }
}
```

### `app/actions/sampleTests.ts`

#### `saveSampleTestAttempt(userId, questions, answers, marks)`
Saves user's test attempt to database.
```typescript
Return: { success: boolean, message: string }
```

#### `getSampleTestStats(userId: number)`
Retrieves aggregated statistics for user.
```typescript
Return: {
  success: boolean,
  data: {
    total_attempts: number,
    average_percentage: number,
    best_percentage: number,
    total_marks: number
  }
}
```

#### `getUserSampleTestHistory(userId: number)`
Fetches all test attempts for user.
```typescript
Return: { success: boolean, data: SampleTest[] }
```

---

## Webhook Integration

### Webhook Endpoint
```
https://cloud.activepieces.com/api/v1/webhooks/R4qAlnXmM0gvEUEVoDwF1/sync
```

### Expected Response Format
```json
{
  "questions": [
    {
      "question_text": "...",
      "options": [
        { "text": "...", "isCorrect": true },
        { "text": "...", "isCorrect": false },
        { "text": "...", "isCorrect": false },
        { "text": "...", "isCorrect": false }
      ],
      "category": "physics|chemistry|math|biology",
      "difficulty": "L1|L2",
      "source": "webhook"
    }
  ]
}
```

### Parser Function
`webhookParser.ts` converts webhook response to database format:
- Extracts option text (A, B, C, D)
- Identifies correct option (1-4)
- Validates category and difficulty
- Handles malformed responses gracefully

---

## TypeScript Interfaces

### Question
```typescript
interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number;
  category: string;
  difficulty: string;
}
```

### SyncProgress
```typescript
interface SyncProgress {
  stage: string;
  percentage: number;
  message: string;
}
```

### WebhookSyncResult
```typescript
interface WebhookSyncResult {
  success: boolean;
  message: string;
  data?: {
    count: number;
    added: number;
    duplicates: number;
    errors: string[];
  };
}
```

---

## Setup & Deployment

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project setup
- Environment variables configured

### Installation
```bash
# Install dependencies
npm install

# Configure environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_WEBHOOK_URL=webhook_endpoint_url

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### Database Setup
```bash
# Run SQL schema (COMPLETE_SQL_SINGLE_SHOT.sql)
# 1. Open Supabase SQL Editor
# 2. Copy contents of COMPLETE_SQL_SINGLE_SHOT.sql
# 3. Execute in SQL Editor
```

---

## Error Handling & Edge Cases

### Handled Edge Cases

| Scenario | Handling |
|----------|----------|
| Webhook timeout (>60s) | AbortController, retry up to 3 times |
| Network failure | Exponential backoff: 1s, 2s, 3s delays |
| Invalid JSON response | JSON.parse try-catch, detailed error |
| Duplicate questions | Detection, counting, skipping on insert |
| Empty webhook response | Graceful timeout, error message |
| Batch insert failure | Stops current batch, logs error, continues |
| Missing required fields | Validation during parsing phase |

### Error Messages
All errors are collected and returned to admin UI:
- Network errors: "Failed to fetch from webhook"
- Parsing errors: "Invalid webhook response format"
- Validation errors: "Question missing required fields"
- Duplicate errors: "Questions already exist in database"
- Batch errors: "Failed to insert questions batch"

---

## Performance Optimizations

1. **Batch Processing:** 50 questions per batch for reliability
2. **Caching:** Questions cached in component state
3. **Server-Side Rendering:** Questions fetched on load
4. **Lazy Loading:** Test history loaded on demand
5. **Error Recovery:** Automatic retries with exponential backoff
6. **Progress Tracking:** Real-time feedback to user

---

## Security Considerations

✅ **Implemented:**
- Roll number uniqueness (no duplicates)
- Password hashing (bcrypt)
- User authentication via localStorage
- Server-side validation of all inputs
- Webhook URL validation
- Type safety with TypeScript

⚠️ **For Production:**
- Implement JWT tokens instead of localStorage
- Add HTTPS only (SSL/TLS)
- Rate limiting on webhook calls
- Admin authentication (not just Konami code)
- Input sanitization for XSS prevention
- CORS policy configuration

---

## Testing Checklist

- [ ] User registration and login
- [ ] L1 test completion (10 questions)
- [ ] L2 test completion (15 questions)
- [ ] Statistics calculation accuracy
- [ ] Webhook sync success scenario
- [ ] Webhook sync failure and retry
- [ ] Duplicate detection
- [ ] Batch processing
- [ ] Admin panel UI
- [ ] Error message display
- [ ] Leaderboard accuracy
- [ ] Progress tracking UI

---

## Troubleshooting

### Common Issues

**Issue:** "Questions not loading"
- **Solution:** Run webhook sync from admin panel, check webhook URL

**Issue:** "Stats showing zero"
- **Solution:** Complete a test attempt first, statistics load from sample_tests

**Issue:** "Duplicate questions appearing"
- **Solution:** Webhook sync checks for duplicates, clear old questions first

**Issue:** "Admin panel not appearing"
- **Solution:** Press Konami code: ↑↑↓↓←→←→BA (verify it activates)

**Issue:** "Webhook timeout"
- **Solution:** Check webhook endpoint availability, retry will happen automatically

---

## Future Enhancements

- [ ] Question search and filtering
- [ ] Performance analytics dashboard
- [ ] Question difficulty analytics
- [ ] Category-wise performance breakdown
- [ ] Time tracking per question
- [ ] Negative marking system
- [ ] Multiple attempts review
- [ ] Certificate generation
- [ ] Email notifications
- [ ] Mobile app version

---

## Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# Webhook Configuration
NEXT_PUBLIC_WEBHOOK_URL=https://cloud.activepieces.com/api/v1/webhooks/R4qAlnXmM0gvEUEVoDwF1/sync

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=[your-analytics-id]
```

---

## Support & Maintenance

**Last Updated:** 2024
**Tested With:** Next.js 13+, Node.js 18+
**Database:** Supabase PostgreSQL

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## License & Attribution

Built with modern web technologies for the Drive 2.0 Assessment Platform.
