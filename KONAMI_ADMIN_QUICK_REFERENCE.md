# 🎮 KONAMI CODE SUPER ADMIN - QUICK REFERENCE

## ⚡ Quick Start

### Unlock Admin Panel
```
Press this sequence: ↑ ↑ ↓ ↓ ← → ← → P M
Or: Up Up Down Down Left Right Left Right P M
```

### Access Points
1. **From Dashboard**: Click "🎮 Admin" button (top right)
2. **Direct URL**: `http://localhost:3000/admin/superadmin`
3. **Keyboard**: Just enter Konami code from anywhere!

---

## 📋 What You Can Do

### 👥 User Management (CRUD)
- ✅ View ALL users in database
- ✅ Search users by Roll Number or ID
- ✅ See user performance (scores, levels)
- ✅ View user details and history
- ✅ Delete individual users
- ✅ Delete users + ALL their data

### ❓ Question Management (CRUD)
- ✅ View all questions by level
- ✅ Filter Level 1, 2, 3
- ✅ See question category & difficulty
- ✅ Delete bad questions
- ✅ Add new questions (quick link)
- ✅ See correct answers (green highlighted)

### 📊 Dashboard & Stats
- ✅ Total users count
- ✅ Total test submissions
- ✅ User progress entries
- ✅ Quick access to all features

---

## 🎯 Common Operations

### Find a User
1. Click "👥 Users"
2. Search by Roll Number
3. Click Search button
4. User appears in table

### Delete a User
1. Find user in list
2. Click "Delete" button
3. Confirm in popup
4. ⚠️ ALL their data deleted permanently

### View User Scores
1. Find user in list
2. Click "View" button
3. See all their test submissions
4. See performance metrics

### Manage Questions
1. Click "❓ Questions"
2. Select Level (1, 2, 3)
3. Questions display
4. Click Delete to remove
5. Click "Add" link to add more

---

## 🔑 Access Levels

```
┌─────────────────────────────────────┐
│ Regular User                        │
│ ├─ Can take tests                  │
│ ├─ Can see own scores              │
│ └─ View leaderboard                │
├─────────────────────────────────────┤
│ Admin (Konami Code)                │
│ ├─ View ALL users                  │
│ ├─ Delete users                    │
│ ├─ Manage questions (CRUD)         │
│ ├─ View all scores                 │
│ ├─ Edit user data                  │
│ └─ System statistics               │
└─────────────────────────────────────┘
```

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `hooks/useKonamiCode.ts` | Detects Konami code |
| `app/actions/admin.ts` | User CRUD operations |
| `app/admin/superadmin/page.tsx` | Admin dashboard UI |
| `app/dashboard/page.tsx` | Updated with admin button |

---

## 🧪 Test It

1. **Login** to dashboard
2. **Press Konami Code**: ↑ ↑ ↓ ↓ ← → ← → P M
3. Click "🎮 Admin" button or go to `/admin/superadmin`
4. **Unlock** screen should disappear
5. **Dashboard** should load with all features visible

---

## ⚠️ Be Careful!

- ❌ **Delete User**: Removes person + ALL scores permanently
- ❌ **Delete Question**: Cannot be undone
- ❌ **Konami Code**: Grants full access - don't share!

---

## 🌟 Features Matrix

| Feature | Admin | User |
|---------|-------|------|
| View own profile | ✅ | ✅ |
| View all users | ✅ | ❌ |
| Delete users | ✅ | ❌ |
| Manage questions | ✅ | ❌ |
| See stats | ✅ | ✅ (own) |
| Take tests | ✅ | ✅ |
| View leaderboard | ✅ | ✅ |

---

## 🚀 Keyboard Shortcut

You can trigger admin unlock from **anywhere** on the site:
- Just press: ↑ ↑ ↓ ↓ ← → ← → P M
- Then navigate to: `/admin/superadmin`
- OR click admin button in dashboard

---

## 📞 Troubleshooting

| Problem | Solution |
|---------|----------|
| Konami code not working | Check press sequence exactly |
| Can't see admin on dashboard | Refresh page, clear cache |
| Delete doesn't work | Confirm in popup, check DB |
| Search not finding users | Use exact Roll Number or ID |

---

## 💡 Pro Tips

1. **Use Search** to find specific users quickly
2. **View Details** to see complete user history
3. **Delete Wisely** - use "View" first to confirm
4. **Batch Check** - scan through Users table regularly
5. **Monitor Stats** - check Dashboard tab for trends

---

## ✅ Complete Features

✅ Konami Code unlock  
✅ User listing  
✅ User search  
✅ User details  
✅ User deletion  
✅ Cascade delete (user + data)  
✅ User statistics  
✅ Question CRUD  
✅ Question filtering by level  
✅ Question deletion  
✅ System dashboard  
✅ Real-time stats  

---

**Ready to admin! 🎮** Press the Konami code and unlock full control!
