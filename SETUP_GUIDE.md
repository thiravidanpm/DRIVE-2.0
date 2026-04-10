# Drive 2.0 - Complete Setup Guide

## Phase 1: Project Initialization

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git version control (optional)
- Supabase account (https://supabase.com)

### Step 1: Clone/Create Project
```bash
# If cloning
git clone <repository-url>
cd drive-2.0

# Install dependencies
npm install
```

### Step 2: Create Environment File
Create `.env.local` in project root:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# Webhook Configuration
NEXT_PUBLIC_WEBHOOK_URL=https://cloud.activepieces.com/api/v1/webhooks/R4qAlnXmM0gvEUEVoDwF1/sync

# Optional Analytics
NEXT_PUBLIC_ANALYTICS_ID=optional-analytics-id
```

**To get Supabase credentials:**
1. Go to https://supabase.com and create account
2. Create new project
3. Go to Project Settings → API
4. Copy URL and Anon Key

---

## Phase 2: Database Setup

### Step 1: Prepare Database
1. Open Supabase dashboard
2. Navigate to SQL Editor
3. Click "New Query"

### Step 2: Create Schema
1. Copy entire contents of `COMPLETE_SQL_SINGLE_SHOT.sql`
2. Paste into SQL Editor
3. Click "Run" button

**What gets created:**
```
Tables:
✅ users (user accounts)
✅ questions (test questions)
✅ sample_tests (test attempts)
✅ scores (aggregated scores)
✅ progress (progress tracking)
✅ admin_logs (admin operations)

Views:
✅ leaderboard (top performers)
✅ user_statistics (user stats)

Functions:
✅ get_user_stats(user_id)
✅ get_questions_by_level(level, limit)
```

### Step 3: Verify Tables
```sql
-- Run in SQL Editor to verify:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

Should return: users, questions, sample_tests, scores, progress, admin_logs

---

## Phase 3: Application Setup

### Step 1: Install Dependencies
```bash
npm install
# Installs: next, react, typescript, tailwindcss, supabase, and more
```

### Step 2: Verify TypeScript Configuration
```bash
# Check for TypeScript errors
npx tsc --noEmit
```

Expected: No errors

### Step 3: Test Development Server
```bash
npm run dev
# Server starts on http://localhost:3000
```

### Step 4: Verify All Pages Load
- [ ] http://localhost:3000 - Home page
- [ ] http://localhost:3000/login - Login page
- [ ] http://localhost:3000/dashboard - Dashboard (after login)

---

## Phase 4: Initial Data Setup

### Create Test Users
```sql
-- Option A: Using Supabase Auth (Recommended)
-- Use Supabase dashboard Auth section

-- Option B: Direct Database Insert
-- Note: In production, use proper authentication

INSERT INTO users (roll_number, password_hash) 
VALUES 
  ('CS001', 'test_hash_1'),
  ('CS002', 'test_hash_2'),
  ('CS003', 'test_hash_3');
```

### Add Sample Questions

**Manual Method - L1 Questions:**
```sql
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, 
  correct_option, category, difficulty, source)
VALUES 
('What is the SI unit of force?', 'Newton', 'Joule', 'Watt', 'Pascal', 1, 'physics', 'L1', 'manual'),
('Photosynthesis primarily occurs in which organelle?', 'Mitochondria', 'Chloroplast', 'Ribosome', 'Nucleolus', 2, 'biology', 'L1', 'manual'),
('What is the capital of France?', 'Berlin', 'London', 'Paris', 'Madrid', 3, 'general', 'L1', 'manual'),
('What is the atomic number of Carbon?', '6', '8', '12', '14', 1, 'chemistry', 'L1', 'manual'),
('2 + 3 × 4 = ?', '14', '20', '12', '8', 1, 'math', 'L1', 'manual'),
('What does DNA stand for?', 'Deoxyribonucleic Acid', 'Deoxyribose Nucleic Acid', 'Deoxynuclear Acid', 'Acid nucleic Deoxyribose', 1, 'biology', 'L1', 'manual'),
('What is the chemical formula for salt?', 'NaCl', 'CaCl2', 'KCl', 'MgCl2', 1, 'chemistry', 'L1', 'manual');
```

**Webhook Method (Recommended):**
1. Go to Admin Panel (press Konami code: ↑↑↓↓←→←→BA)
2. Click "Generate New Questions"
3. Watch progress bar reach 100%
4. Verify questions loaded

---

## Phase 5: Testing the Application

### Test 1: User Registration & Login
```
1. Go to http://localhost:3000/login
2. Enter Roll Number: CS001
3. Click Login
4. Should redirect to /dashboard
```

### Test 2: Level 1 Test (L1)
```
1. From Dashboard, click "Take L1 Test"
2. Should display 10 questions
3. Answer all questions
4. Click "Submit Test"
5. View score and percentage
```

### Test 3: Level 2 Test (L2)
```
1. From Dashboard, click "Take L2 Test"
2. Should display 15 questions
3. Answer all questions
4. Click "Submit Test"
5. View score and percentage
```

### Test 4: Webhook Synchronization
```
1. Press Konami code: ↑↑↓↓←→←→BA
2. Admin panel should appear
3. Click "Generate New Questions"
4. Progress bar should show: Connecting → Fetching → Parsing → etc.
5. Should reach 100% Complete
6. Check new questions available
```

### Test 5: Statistics & Leaderboard
```
1. Complete several tests
2. Check Dashboard → Statistics
3. Should show: Total Attempts, Average %, Best %, Total Marks
4. Verify leaderboard rankings
```

---

## Phase 6: Production Deployment

### Building for Production
```bash
# Build application
npm run build

# Start production server
npm start
```

### Deployment Platforms

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to connect GitHub repo
```

#### Option B: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.next
```

#### Option C: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables in Production
Set these in your hosting platform's dashboard:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_WEBHOOK_URL

---

## Phase 7: Configuration & Customization

### Customize Test Parameters
Edit `app/dashboard/test/l1/page.tsx` and `l2/page.tsx`:

```typescript
// Change number of questions
const TOTAL_QUESTIONS = 10; // or 15 for L2

// Change points per question
const POINTS_PER_QUESTION = 10;

// Change max marks
const MAX_MARKS = TOTAL_QUESTIONS * POINTS_PER_QUESTION;
```

### Customize Categories
Edit `lib/webhookParser.ts`:

```typescript
const VALID_CATEGORIES = ['physics', 'chemistry', 'math', 'biology'];
// Add or remove categories as needed
```

### Customize Webhook URL
Update `.env.local`:
```env
NEXT_PUBLIC_WEBHOOK_URL=your_new_webhook_url
```

### Customize UI Theme
Edit `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
        secondary: '#your-color',
      },
    },
  },
}
```

---

## Troubleshooting

### Issue: "Cannot find module '@/lib/supabase'"
**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install

# Restart dev server
npm run dev
```

### Issue: "Supabase connection failed"
**Solution:**
1. Verify `.env.local` has correct credentials
2. Check Supabase project is active
3. Verify API URL format: `https://[project].supabase.co`

### Issue: "Tables don't exist"
**Solution:**
1. Go to Supabase SQL Editor
2. Run `COMPLETE_SQL_SINGLE_SHOT.sql` again
3. Verify tables in Table Editor

### Issue: "Webhook returns error"
**Solution:**
1. Check webhook URL is correct
2. Verify webhook server is running
3. Test webhook response format
4. Check network connectivity

### Issue: "Admin panel not showing"
**Solution:**
1. Make sure Konami code is pressed: ↑↑↓↓←→←→BA
2. Open browser DevTools to check console errors
3. Verify `app/admin/superadmin/page.tsx` is accessible

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Use different port
npm run dev -- -p 3001

# Or kill process on port 3000
# On Windows: netstat -ano | findstr :3000
# On Mac/Linux: lsof -i :3000
```

---

## Performance Optimization

### 1. Database Indexing
```sql
-- Add indexes for faster queries
CREATE INDEX idx_user_roll_number ON users(roll_number);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_sample_tests_user_id ON sample_tests(user_id);
```

### 2. Caching Strategy
```typescript
// In components, cache questions in state
const [questions, setQuestions] = useState<Question[]>([]);

// Fetch only when needed
useEffect(() => {
  if (questions.length === 0) {
    loadQuestions();
  }
}, []);
```

### 3. Image Optimization
```typescript
import Image from 'next/image';

<Image 
  src="/logo.png" 
  alt="Logo" 
  width={50} 
  height={50}
/>
```

---

## Security Hardening

### 1. Enable HTTPS
```bash
# In production, always use HTTPS
# Vercel and Netlify automatic SSL/TLS
```

### 2. Secure Environment Variables
```bash
# Never commit .env.local
echo ".env.local" >> .gitignore

# Use secrets manager in production
```

### 3. Implement Authentication
```typescript
// Replace localStorage with JWT
import { useAuth } from '@/lib/auth';

const { user, logout } = useAuth();
```

### 4. Add Rate Limiting
```typescript
// Implement rate limiting middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

---

## Monitoring & Analytics

### Supabase Analytics
1. Go to Supabase Dashboard
2. Check "Database" → "Logs"
3. Monitor query performance

### Application Monitoring
```bash
# Install monitoring tool (optional)
npm install @sentry/nextjs

# Add to next.config.ts
withSentryConfig(nextConfig)
```

### User Activity Logs
```sql
-- Query admin logs
SELECT action, details, created_at FROM admin_logs 
ORDER BY created_at DESC LIMIT 20;
```

---

## Backup & Recovery

### Database Backup
```bash
# Via Supabase Dashboard
1. Go to Project Settings → Backups
2. Click "Back up now"
3. Set automatic daily backups
```

### Code Backup
```bash
# Via Git
git add .
git commit -m "Backup: $(date)"
git push origin main
```

---

## Maintenance Checklist

**Weekly:**
- [ ] Check error logs
- [ ] Monitor database performance
- [ ] Verify backup completion

**Monthly:**
- [ ] Review user statistics
- [ ] Update dependencies: `npm update`
- [ ] Security audit

**Quarterly:**
- [ ] Full security review
- [ ] Performance optimization
- [ ] Database cleanup/archiving

---

## Getting Help

**Resources:**
- Next.js Docs: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org

**Community:**
- Stack Overflow (tag with next.js, supabase)
- Discord communities
- GitHub discussions

---

## Deployment Checklist

Before going live:
- [ ] All tests pass locally
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] Admin credentials secured
- [ ] Error tracking enabled
- [ ] SSL/HTTPS configured
- [ ] DNS records updated
- [ ] Monitoring setup
- [ ] Rate limiting enabled
- [ ] Security audit complete
- [ ] Load testing completed
- [ ] Documentation updated

---

*Setup Guide Version: 1.0*
*Last Updated: 2024*
*Status: Production Ready*
