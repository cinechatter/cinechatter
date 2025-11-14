-- ============================================================================
-- Utility: Fix Missing User Profiles
-- Description: Creates missing profiles for auth users
-- Usage: Run this if users exist in auth but not in public.users
-- ============================================================================

-- Create missing profiles
INSERT INTO public.users (id, email, name, avatar_url)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Verification
SELECT
  'Profiles Fixed' as status,
  COUNT(*) as profiles_created
FROM public.users pu
WHERE pu.created_at > NOW() - INTERVAL '1 minute';
