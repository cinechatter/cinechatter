-- Migration: Remove is_admin field, use only admin_status
-- This simplifies the admin system to use a single source of truth

-- Step 1: Update existing data to sync admin_status with is_admin
UPDATE users
SET admin_status = 'approved'
WHERE is_admin = TRUE AND admin_status != 'approved';

UPDATE users
SET admin_status = 'regular'
WHERE (is_admin = FALSE OR is_admin IS NULL) AND admin_status NOT IN ('pending_approval', 'rejected');

-- Step 2: Drop existing policies that reference is_admin column
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Anyone can create account" ON users;

-- Step 3: Drop the is_admin column
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;

-- Step 4: Update the RLS helper function
DROP FUNCTION IF EXISTS is_admin();

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT u.admin_status = 'approved' FROM users u WHERE u.id = auth.uid() LIMIT 1),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 5: Recreate policies without is_admin references
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
  AND admin_status IN ('regular', 'pending_approval', 'rejected')  -- Cannot set to 'approved'
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

-- Policy 4: Allow user creation during signup (regular status by default)
CREATE POLICY "Anyone can create account"
ON users
FOR INSERT
WITH CHECK (
  -- New users get 'regular' or 'pending_approval' status
  admin_status IN ('regular', 'pending_approval')
);

-- Verification
SELECT
  'MIGRATION COMPLETE: Using admin_status only' as status,
  COUNT(*) FILTER (WHERE admin_status = 'regular') as regular_users,
  COUNT(*) FILTER (WHERE admin_status = 'pending_approval') as pending,
  COUNT(*) FILTER (WHERE admin_status = 'approved') as admins,
  COUNT(*) FILTER (WHERE admin_status = 'rejected') as rejected
FROM users;

-- Show current RLS policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
