-- ============================================================================
-- Migration: 003 - Admin Approval System
-- Description: Adds admin approval workflow with CHAR(1) status codes
-- Date: 2024-11-12
-- ============================================================================

-- ============================================================================
-- ADD ADMIN COLUMNS TO USERS TABLE
-- ============================================================================

-- Add admin status and approval tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_status CHAR(1) DEFAULT NULL
  CHECK (admin_status IN ('P', 'A', 'R') OR admin_status IS NULL);

ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_request_message TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_requested_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_reviewed_by VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_admin_status ON users(admin_status) WHERE admin_status IS NOT NULL;

-- Status codes:
-- NULL = Regular user (default)
-- 'P' = Pending approval
-- 'A' = Approved (admin)
-- 'R' = Rejected

-- ============================================================================
-- RLS HELPER FUNCTION
-- ============================================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT u.admin_status = 'A' FROM users u WHERE u.id = auth.uid() LIMIT 1),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Anyone can create account" ON users;

-- Policy 1: Users can view their own profile OR admins can view all
CREATE POLICY "Users can view profiles"
ON users
FOR SELECT
USING (
  auth.uid() = id  -- User can see their own record
  OR
  is_admin()  -- OR current user is admin (can see all)
);

-- Policy 2: Users can update their own profile but cannot change admin fields
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (
  auth.uid() = id AND NOT is_admin()  -- Non-admins updating themselves
)
WITH CHECK (
  auth.uid() = id
  AND (admin_status IS NULL OR admin_status IN ('P', 'R'))  -- Cannot set to 'A' (approved)
);

-- Policy 3: Admins can update any user
CREATE POLICY "Admins can update any user"
ON users
FOR UPDATE
USING (
  is_admin()  -- Current user must be an admin
)
WITH CHECK (
  is_admin()
);

-- Policy 4: Allow user creation during signup
CREATE POLICY "Anyone can create account"
ON users
FOR INSERT
WITH CHECK (
  -- New users get NULL (regular) or 'P' (pending approval) status
  (admin_status IS NULL OR admin_status = 'P')
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
  'Migration 003 Complete' as status,
  COUNT(*) FILTER (WHERE column_name = 'admin_status') as admin_status_column,
  COUNT(*) FILTER (WHERE column_name = 'admin_request_message') as admin_request_message_column,
  COUNT(*) FILTER (WHERE proname = 'is_admin') as is_admin_function
FROM (
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'users' AND column_name LIKE 'admin_%'
  UNION ALL
  SELECT proname as column_name FROM pg_proc WHERE proname = 'is_admin'
) sub;

-- Show RLS policies
SELECT
  'RLS Policies:' as info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
