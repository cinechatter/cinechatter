-- ============================================================================
-- Fix RLS Policies and Schema for CineChatter
-- ============================================================================
-- This fixes:
-- 1. RLS policies blocking categories table
-- 2. Missing author_id column in articles table
-- 3. RLS policies for articles table
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Categories Table RLS
-- ============================================================================

-- Enable RLS on categories (if not already enabled)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Policy 1: Allow anyone to read categories
CREATE POLICY "Allow public read access to categories"
ON categories
FOR SELECT
USING (true);  -- Everyone can read

-- Policy 2: Allow admins to manage categories
CREATE POLICY "Admins can manage categories"
ON categories
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- PART 2: Add Missing author_id Column to Articles Table
-- ============================================================================

-- Add author_id column if it doesn't exist
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);

-- Set default author_id to NULL (articles can exist without authors for now)
-- Or you can set a default admin user if you have one:
-- UPDATE articles SET author_id = 'YOUR_ADMIN_USER_ID' WHERE author_id IS NULL;

-- ============================================================================
-- PART 3: Fix Articles Table RLS Policies
-- ============================================================================

-- Enable RLS on articles (if not already enabled)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read published articles" ON articles;
DROP POLICY IF EXISTS "Admins can manage all articles" ON articles;

-- Policy 1: Allow anyone to read published articles
CREATE POLICY "Allow public read published articles"
ON articles
FOR SELECT
USING (status = 'published' OR is_admin());

-- Policy 2: Allow admins to manage all articles
CREATE POLICY "Admins can manage all articles"
ON articles
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check categories policies
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'categories'
ORDER BY policyname;

-- Check articles policies
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'articles'
ORDER BY policyname;

-- Check articles table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'articles'
ORDER BY ordinal_position;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see results above with no errors, the fix was successful!
-- You can now:
-- 1. Go back to your app
-- 2. Import articles from Google Sheets
-- 3. Check the articles table - they should be there!
-- ============================================================================
