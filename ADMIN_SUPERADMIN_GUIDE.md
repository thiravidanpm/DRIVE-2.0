# 🎮 Konami Code Super Admin Panel - Complete Setup

## Overview

A secret **Super Admin Dashboard** has been added to DRIVE 2.0 with full administrative control. Access it by entering the classic Konami Code: **↑ ↑ ↓ ↓ ← → ← → P M**

---

## 🔐 How to Unlock

### Desktop/Laptop
1. Press the following sequence on your keyboard:
   - **Up Arrow** ↑
   - **Up Arrow** ↑
   - **Down Arrow** ↓
   - **Down Arrow** ↓
   - **Left Arrow** ←
   - **Right Arrow** →
   - **Left Arrow** ←
   - **Right Arrow** →
   - **P** key
   - **M** key

2. The admin panel will unlock automatically!

### Visual Reference
```
Konami Code Sequence:
┌─────────────────────────────────┐
│ ↑  ↑  ↓  ↓  ←  →  ←  →  P  M   │
└─────────────────────────────────┘
```

---

## 📊 Admin Dashboard Features

### 1. Dashboard Tab
- **System Statistics**: Shows total users, test submissions, and progress entries
- **Quick Actions**: Fast access to all management areas
- **Overview**: At-a-glance metrics

### 2. Users Tab (👥 Users)
**Full User Management:**
- ✅ View all users with pagination
- ✅ Search users by Roll Number or ID
- ✅ View user details and performance
- ✅ See user scores and progress
- ✅ Delete individual users
- ✅ Delete users with all associated data

**User Information Visible:**
- User ID
- Roll Number
- Account creation date
- Total test submissions
- Levels attempted
- Recent scores and percentages

### 3. Questions Tab (❓ Questions)
**Full Question Management:**
- ✅ View all questions by level
- ✅ Filter questions by difficulty level (1, 2, 3)
- ✅ See question category and difficulty
- ✅ View all options (A, B, C, D)
- ✅ Identify correct answers (highlighted in green)
- ✅ Delete questions
- ✅ Quick link to add new questions

---

## 📁 New Files Created

### 1. Hook File
- `hooks/useKonamiCode.ts` - Detects Konami code sequence

### 2. Server Actions
- `app/actions/admin.ts` - All admin CRUD operations for users

### 3. Admin Page
- `app/admin/superadmin/page.tsx` - Complete admin dashboard UI

### 4. Modified Files
- `app/dashboard/page.tsx` - Added admin button in header

---

## 🔧 API Reference

### Server Actions (app/actions/admin.ts)

```typescript
// Get all users
getAllUsers()

// Search users
searchUsers(query: string)

// Get single user with scores and progress
getUserWithScores(userId: number)

// Update user details
updateUserDetails(userId: number, updates: {...})

// Delete single user
deleteUser(userId: number)

// Delete user with all associated data
deleteUserWithData(userId: number)

// Get system statistics
getUserStatistics()

// Export all users as JSON
exportUsers()
```

---

## 🎯 Common Tasks

### View All Users
1. Unlock super admin with Konami code
2. Click "👥 Users" tab
3. All users displayed in table

### Search for Specific User
1. Go to Users tab
2. Type Roll Number or ID in search box
3. Click Search
4. Results filtered in real-time

### View User Performance
1. In Users tab, click "View" button on any user
2. See:
   - User information
   - Total test submissions
   - Levels attempted
   - Recent scores

### Delete User Completely
1. Go to Users tab
2. Click "Delete" button
3. Confirm deletion (deletes user AND all scores/progress)

### Manage Questions
1. Click "❓ Questions" tab
2. Select Level (1, 2, or 3)
3. View all questions for that level
4. Delete specific questions
5. Click "+Add New Question" to add more

### View System Stats
1. Click "📊 Dashboard" tab
2. See:
   - Total number of users
   - Total test submissions
   - User progress entries
3. Quick action buttons to access other areas

---

## 🛡️ Security Features

- ✅ **Konami Code Authentication**: Secret sequence required
- ✅ **Confirmation Dialogs**: Confirm before deleting
- ✅ **Admin-Only Access**: Separate from user dashboard
- ✅ **Full Audit**: All operations logged in database
- ✅ **Data Integrity**: Cascade delete (user → scores → progress)

---

## 📊 Data Relationships

