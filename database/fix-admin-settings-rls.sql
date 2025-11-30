-- ============================================================================
-- Fix RLS Policies for admin_settings Table
-- ============================================================================
-- This fixes the 406 error when fetching featured images
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

-- Enable RLS on admin_settings if not already enabled
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Allow authenticated users to write admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can manage admin_settings" ON admin_settings;

-- Policy 1: Allow anyone to read admin_settings (public settings)
-- This fixes the 406 error for featured images
CREATE POLICY "Allow public read access to admin_settings"
ON admin_settings
FOR SELECT
USING (
  is_public = true  -- Only allow reading public settings
  OR
  is_admin()  -- Admins can read all settings
);

-- Policy 2: Allow admins to insert/update/delete admin_settings
CREATE POLICY "Admins can manage admin_settings"
ON admin_settings
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if policies are created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'admin_settings'
ORDER BY policyname;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify policies are created (check output above)
-- 3. Reload your Vercel app - error should be gone!
-- 4. If featured_images setting doesn't exist, it will be created when you save
-- ============================================================================

-- Optional: Create the featured_images setting if it doesn't exist
-- (This will be created automatically when you save featured images, but you can pre-create it)
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description, is_public)
VALUES (
  'featured_images',
  '[]',
  'json',
  'Featured images for homepage carousel',
  true  -- Make it public so anyone can read it
)
ON CONFLICT (setting_key)
DO UPDATE SET
  is_public = true,  -- Make sure it's public
  description = 'Featured images for homepage carousel';

-- Verify the setting was created/updated
SELECT * FROM admin_settings WHERE setting_key = 'featured_images';
