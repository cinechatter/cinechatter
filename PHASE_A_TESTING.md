# Phase A: Basic Admin Authentication - Testing Guide

## ✅ What's Been Implemented

1. **Removed old admin login** (password-based)
2. **Added admin check** on user login
3. **Dashboard button** only visible to admin users
4. **First-time setup screen** to create first admin

---

## 🔧 Setup Steps

### Step 1: Run Admin System SQL

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/xpogipevekygeznakfjc
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New query"**
4. Open the file: `database/add-admin-system.sql`
5. Copy ALL contents
6. Paste into SQL Editor
7. Click **"Run"**
8. You should see: **"Success"**

This adds:
- `is_admin` column to users table
- `admin_login_attempts` table
- `otp_codes` table (for future 2FA)
- Helper functions

### Step 2: Test the Flow

Your dev server is already running. Open: http://localhost:3000

---

## 🧪 Testing Scenarios

### Scenario 1: First-Time Setup (No Admins Exist)

**Expected Flow:**
1. Open http://localhost:3000
2. You should see **"Welcome to CineChatter!"** modal automatically
3. This appears because no admin users exist yet

**Create Your Admin Account:**
1. Fill in the form:
   - Name: (optional)
   - Email: your-email@example.com
   - Password: (min 6 characters)
2. Click **"Create Admin Account"**
3. Check your email for verification link
4. Click the verification link
5. Modal closes

### Scenario 2: Admin Login

1. Click **"Login"** in top navigation
2. Enter your admin email + password
3. Click **"Login"**
4. You should see:
   - Your name/email in top right
   - **Green "Dashboard" button** appears!

### Scenario 3: Regular User (Not Admin)

1. Click **"Sign Up"** (not "Login")
2. Create a different account (different email)
3. Verify email and login
4. You should see:
   - Your name/email in top right
   - **NO Dashboard button** (because not admin)
   - Can browse site normally

### Scenario 4: Admin Dashboard Access

1. Login as admin
2. Click **"Dashboard"** button
3. You should see admin panel with:
   - Integration Settings
   - Untold Stories
   - Agent
   - New Article
   - Articles table

---

## ✅ Success Checklist

After testing, verify:

- [ ] First-time setup modal appeared (if no admins)
- [ ] Created admin account successfully
- [ ] Received verification email
- [ ] Can login as admin
- [ ] Dashboard button visible after admin login
- [ ] Can access admin panel
- [ ] Regular users don't see Dashboard button
- [ ] Old "Admin" button is gone

---

## 🐛 Troubleshooting

### Setup modal doesn't appear
**Solution**: Make sure you ran `add-admin-system.sql` and no users have `is_admin = true` yet.

### Dashboard button doesn't show after login
**Solution**:
1. Check Supabase Table Editor → users table
2. Find your user
3. Make sure `is_admin = TRUE`
4. Logout and login again

### "Cannot read properties of undefined"
**Solution**: Your user profile might not have loaded. Check browser console for errors.

---

## 📋 What's Next (Phase B & C)

Once Phase A is working:

**Phase B: 2FA**
- Email OTP codes
- Verify before admin access
- Enable/disable 2FA per admin

**Phase C: Admin Management**
- Manage admins screen
- Promote/demote users
- View login attempts
- Security dashboard

---

## 🎉 You're Ready!

If all tests passed, your basic admin system is working! Let me know if you encounter any issues or want to proceed with Phase B (2FA).