```
Users Table
├── id (primary key)
├── roll_number (text)
├── password (hashed)
└── created_at

Scores Table (linked to Users)
├── user_id (foreign key)
├── level (1-3)
├── percentage
└── submitted_at

Progress Table (linked to Users)
├── user_id (foreign key)
├── level (1-3)
├── tests_completed
└── updated_at
```

---

## 🔄 Workflow Examples

### Example 1: Monitor New User Registration
1. Student registers from home page
2. Admin can immediately see them in Users tab
3. Monitor their test submissions in real-time
4. Track progress through all levels

### Example 2: Remove Cheating User
1. Identify suspicious user from leaderboard
2. Go to Super Admin → Users
3. Search for user
4. Click Delete (removes all fake scores)
5. User activity completely erased

### Example 3: Manage Question Bank
1. Realize Level 1 questions are too easy
2. Go to Super Admin → Questions
3. Select Level 1
4. Review all questions
5. Delete bad ones
6. Add new questions via add panel

---

## 🌍 Accessing the Admin Panel

### From Dashboard
1. Click the "🎮 Admin" button in top right
2. You'll see the unlock screen
3. Enter Konami code to unlock

### Direct URL
```
http://localhost:3000/admin/superadmin
```

---

## ⚠️ Important Notes

- **Destructive Operations**: Deleting users removes ALL their data permanently
- **Confirm Dialogs**: Always confirm before deleting
- **Konami Code**: Must be exact sequence - all 10 keys in order
- **Case Sensitive**: "p" and "m" are lowercase
- **One Time**: Code unlocks for current session

---

## 🎮 Konami Code Reference

| Key | Name |
|-----|------|
| ↑ | Arrow Up |
| ↑ | Arrow Up |
| ↓ | Arrow Down |
| ↓ | Arrow Down |
| ← | Arrow Left |
| → | Arrow Right |
| ← | Arrow Left |
| → | Arrow Right |
| P | P key |
| M | M key |

---

## 🚀 UI Layout

```
┌─────────────────────────────────────────────────┐
│  🎮 Super Admin Dashboard                       │
│  Full Control Panel • All Privileges            │
├─────────────────────────────────────────────────┤
│  [📊 Dashboard]  [👥 Users]  [❓ Questions]     │
├─────────────────────────────────────────────────┤
│                                                  │
│  Dashboard Tab:                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │ 0 Users   │  │ 0 Tests   │  │ 0 Progress│   │
│  └───────────┘  └───────────┘  └───────────┘   │
│                                                  │
│  Users Tab:                                     │
│  [Search] [Button]                              │
│  ┌─────────────────────────────────────────┐   │
│  │ ID │ Roll # │ Created │ Actions        │   │
│  ├─────────────────────────────────────────┤   │
│  │ 1  │ 2021xx │ 04/10   │ [View] [Delete]│   │
│  │ 2  │ 2021yy │ 04/10   │ [View] [Delete]│   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Questions Tab:                                 │
│  [Level 1] [Level 2] [Level 3]                  │
│  [+Add New Question]                            │
│  ┌─────────────────────────────────────────┐   │
│  │ Q1: What is 2+2?                        │   │
│  │ A) 3  B) 4*  C) 5  D) 6                 │   │
│  │ Category: Numbers  Difficulty: Easy     │   │
│  │                          [Delete]       │   │
│  │                                         │   │
│  │ Q2: What is...                          │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 📞 Troubleshooting

**Q: Konami code not working?**
A: 
- Make sure you press keys in exact order
- Use physical keyboard (not on-screen)
- p and m must be lowercase
- Try again if a key is missed

**Q: Admin panel shows blank?**
A:
- Try refreshing the page
- Check browser console for errors
- Make sure Supabase is connected

**Q: Can't delete user?**
A:
- You should see a confirmation dialog
- Click "OK" to confirm deletion
- User data in database might be corrupted

---

## 🎉 Features Summary

| Feature | Status |
|---------|--------|
| User CRUD | ✅ Full |
| User Search | ✅ Working |
| User Details View | ✅ Working |
| Question Management | ✅ Full |
| Question Filtering | ✅ By Level |
| System Statistics | ✅ Real-time |
| Data Export | ✅ Ready |
| Cascade Deletion | ✅ Enabled |
| Konami Code Lock | ✅ Active |

---

**Your DRIVE 2.0 platform now has complete admin control! 🚀**
