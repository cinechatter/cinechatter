## CineChatter Database Structure

Organized database scripts for easy maintenance and future migrations.

---

## 📁 Folder Structure

```
database/
├── master_fresh_install.sql     # ⭐ ONE-FILE fresh setup (recommended)
├── migrations/                  # Versioned changes (pre-launch: editable)
│   ├── 001_initial_schema.sql
│   ├── 002_auth_triggers.sql
│   └── 003_admin_approval_system.sql
├── utilities/                   # Helper scripts for maintenance
│   ├── check_user_sync.sql
│   ├── fix_missing_profiles.sql
│   └── promote_first_admin.sql
├── docs/                        # Documentation files
│   └── DEVELOPMENT_WORKFLOW.md  # Pre/post-launch workflow
├── archive/                     # Old/deprecated scripts (reference only)
├── README.md                    # This file
└── MIGRATION_GUIDE.md           # Quick start guide
```

---

## 🚀 Fresh Database Setup

You have **TWO OPTIONS** for setting up a fresh database:

### **Option A: Single Master Script (FASTEST) ⭐**

Run just ONE file:
```sql
-- 1. Run: master_fresh_install.sql
-- This includes everything: tables, triggers, admin system, RLS

-- 2. Run: utilities/promote_first_admin.sql
-- Update the email first, then run to make yourself admin
```

**Time:** ~30 seconds
**Pros:** Fast, simple, one script
**Use when:** Fresh install, don't care about migration history

---

### **Option B: Individual Migrations (LEARNING)**

Run migrations in order (same result as Option A):

```sql
-- 1. Run: migrations/001_initial_schema.sql
-- 2. Run: migrations/002_auth_triggers.sql
-- 3. Run: migrations/003_admin_approval_system.sql
-- 4. Run: utilities/promote_first_admin.sql
```

**Time:** ~2 minutes
**Pros:** See migration history, understand each change
**Use when:** Want to learn the structure, or updating existing DB

---

**Both options create the exact same database!** Choose based on your preference.

---

## 📋 Migration Details

### **001_initial_schema.sql**
**Purpose:** Base database structure
**Creates:**
- Tables: `categories`, `articles`, `users`, `admin_settings`, `google_sheets_sync`
- Function: `update_updated_at_column()`
- Indexes for performance
- Update triggers

**When to run:** First time setup only

---

### **002_auth_triggers.sql**
**Purpose:** Automatic user profile management
**Creates:**
- Function: `handle_new_user()` - Auto-creates profile on signup
- Function: `set_subscribed_on()` - Tracks newsletter subscriptions
- Triggers on `auth.users` and `users` table

**When to run:** After 001, first time setup only

---

### **003_admin_approval_system.sql**
**Purpose:** Admin approval workflow with security
**Creates:**
- Column: `admin_status` CHAR(1) - NULL/'P'/'A'/'R'
- Columns: Request tracking (message, timestamps, reviewer)
- Function: `is_admin()` - Security definer for RLS
- RLS Policies: Row-level security for user data

**When to run:** After 002, first time setup only

**Status Codes:**
- `NULL` = Regular user (default)
- `'P'` = Pending approval
- `'A'` = Approved admin
- `'R'` = Rejected

---

## 🛠 Utility Scripts

### **check_user_sync.sql**
**Purpose:** Diagnose user sync issues
**Use when:** Users can't login or profiles are missing
**Returns:** List of auth users without profiles, orphaned profiles, summary

### **fix_missing_profiles.sql**
**Purpose:** Create missing user profiles
**Use when:** `check_user_sync.sql` shows missing profiles
**Action:** Auto-creates profiles for all auth users

### **promote_first_admin.sql**
**Purpose:** Manually promote a user to admin
**Use when:** Setting up first admin or emergency admin access
**Action:** Sets `admin_status = 'A'` for specified email

---

## 🔄 Existing Database Migration

If you already have a database and need to add the admin approval system:

