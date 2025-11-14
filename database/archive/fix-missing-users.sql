-- Fix missing users in users table
-- This script checks auth.users and creates corresponding records in users table

-- Step 1: Check what users exist in auth.users but not in users table
SELECT
  au.id,
  au.email,
  au.created_at,
  u.id as user_table_id
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- Step 2: Create missing user records and set as admin
INSERT INTO users (id, email, name, is_admin, email_verified, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  TRUE,  -- Set as admin
  au.email_confirmed_at IS NOT NULL,
  au.created_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO UPDATE
SET is_admin = TRUE;

-- Step 3: Verify the fix
SELECT
  id,
  email,
  name,
  is_admin,
  email_verified,
  created_at
FROM users
ORDER BY created_at DESC;
