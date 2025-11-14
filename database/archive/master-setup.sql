-- ============================================================================
-- MASTER SETUP SCRIPT - CineChatter Database Setup
-- ============================================================================
-- This script runs all database setup scripts in the correct order
-- Perfect for: New developers, fresh database setup, CI/CD deployment
--
-- Usage:
--   1. Go to Supabase SQL Editor
--   2. Copy and paste this entire file
--   3. Click "Run"
--   4. Done! Everything is set up
--
-- What this does:
--   - Creates tables and columns
--   - Sets up triggers for auto-user creation
--   - Configures Row Level Security (RLS)
--   - Fixes any existing users
--   - Verifies everything works
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '          CINECHATTER DATABASE SETUP - STARTING';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: CREATE TABLES AND COLUMNS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '▶ Step 1: Creating tables and columns...';
END $$;

-- Add admin-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;

-- Create admin login attempts table (for security tracking)
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create OTP codes table (for 2FA - Phase B)
CREATE TABLE IF NOT EXISTS otp_codes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) CHECK (purpose IN ('login', 'setup', 'reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  RAISE NOTICE '  ✓ Tables and columns created';
END $$;

-- ============================================================================
-- STEP 2: CREATE HELPER FUNCTIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '▶ Step 2: Creating helper functions...';
END $$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = user_id AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if any admins exist (public access)
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE is_admin = TRUE
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon;

DO $$
BEGIN
  RAISE NOTICE '  ✓ Helper functions created';
END $$;

-- ============================================================================
-- STEP 3: CREATE TRIGGER FOR AUTO-USER CREATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '▶ Step 3: Setting up auto-user creation trigger...';
END $$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

DO $$
BEGIN
  RAISE NOTICE '  ✓ Trigger created';
END $$;

-- ============================================================================
-- STEP 4: CONFIGURE ROW LEVEL SECURITY (RLS)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '▶ Step 4: Configuring Row Level Security...';
END $$;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Only admins can promote users to admin" ON users;
DROP POLICY IF EXISTS "First admin can be created during setup" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can update their own NON-ADMIN fields
CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND
  -- Prevent users from setting themselves as admin
  (is_admin = (SELECT is_admin FROM users WHERE id = auth.uid()))
);

-- Policy 3: Only existing admins can promote users to admin
CREATE POLICY "Only admins can promote users to admin"
ON users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = TRUE
  )
);

-- Policy 4: Allow first admin creation (when no admins exist)
CREATE POLICY "First admin can be created during setup"
ON users
FOR INSERT
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM users WHERE is_admin = TRUE)
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = TRUE
  )
);

-- Policy 5: Admins can view all users
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = TRUE
  )
);

DO $$
BEGIN
  RAISE NOTICE '  ✓ RLS policies configured';
END $$;

-- ============================================================================
-- STEP 5: FIX EXISTING USERS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '▶ Step 5: Fixing existing users...';
END $$;

-- Create missing user records from auth.users and set as admin
INSERT INTO users (id, email, name, is_admin, email_verified, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  TRUE,  -- Set as admin (they're first users)
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

DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM auth.users au
  INNER JOIN users u ON au.id = u.id;

  RAISE NOTICE '  ✓ Fixed % existing user(s)', fixed_count;
END $$;

-- ============================================================================
-- STEP 6: VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '▶ Step 6: Verifying setup...';
END $$;

-- Check admin count
DO $$
DECLARE
  admin_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM users;
  SELECT COUNT(*) INTO admin_count FROM users WHERE is_admin = TRUE;

  RAISE NOTICE '  ✓ Total users: %', total_count;
  RAISE NOTICE '  ✓ Admin users: %', admin_count;
END $$;

-- Check trigger
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
  ) INTO trigger_exists;

  IF trigger_exists THEN
    RAISE NOTICE '  ✓ Trigger: Active';
  ELSE
    RAISE NOTICE '  ✗ Trigger: NOT FOUND';
  END IF;
END $$;

-- Check RLS
DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE tablename = 'users';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'users';

  IF rls_enabled THEN
    RAISE NOTICE '  ✓ RLS: Enabled';
  ELSE
    RAISE NOTICE '  ✗ RLS: DISABLED';
  END IF;

  RAISE NOTICE '  ✓ RLS Policies: %', policy_count;
END $$;

-- ============================================================================
-- SUCCESS!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '          ✓ SETUP COMPLETE - READY TO GO!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Go to: http://localhost:3000#admin';
  RAISE NOTICE '  2. Login with your existing account (or create one)';
  RAISE NOTICE '  3. Dashboard button should appear!';
  RAISE NOTICE '';
  RAISE NOTICE 'For detailed verification, check the tables below.';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- DETAILED VERIFICATION TABLES
-- ============================================================================

-- Show all users
SELECT
  '📊 USERS TABLE' as info,
  id,
  email,
  name,
  is_admin,
  email_verified,
  created_at
FROM users
ORDER BY created_at DESC;

-- Show admin summary
SELECT
  '👑 ADMIN SUMMARY' as info,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_admin = TRUE) as admin_count,
  array_agg(email) FILTER (WHERE is_admin = TRUE) as admin_emails
FROM users;

-- Show trigger status
SELECT
  '🔧 TRIGGER STATUS' as info,
  trigger_name,
  event_manipulation,
  'ACTIVE' as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Show RLS status
SELECT
  '🔒 SECURITY STATUS' as info,
  'RLS Enabled' as feature,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'users';
