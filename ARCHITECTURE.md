# System Architecture - Dynamic Questions

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DRIVE 2.0 Platform                            │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ User Takes   │  │ Admin Manages │  │ Scheduled    │           │
│  │ Test         │  │ Questions     │  │ Weekly       │           │
│  │              │  │               │  │ Updates      │           │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘           │
│         │                 │                   │                   │
│         └─────────────────┴───────────────────┘                   │
│                           │                                       │
│                           ▼                                       │
│         ┌──────────────────────────────────────┐                │
│         │   Questions Server Actions           │                │
│         │   (app/actions/questions.ts)         │                │
│         │                                      │                │
│         │  • getQuestionsByLevel()             │                │
│         │  • addQuestion()                     │                │
│         │  • deleteQuestion()                  │                │
│         │  • updateQuestion()                  │                │
│         └──────────────┬───────────────────────┘                │
│                        │                                        │
│                        ▼                                        │
│         ┌──────────────────────────────────────┐                │
│         │      Supabase Database               │                │
│         │                                      │                │
│         │  Table: questions                    │                │
│         │  ├─ id, level, category              │                │
│         │  ├─ question_text                    │                │
│         │  ├─ option_a, option_b, option_c     │                │
│         │  ├─ option_d, correct_option         │                │
│         │  └─ difficulty, created_at           │                │
│         │                                      │                │
│         │  Table: question_update_log          │                │
│         │  ├─ level, questions_added           │                │
│         │  └─ questions_replaced               │                │
│         └──────────────────────────────────────┘                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Question Lifecycle

### 1. Adding Questions (Admin)

```
Admin Panel
  http://localhost:3000/admin/questions
    ↓
Fill form (question, options, correct answer, category)
    ↓
Click "Add Question"
    ↓
Server Action: addQuestion()
    ↓
Insert into Supabase: questions table
    ↓
Form clears, question count updates
    ↓
✅ Question available for tests
```

### 2. Taking Tests (User)

```
User clicks "Take Test"
    ↓
Test Component loads (app/components/TestComponent.tsx)
    ↓
useEffect: calls getQuestionsByLevel(level, 10)
    ↓
Server Action queries Supabase
    ↓
Returns 10 questions for that level
    ↓
Display questions one by one
    ↓
User answers questions
    ↓
Click "Submit Test"
    ↓
Calculate score (compare with correct_option)
    ↓
Save score to scores table
    ↓
Show results
    ↓
✅ Test complete
```

### 3. Weekly Updates (Automated)

```
Every Sunday 00:00 UTC
    ↓
Scheduled job triggers
    ↓
POST /api/cron/update-questions
    ↓
Verify CRON_SECRET in Authorization header
    ↓
Execute update logic
  (can replace old questions, add new ones, etc.)
    ↓
Log update in question_update_log
    ↓
✅ Changes live immediately
```

---

## 📂 File Structure

```
drive-2.0/
├── app/
│   ├── actions/
│   │   ├── auth.ts                 (user authentication)
│   │   ├── dashboard.ts            (scores, progress)
│   │   └── questions.ts            ✨ NEW - question CRUD
│   │
│   ├── components/
│   │   └── TestComponent.tsx        📝 UPDATED - uses database
│   │
│   ├── admin/
│   │   └── questions/
│   │       └── page.tsx            ✨ NEW - admin panel UI
│   │
│   ├── api/
│   │   └── cron/
│   │       └── update-questions/
│   │           └── route.ts        ✨ NEW - scheduled updates
│   │
│   └── dashboard/
│       ├── page.tsx                (main dashboard)
│       └── test/[level]/page.tsx   (test interface)
│
├── scripts/
│   ├── seed-questions.ts           ✨ NEW - initial import
│   └── import-questions.py         ✨ NEW - bulk import tool
│
├── IMPLEMENTATION_GUIDE.md         ✨ NEW - detailed setup
├── QUICK_START.md                  ✨ NEW - quick reference
├── QUESTIONS_SETUP.md              ✨ NEW - database schema
└── .env.local                      (add CRON_SECRET)
```

