# CineChatter Database Scripts

This directory contains SQL scripts for setting up and managing the CineChatter admin authentication system.

## 📋 Quick Start

### For New Developers (Fresh Setup)

Just run **ONE script**:

```
database/master-setup.sql
```

This does everything automatically! ✅

---

## 📁 Script Overview

### 🎯 Main Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| **master-setup.sql** | **⭐ ONE-CLICK SETUP** | New database, new developer, CI/CD |
| add-admin-system.sql | Initial admin system setup | First time only |
| secure-admin-creation.sql | Row Level Security policies | Security setup |
| fix-missing-users.sql | Fix users in auth but not users table | When trigger fails |

### 🔍 Diagnostic Scripts

| Script | Purpose |
|--------|---------|
| check-and-fix-users.sql | Check both tables + auto-fix |
| check-trigger.sql | Verify trigger is working |
| check-admin-setup.mjs | Node.js script to check admin status |

---

## 🚀 Usage Instructions

### Option 1: Master Script (Recommended)

**Best for:** New setup, giving to developers, fresh database

1. Go to Supabase SQL Editor
2. Open: `database/master-setup.sql`
3. Copy entire file
4. Paste and click "Run"
5. Done! ✅

**What it does:**
- ✓ Creates all tables and columns
- ✓ Sets up auto-user creation trigger
- ✓ Configures security (RLS)
- ✓ Fixes any existing users
- ✓ Verifies everything works

---

### Option 2: Individual Scripts (Maintenance)

**Best for:** Updating specific features, debugging

Run scripts in this order:

```sql
-- Step 1: Initial setup
database/add-admin-system.sql

-- Step 2: Security
database/secure-admin-creation.sql

-- Step 3: Fix existing users (if needed)
database/fix-missing-users.sql
```

---

## 🔧 Common Scenarios

### Scenario 1: New Developer Joining Team

**Solution:** Run `master-setup.sql`

```bash
1. Clone repo
2. Set up .env file
3. Go to Supabase SQL Editor
4. Run master-setup.sql
5. Done!
```

---

### Scenario 2: User Created But Not in Users Table

**Problem:** "User already registered" error but no user in database

**Solution:** Run `fix-missing-users.sql`

This happens when the trigger fails. The fix script:
- Finds users in auth.users but not in users table
- Creates the missing records
- Sets them as admin

---

### Scenario 3: Check If Admin Exists

**Solution:** Use check script

```bash
# From terminal
node check-admin-setup.mjs

# Or run check-and-fix-users.sql in Supabase
```

---

### Scenario 4: Trigger Not Working

**Solution:** Run `check-trigger.sql`

This will:
- Verify trigger exists
- Show recent auth users
- Manually create missing records

---

## 🏗️ Database Structure

### Tables Created

1. **users** (main user table)
   - `id` - UUID (from auth.users)
   - `email` - User email
   - `name` - Display name
   - `is_admin` - Admin flag
   - `email_verified` - Email verification status
   - `two_factor_enabled` - 2FA status (Phase B)
   - `two_factor_secret` - 2FA secret (Phase B)

2. **admin_login_attempts** (security tracking)
   - `user_id` - User who attempted login
   - `email` - Email used
   - `success` - Login success/failure
   - `ip_address` - IP address
   - `user_agent` - Browser info
   - `created_at` - Timestamp

3. **otp_codes** (for 2FA - Phase B)
   - `user_id` - User ID
   - `code` - 6-digit OTP
   - `purpose` - login/setup/reset
   - `expires_at` - Expiration time
   - `used` - Whether code was used

---

## 🔒 Security Features

### Row Level Security (RLS)

All scripts set up these policies:

1. **Users can view own profile** - Privacy
2. **Users can update own profile** - But NOT admin status
3. **Only admins can promote users** - Security
4. **First admin creation allowed** - Initial setup
5. **Admins can view all users** - Management

### Trigger

Automatically creates user record when:
- New user signs up via Supabase Auth
- User record created in `users` table
- Name extracted from metadata or email

---

## 🐛 Troubleshooting

### Issue: Master script fails

**Solution:** Run individual scripts to identify which step fails

### Issue: "User already registered" error

**Solution:** User exists in `auth.users` but not `users` table
- Run `fix-missing-users.sql`

### Issue: Trigger not working

**Solution:**
- Run `check-trigger.sql`
- Verify trigger exists in output
- Manually run fix script

### Issue: Can't promote users to admin

**Solution:** RLS policies not configured
- Run `secure-admin-creation.sql`

---

## 📊 Verification

After running master script, verify:

```sql
-- Check users
SELECT * FROM users;

-- Check admin count
SELECT COUNT(*) FROM users WHERE is_admin = TRUE;

-- Check trigger
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check RLS
SELECT * FROM pg_policies WHERE tablename = 'users';
```

---

## 🔄 Updating Database

### Adding New Feature

1. Create new script: `database/feature-name.sql`
2. Test it independently
3. Add to master script if needed for fresh setups
4. Document in this README

### Modifying Existing Feature

1. Update individual script (e.g., `secure-admin-creation.sql`)
2. Update master script to match
3. Test on fresh database
4. Document changes

---

## 📝 Script Maintenance

### Best Practices

✅ **DO:**
- Keep individual scripts for specific features
- Use master script for fresh setups
- Add comments explaining what each does
- Test on fresh database before committing
- Use `IF NOT EXISTS` for tables/columns
- Use `CREATE OR REPLACE` for functions

❌ **DON'T:**
- Put everything in one massive script
- Delete old scripts (keep history)
- Run DROP TABLE without backup
- Forget to update master script

---

## 🎯 Summary

- **New setup?** → Run `master-setup.sql`
- **Fix users?** → Run `fix-missing-users.sql`
- **Check status?** → Run `check-admin-setup.mjs`
- **Update feature?** → Edit individual script

---

## 📞 Need Help?

Check these docs:
- `../SECURE_ADMIN_GUIDE.md` - Admin system guide
- `../ADMIN_SETUP_GUIDE.md` - Setup instructions
- `../PHASE_A_TESTING.md` - Testing guide

---

**Last Updated:** 2025-11-11
**Version:** 1.0.0