1. **Check current state:**
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'users' AND column_name LIKE 'admin%';
   ```

2. **If no admin columns exist:**
   - Run `migrations/003_admin_approval_system.sql`

3. **If you have old `is_admin` column:**
   - Data will be migrated automatically by 003 migration
   - Old column will be dropped

---

## 📊 Database Schema Overview

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `categories` | Article categories | name, slug, parent_id |
| `articles` | Blog posts | title, content, category_id, status |
| `users` | User profiles | email, name, admin_status |
| `admin_settings` | Site configuration | setting_key, setting_value |
| `google_sheets_sync` | Google Sheets integration | sheet_url, sync_status |

### Admin Status Flow

```
User Requests Admin
        ↓
admin_status = 'P' (Pending)
        ↓
    Admin Reviews
        ↓
   ┌────┴────┐
   ↓         ↓
Approve   Reject
   ↓         ↓
   'A'      'R'
```

---

## 🔐 Security Features

### Row Level Security (RLS)
- **Enabled on:** `users` table
- **Regular users:** Can only see their own profile
- **Admins:** Can see all users and pending requests
- **Enforcement:** Database-level (cannot be bypassed from frontend)

### Helper Function
```sql
is_admin() → BOOLEAN
-- Returns TRUE if current user has admin_status = 'A'
-- Used in RLS policies for secure access control
```

---

## 🧪 Testing Database Changes

After running migrations:

1. **Verify tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. **Check RLS policies:**
   ```sql
   SELECT tablename, policyname FROM pg_policies
   WHERE tablename = 'users';
   ```

3. **Test as regular user:**
   - Create account via app
   - Check `admin_status` is NULL or 'P'
   - Verify cannot see other users

4. **Test as admin:**
   - Promote user to admin
   - Check can see all users
   - Verify can approve requests

---

## 📝 Common Operations

### View all admins
```sql
SELECT email, name, admin_status
FROM users
WHERE admin_status = 'A';
```

### View pending requests
```sql
SELECT email, name, admin_request_message, admin_requested_at
FROM users
WHERE admin_status = 'P'
ORDER BY admin_requested_at DESC;
```

### Approve a request
```sql
UPDATE users
SET admin_status = 'A',
    admin_reviewed_at = NOW(),
    admin_reviewed_by = 'admin@example.com'
WHERE email = 'user-to-approve@example.com';
```

### Reject a request
```sql
UPDATE users
SET admin_status = 'R',
    rejection_reason = 'Not authorized',
    admin_reviewed_at = NOW(),
    admin_reviewed_by = 'admin@example.com'
WHERE email = 'user-to-reject@example.com';
```

---

## 🗂 Archive Folder

Old scripts kept for reference only (DO NOT RUN):
- Previous migration attempts
- Deprecated approaches
- Historical versions

---

## 📚 Additional Resources

- **Supabase Dashboard:** https://supabase.com/dashboard
- **SQL Editor:** `/project/YOUR_PROJECT_ID/sql`
- **Table Editor:** `/project/YOUR_PROJECT_ID/editor`
- **Auth Users:** `/project/YOUR_PROJECT_ID/auth/users`

---

## ✅ Migration Checklist

For fresh setup:
- [ ] Run `001_initial_schema.sql`
- [ ] Run `002_auth_triggers.sql`
- [ ] Run `003_admin_approval_system.sql`
- [ ] Run `utilities/promote_first_admin.sql` (update email first)
- [ ] Test user signup flow
- [ ] Test admin approval flow
- [ ] Verify RLS policies working

---

## 🆘 Troubleshooting

### Issue: Users can't login
**Solution:** Run `utilities/check_user_sync.sql` then `utilities/fix_missing_profiles.sql`

### Issue: Can't see Dashboard button
**Solution:** Check `admin_status = 'A'` in database

### Issue: RLS blocking admin queries
**Solution:** Verify `is_admin()` function exists and returns TRUE

### Issue: Migration fails
**Solution:** Check if already applied, read error message carefully

---

Last Updated: 2024-11-12
Version: 1.0
