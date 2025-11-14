-- Update RLS policies to secure admin approval system
-- This ensures only admins can see pending requests and approval status

-- Drop existing policies (all variations)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Only admins can promote users to admin" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "First admin can be created during setup" ON users;
DROP POLICY IF EXISTS "Anyone can create account" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile OR admins can view all
CREATE POLICY "Users can view profiles"
ON users
FOR SELECT
USING (
  -- User can see their own record
  auth.uid() = id
  OR
  -- OR if the current user is an admin (check via auth.uid())
  (
    SELECT is_admin FROM users WHERE id = auth.uid()
  ) = TRUE
);

-- Policy 2: Users can update their own profile but cannot change admin fields
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (
  -- User is updating their own record
  auth.uid() = id
  AND
  -- And they are NOT an admin (admins use different policy)
  (SELECT is_admin FROM users WHERE id = auth.uid()) = FALSE
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
  -- Current user must be an admin
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
)
WITH CHECK (
  (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- Policy 5: Allow user creation during signup (regular status by default)
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
  'RLS POLICIES UPDATED' as status,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
