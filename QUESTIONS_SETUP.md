# Dynamic Questions System Setup

## Database Schema

### 1. Create Questions Table in Supabase

```sql
-- Questions table
CREATE TABLE questions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  level INT NOT NULL (1, 2, or 3),
  category VARCHAR(50) NOT NULL (Aptitude, Coding, etc.),
  question_text TEXT NOT NULL,
  option_a VARCHAR(500) NOT NULL,
  option_b VARCHAR(500) NOT NULL,
  option_c VARCHAR(500) NOT NULL,
  option_d VARCHAR(500) NOT NULL,
  correct_option INT NOT NULL (1=A, 2=B, 3=C, 4=D),
  difficulty VARCHAR(20) DEFAULT 'Medium',
  source VARCHAR(100) (e.g., 'India Bix', 'Manual'),
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_questions_level ON questions(level);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_updated ON questions(updated_at);

-- Question update log
CREATE TABLE question_update_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  level INT NOT NULL,
  questions_added INT,
  questions_replaced INT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Manual Question Entry (Recommended for Starting)

You can manually add questions or use the provided Python script to fetch from India Bix.

## Question Categories by Level

**Level 1 (Beginner)** - Aptitude
- Numbers
- Percentage
- Ratio & Proportion
- Time & Work
- Average
- Problems on Ages

**Level 2 (Intermediate)** - Logical Reasoning + Aptitude
- Series
- Coding-Decoding
- Blood Relations
- Syllogism
- Data Arrangement

**Level 3 (Advanced)** - Coding + Problem Solving
- DSA Problems
- Algorithms
- Complex Logic
- System Design Basics

## Implementation Options

### Option 1: Manual Management (Simple & Recommended)

Create an admin panel to manually add/update questions every week.

### Option 2: Automated Web Scraping (Advanced)

Use a scheduled function to fetch from India Bix or similar sites.

### Option 3: API Integration

Use free question APIs or build your own API.
