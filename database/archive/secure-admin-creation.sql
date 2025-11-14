-- Secure Admin Creation - Prevent unauthorized admin creation

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Only admins can promote users to admin" ON users;
DROP POLICY IF EXISTS "First admin can be created during setup" ON users;

-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

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
  -- Current user must be an admin
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = TRUE
  )
)
WITH CHECK (
  -- Current user must be an admin
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
  -- Either no admins exist yet (first-time setup)
  NOT EXISTS (SELECT 1 FROM users WHERE is_admin = TRUE)
  OR
  -- Or current user is already an admin (promoting others)
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

-- Create a function to check if any admins exist (public access for first-time check)
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE is_admin = TRUE
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon;

-- Test the setup
SELECT
  'RLS Enabled' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users') as policy_count,
  admin_exists() as admin_exists;
