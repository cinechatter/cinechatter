# 🚀 START HERE - CineChatter Database Setup

Quick guide to get your database running in minutes!

---

## ⚡ Fastest Setup (Recommended)

### 1. Run Master Script
```
File: master_fresh_install.sql
Location: Supabase SQL Editor
Time: 30 seconds
```

### 2. Make Yourself Admin
```
File: utilities/promote_first_admin.sql
Edit: Change email to yours
Run: Supabase SQL Editor
Time: 10 seconds
```

### 3. Done! ✅
- Database is ready
- You're an admin
- Start building!

---

## 📚 Documentation Files

| File | Purpose | When to Read |
|------|---------|--------------|
| `START_HERE.md` | This file - quick start | **Read first** |
| `README.md` | Complete documentation | Reference guide |
| `MIGRATION_GUIDE.md` | Step-by-step setup | Detailed walkthrough |
| `DEVELOPMENT_WORKFLOW.md` | Pre/post-launch workflow | **Important for development** |

---

## 🎯 Current Status

**Phase:** Pre-Launch Development
**Strategy:** Update existing migrations (not create new ones)
**Master Script:** Keep in sync with migrations

---

## 💡 Development Workflow

### Before Every Database Change, I'll Ask:

> "Is the CineChatter site live in production yet?"

**Your Answer Determines:**

### If NO (Current):
- ✅ Update existing migration files
- ✅ Update master_fresh_install.sql
- ✅ Fast iteration

### If YES (Future):
- ✅ Create NEW migration files (004, 005, etc.)
- ✅ Update master_fresh_install.sql
- ✅ Protect production data

**See:** `DEVELOPMENT_WORKFLOW.md` for details

---

## 📂 Folder Guide

```
database/
├── master_fresh_install.sql     ← USE THIS for fresh setup
├── DEVELOPMENT_WORKFLOW.md      ← READ THIS for workflow
├── README.md                    ← Full documentation
├── MIGRATION_GUIDE.md           ← Detailed setup guide
│
├── migrations/                  ← Individual migrations (optional)
│   ├── 001_initial_schema.sql
│   ├── 002_auth_triggers.sql
│   └── 003_admin_approval_system.sql
│
├── utilities/                   ← Helper tools
│   ├── promote_first_admin.sql  ← Make user admin
│   ├── check_user_sync.sql      ← Diagnose issues
│   └── fix_missing_profiles.sql ← Fix sync issues
│
├── docs/                        ← Old documentation
└── archive/                     ← Old scripts (don't use)
```

---

## ✅ Quick Checklist

First time setup:
- [ ] Read this file (START_HERE.md)
- [ ] Run `master_fresh_install.sql` in Supabase
- [ ] Edit `utilities/promote_first_admin.sql` with your email
- [ ] Run `utilities/promote_first_admin.sql`
- [ ] Read `DEVELOPMENT_WORKFLOW.md`
- [ ] Test signup at `localhost:3000#admin`
- [ ] Done!

---

## 🆘 Need Help?

1. **Setup Issues:** Read `MIGRATION_GUIDE.md`
2. **User Sync Problems:** Run `utilities/check_user_sync.sql`
3. **Can't Login:** Run `utilities/fix_missing_profiles.sql`
4. **Dashboard Missing:** Run `utilities/promote_first_admin.sql`

---

## 🎉 That's It!

Your database is ready. Happy coding! 🚀

**Next Steps:**
1. Test the app
2. Create test users
3. Test admin approval flow
4. Build features!

---

Created: 2024-11-12
Version: 1.0
Status: Pre-Launch Development
