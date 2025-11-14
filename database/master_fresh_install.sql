-- ============================================================================
-- CineChatter - Master Fresh Install Script
-- ============================================================================
-- Description: Complete database setup in one script
-- Use: For fresh/new database setup only
--
-- This combines:
--   - 001_initial_schema.sql
--   - 002_auth_triggers.sql
--   - 003_admin_approval_system.sql
--
-- For existing databases with data, use individual migration scripts instead.
-- ============================================================================

-- ============================================================================
-- SECTION 1: UTILITY FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active, display_order);

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image VARCHAR(500),
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_views ON articles(view_count DESC);

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Google Sheets sync table
CREATE TABLE IF NOT EXISTS google_sheets_sync (
  id BIGSERIAL PRIMARY KEY,
  sheet_url TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  error_message TEXT,
  articles_synced INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_google_sheets_sync_updated_at ON google_sheets_sync;
CREATE TRIGGER update_google_sheets_sync_updated_at
  BEFORE UPDATE ON google_sheets_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Users table (extends auth.users) with admin approval system
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,
  newsletter_subscribed BOOLEAN DEFAULT FALSE,
  subscribed_on TIMESTAMPTZ,
  -- Admin approval fields
  admin_status CHAR(1) DEFAULT NULL CHECK (admin_status IN ('P', 'A', 'R') OR admin_status IS NULL),
  admin_request_message TEXT,
  admin_requested_at TIMESTAMPTZ,
  admin_reviewed_at TIMESTAMPTZ,
  admin_reviewed_by VARCHAR(255),
  rejection_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Status codes:
-- NULL = Regular user (default)
-- 'P' = Pending approval
-- 'A' = Approved (admin)
-- 'R' = Rejected

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscribed ON users(newsletter_subscribed);
CREATE INDEX IF NOT EXISTS idx_users_admin_status ON users(admin_status) WHERE admin_status IS NOT NULL;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_admin_settings_public ON admin_settings(is_public);

DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 3: AUTH TRIGGERS
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to set subscribed_on timestamp
CREATE OR REPLACE FUNCTION set_subscribed_on()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.newsletter_subscribed = TRUE AND OLD.newsletter_subscribed = FALSE THEN
    NEW.subscribed_on = CURRENT_TIMESTAMP;
  ELSIF NEW.newsletter_subscribed = FALSE THEN
    NEW.subscribed_on = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set subscribed_on
DROP TRIGGER IF EXISTS set_subscribed_on_trigger ON users;
CREATE TRIGGER set_subscribed_on_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_subscribed_on();

-- ============================================================================
-- SECTION 4: ADMIN SECURITY (RLS)
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
  'Master Install Complete' as status,
  COUNT(*) FILTER (WHERE table_name = 'categories') as categories_table,
  COUNT(*) FILTER (WHERE table_name = 'articles') as articles_table,
  COUNT(*) FILTER (WHERE table_name = 'users') as users_table,
  COUNT(*) FILTER (WHERE table_name = 'admin_settings') as admin_settings_table,
  COUNT(*) FILTER (WHERE table_name = 'google_sheets_sync') as google_sheets_sync_table
FROM information_schema.tables
WHERE table_schema = 'public';

-- Show RLS policies
SELECT
  'RLS Policies on users table:' as info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Run utilities/promote_first_admin.sql to make yourself admin
-- 2. Test signup flow
-- 3. Test admin approval workflow
-- ============================================================================
