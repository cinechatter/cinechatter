-- Update RLS policies to secure admin approval system (v2 - Fixed recursion)
-- This ensures only admins can see pending requests and approval status

-- Drop existing policies (all variations)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Only admins can promote users to admin" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "First admin can be created during setup" ON users;
DROP POLICY IF EXISTS "Anyone can create account" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Drop helper function if exists
DROP FUNCTION IF EXISTS is_admin();

-- Create a security definer function to check if current user is admin
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT u.is_admin FROM users u WHERE u.id = auth.uid() LIMIT 1),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

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
  AND is_admin = FALSE  -- Cannot set themselves as admin
  AND admin_status IN ('regular', 'pending_approval', 'rejected')  -- Cannot approve themselves
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
  AND
  -- New users cannot set themselves as admin
  (is_admin = FALSE OR is_admin IS NULL)
);

-- Verification
SELECT
  'RLS POLICIES UPDATED (V2)' as status,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
