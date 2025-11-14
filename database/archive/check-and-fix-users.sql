-- Check and Fix Users - Complete Diagnostic and Repair

-- Step 1: Check auth.users (Supabase Auth table)
SELECT
  'AUTH.USERS' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Check users table (Your custom table)
SELECT
  'USERS TABLE' as table_name,
  id,
  email,
  name,
  is_admin,
  email_verified,
  created_at
FROM users
ORDER BY created_at DESC;

-- Step 3: Find users in auth.users but NOT in users table
SELECT
  'MISSING IN USERS TABLE' as status,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- Step 4: Fix - Create missing user records and set as admin
INSERT INTO users (id, email, name, is_admin, email_verified, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  TRUE,  -- Set as admin
  au.email_confirmed_at IS NOT NULL,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO UPDATE
SET
  is_admin = TRUE,
  updated_at = NOW();

-- Step 5: Verify the fix
SELECT
  'VERIFICATION' as status,
  u.id,
  u.email,
  u.name,
  u.is_admin,
  u.email_verified,
  u.created_at,
  au.email_confirmed_at as auth_email_confirmed
FROM users u
INNER JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;

-- Step 6: Check if admin exists now
SELECT
  'ADMIN CHECK' as status,
  COUNT(*) as admin_count,
  array_agg(email) as admin_emails
FROM users
WHERE is_admin = TRUE;