---

## 🗄️ Database Schema

### questions table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Auto-generated ID |
| level | INT | 1, 2, or 3 |
| category | VARCHAR | "Aptitude", "Series", "DSA", etc. |
| question_text | TEXT | The question |
| option_a | VARCHAR | Option A |
| option_b | VARCHAR | Option B |
| option_c | VARCHAR | Option C |
| option_d | VARCHAR | Option D |
| correct_option | INT | 1=A, 2=B, 3=C, 4=D |
| difficulty | VARCHAR | "Easy", "Medium", "Hard" |
| source | VARCHAR | "India Bix", "Manual", "API", etc. |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-set |

### question_update_log table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Auto-generated ID |
| level | INT | Which level was updated |
| questions_added | INT | New questions added |
| questions_replaced | INT | Questions replaced |
| updated_at | TIMESTAMP | When update ran |

---

## 🚀 Usage Examples

### Add Question Programmatically

```typescript
import { addQuestion } from '@/app/actions/questions';

await addQuestion(
  1,                                    // level
  "Aptitude",                          // category
  "What is 15% of 200?",               // question
  ["15", "20", "30", "40"],            // [optionA, optionB, optionC, optionD]
  3,                                   // correct (3 = option C)
  "Easy",                              // difficulty
  "Manual"                             // source
);
```

### Get Questions for Test

```typescript
import { getQuestionsByLevel } from '@/app/actions/questions';

const result = await getQuestionsByLevel(1, 10);
if (result.success) {
  const questions = result.data;
  // Use questions in test component
}
```

### Check Statistics

```typescript
import { getQuestionCountByLevel } from '@/app/actions/questions';

const result = await getQuestionCountByLevel();
console.log(result.data);
// { level1: 15, level2: 12, level3: 8 }
```

---

## ⚙️ Configuration

### Environment Variables (.env.local)

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# New
CRON_SECRET=your-super-secret-key-change-me-in-production
```

### Cron Job Configuration

**Vercel (vercel.json)**
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

**EasyCron**
- URL: `https://your-domain.com/api/cron/update-questions`
- Schedule: Every Sunday 00:00
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

**GitHub Actions (.github/workflows/update-questions.yml)**
```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at 00:00 UTC
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X GET 'https://your-domain.com/api/cron/update-questions' \
            -H 'authorization: Bearer ${{ secrets.CRON_SECRET }}'
```

---

## ✨ Key Features

✅ **Dynamic Questions** - Update without code changes  
✅ **Admin Panel** - Easy question management  
✅ **Automatic Updates** - Weekly refresh schedule  
✅ **Category Support** - Organize by topics  
✅ **Difficulty Levels** - Easy/Medium/Hard  
✅ **Update History** - Track all changes  
✅ **Error Handling** - Graceful failures  
✅ **Database Indexes** - Fast queries  

---

## 🔍 Monitoring & Maintenance

### Check Question Count
```sql
SELECT level, COUNT(*) as count
FROM questions
GROUP BY level
ORDER BY level;
```

### View Recent Updates
```sql
SELECT * FROM question_update_log
ORDER BY updated_at DESC
LIMIT 5;
```

### Questions by Category
```sql
SELECT level, category, COUNT(*) as count
FROM questions
GROUP BY level, category
ORDER BY level, category;
```

### Archive Old Questions
```sql
CREATE TABLE questions_archive AS
SELECT * FROM questions
WHERE updated_at < NOW() - INTERVAL '30 days';

DELETE FROM questions
WHERE updated_at < NOW() - INTERVAL '30 days';
```

---

## 💡 Next Steps

1. ✅ Create database tables
2. ✅ Add sample questions via admin panel
3. ✅ Test the system
4. ✅ Set up automatic weekly updates
5. 📈 Monitor and refine questions based on student performance

