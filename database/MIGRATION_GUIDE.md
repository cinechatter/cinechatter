# CineChatter Database Migration Guide

Quick reference for running database migrations.

---

## 🎯 Quick Start (New Database)

Run these **in order** in Supabase SQL Editor:

```
1. migrations/001_initial_schema.sql       ← Base tables
2. migrations/002_auth_triggers.sql        ← Auto-profile creation
3. migrations/003_admin_approval_system.sql ← Admin system
4. utilities/promote_first_admin.sql       ← Make yourself admin
```

**Time:** ~2 minutes total

---

## 📂 File Organization

```
database/
├── migrations/           ← Run these in order (001, 002, 003...)
│   ├── 001_initial_schema.sql
│   ├── 002_auth_triggers.sql
│   └── 003_admin_approval_system.sql
│
├── utilities/            ← Run when needed (maintenance)
│   ├── check_user_sync.sql
│   ├── fix_missing_profiles.sql
│   └── promote_first_admin.sql
│
├── docs/                 ← Old documentation (reference)
├── archive/              ← Deprecated scripts (don't use)
└── README.md             ← Full documentation
```

---

## 🔢 Migration Breakdown

### **001_initial_schema.sql** (Required)
**What it does:**
- Creates core tables (users, articles, categories, etc.)
- Adds indexes for performance
- Sets up update triggers

**Run when:** Fresh database setup

---

### **002_auth_triggers.sql** (Required)
**What it does:**
- Auto-creates user profile when someone signs up
- Tracks newsletter subscriptions

**Run when:** After 001

---

### **003_admin_approval_system.sql** (Required)
**What it does:**
- Adds admin approval workflow
- Sets up Row Level Security
- Creates `admin_status` field (NULL/P/A/R)

**Run when:** After 002

**Status codes:**
- `NULL` = Regular user
- `P` = Pending approval
- `A` = Approved admin
- `R` = Rejected

---

## 🛠 Utility Scripts (Optional)

### **promote_first_admin.sql**
**Use:** Make someone an admin
**Edit:** Change email in script before running

### **check_user_sync.sql**
**Use:** Check if auth and profiles are synced
**No edit needed**

### **fix_missing_profiles.sql**
**Use:** Create missing user profiles
**Run:** If check_user_sync shows issues

---

## ✅ Verification Steps

After running all migrations:

### 1. Check tables exist
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```
**Expected:** categories, articles, users, admin_settings, google_sheets_sync

### 2. Check admin column
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'admin_status';
```
**Expected:** admin_status

### 3. Test security
```sql
SELECT is_admin();
```
**Expected:** TRUE (if you're admin) or FALSE

---

## 🚨 Common Issues

### Issue: "relation already exists"
**Cause:** Migration already run
**Fix:** Skip that migration, it's already done

### Issue: "column already exists"
**Cause:** Column already added
**Fix:** Safe to ignore or skip

### Issue: Dashboard not showing
**Cause:** Not promoted to admin
**Fix:** Run `utilities/promote_first_admin.sql`

---

## 📋 Checklist

Fresh database setup:
- [ ] Run 001_initial_schema.sql
- [ ] Run 002_auth_triggers.sql
- [ ] Run 003_admin_approval_system.sql
- [ ] Edit utilities/promote_first_admin.sql with your email
- [ ] Run utilities/promote_first_admin.sql
- [ ] Refresh app and check Dashboard button appears
- [ ] Test creating a test user via `#admin` URL
- [ ] Test approval workflow

---

## 🔗 Quick Links

- Supabase SQL Editor: `https://supabase.com/dashboard/project/YOUR_ID/sql`
- Auth Users: `https://supabase.com/dashboard/project/YOUR_ID/auth/users`
- Table Editor: `https://supabase.com/dashboard/project/YOUR_ID/editor`

---

## 📞 Need Help?

1. Check README.md for detailed docs
2. Run utilities/check_user_sync.sql to diagnose
3. Check archive/ for old scripts (reference only)

---

**Last Updated:** 2024-11-12
**Version:** 1.0
