# Fix Email Confirmation Issue

## Problem
Supabase isn't sending verification emails or email confirmation is enabled.

## Solution 1: Disable Email Confirmation (Development Only)

### Steps:

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard/project/xpogipevekygeznakfjc

2. **Navigate to Authentication Settings**
   - Click **"Authentication"** in left sidebar
   - Click **"Providers"** tab
   - Scroll down to **"Email"** section

3. **Disable "Confirm email"**
   - Find the toggle for **"Confirm email"**
   - Turn it **OFF** (disable it)
   - Click **"Save"**

4. **Try again**
   - Refresh your app
   - Try creating admin account again
   - No email verification needed!

---

## Solution 2: Manually Create Admin User

If you already created the account but can't verify email:

### Option A: Through Supabase Dashboard

1. **Go to Authentication → Users**
   - https://supabase.com/dashboard/project/xpogipevekygeznakfjc/auth/users

2. **Find your user** (by email)

3. **Click on the user** to edit

4. **Mark email as verified**
   - Look for "email_confirmed_at" or similar
   - Or just proceed to next step

5. **Go to Table Editor → users table**
   - https://supabase.com/dashboard/project/xpogipevekygeznakfjc/editor

6. **Find your user row** (by email)

7. **Edit the row**
   - Set `is_admin` = `TRUE`
   - Set `email_verified` = `TRUE`
   - Click **"Save"**

8. **Try logging in**
   - Go back to your app
   - Click "Login"
   - Enter your credentials
   - Dashboard button should appear!

---

## Solution 3: Use SQL to Set Admin

Run this in Supabase SQL Editor (replace with your email):

```sql
-- First, check auth.users
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'your-email@example.com';

-- If user exists, confirm email in auth
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'your-email@example.com';

-- Then set as admin in users table
UPDATE users
SET is_admin = TRUE, email_verified = TRUE
WHERE email = 'your-email@example.com';

-- Verify it worked
SELECT id, email, is_admin, email_verified
FROM users
WHERE email = 'your-email@example.com';
```

---

## Recommended: Solution 1

**Disable email confirmation** for development. This is the easiest and fastest solution.

After that, you can:
- Create accounts instantly (no email needed)
- Test login/logout quickly
- Add email confirmation back later for production

---

## After Fixing

Once you've applied one of these solutions:

1. Refresh your app
2. Try logging in with your email/password
3. Dashboard button should appear!

Let me know which solution you'd like to try!
