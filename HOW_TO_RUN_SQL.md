# 🎯 CLEAR SQL EXECUTION ORDER - 2 LEVELS ONLY (L1 & L2)

## ⚡ QUICK SUMMARY
You need to run **2 SQL queries** in this exact order:

| Order | Name | What it does |
|-------|------|--------------|
| 1️⃣ **FIRST** | STEP 1: CREATE TABLES | Creates 6 database tables |
| 2️⃣ **SECOND** | STEP 2: CREATE INDEXES | Creates performance indexes |

---

## 📋 STEP 1️⃣: CREATE TABLES (RUN FIRST)

### WHERE TO GO:
1. Open **Supabase Dashboard**
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**

### WHAT TO COPY:
Open file: `SUPABASE_2_LEVELS_ONLY.sql`

Copy **EVERYTHING** from:
```sql
CREATE TABLE IF NOT EXISTS users (
```
To:
```sql
CREATE TABLE IF NOT EXISTS admin_logs (
```

### WHAT TO DO:
1. Paste in Supabase SQL Editor
2. Click **RUN** button (top right)
3. Wait for ✅ **Success message**

### TABLES CREATED:
- `users` - Student profiles
- `questions` - Test questions (L1 & L2)
- `sample_tests` - Student test attempts
- `scores` - Student scores summary
- `progress` - Student level progress
- `admin_logs` - Admin activity logs

---

## 📋 STEP 2️⃣: CREATE INDEXES (RUN SECOND)

### ⚠️ WAIT FOR STEP 1 TO FINISH FIRST!

### WHERE TO GO:
Same as Step 1:
1. Supabase → SQL Editor
2. Click **New Query** (create a NEW one!)

### WHAT TO COPY:
From same file: `SUPABASE_2_LEVELS_ONLY.sql`

Copy **EVERYTHING** from:
```sql
CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number);
```
To the end (before comments)

### WHAT TO DO:
1. Paste in Supabase SQL Editor
2. Click **RUN** button
3. Wait for ✅ **Success message**

### INDEXES CREATED:
- Fast lookup by roll_number
- Fast filter by level
- Fast filter by category
- Fast filter by difficulty
- Fast filter by user tests
- And many more...

---

## ✅ DONE!

Your database is now **completely set up** with:
- ✅ 6 tables created
- ✅ All relationships configured
- ✅ All indexes created
- ✅ Ready for L1 and L2 tests

---

## 🚀 NEXT STEPS

1. **Insert Sample Questions** - Run the sample data queries from `SUPABASE_QUERIES.sql`
2. **Test Your App** - Run `npm run dev` and test L1 & L2 pages
3. **Connect Webhook** - Set up webhook sync in admin panel

---

## 📝 FILE REFERENCE

| File | Purpose |
|------|---------|
| `SUPABASE_2_LEVELS_ONLY.sql` | **← USE THIS** (Clearest version with just tables & indexes) |
| `SUPABASE_QUERIES.sql` | Full schema with sample questions |
| `SUPABASE_STEP_BY_STEP.sql` | Multiple sections including views & functions |

---

## ❓ TROUBLESHOOTING

### Error: "Column does not exist"
**Cause:** You ran Step 2 before Step 1  
**Fix:** Run Step 1 first and wait for success

### Error: "Table already exists"
**Cause:** You already ran this before  
**Fix:** It's fine, it uses `IF NOT EXISTS` - just run it again

### Error: "Foreign key constraint"
**Cause:** Tables aren't in right order  
**Fix:** Drop all tables and start fresh

---

## 💡 REMEMBER

- **L1 & L2 only** (no L3)
- **2 queries to run** in order
- **Wait between queries**
- Use text file `SUPABASE_2_LEVELS_ONLY.sql` for best clarity
