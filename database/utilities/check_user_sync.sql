-- ============================================================================
-- Utility: Check User Sync Status
-- Description: Verifies auth.users and public.users are in sync
-- Usage: Run this to diagnose user profile issues
-- ============================================================================

-- Check for auth users without profiles
SELECT
  'Auth users missing profiles' as issue,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- Check for orphaned profiles (shouldn't happen)
SELECT
  'Profiles without auth users' as issue,
  pu.id,
  pu.email,
  pu.created_at
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL
ORDER BY pu.created_at DESC;

-- Summary
SELECT
  'Summary' as info,
  COUNT(DISTINCT au.id) as auth_users_count,
  COUNT(DISTINCT pu.id) as profile_users_count,
  COUNT(DISTINCT au.id) - COUNT(DISTINCT pu.id) as missing_profiles
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id;
