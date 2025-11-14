-- ============================================================================
-- Migration: 002 - Authentication Triggers
-- Description: Sets up automatic user profile creation and auth handlers
-- Date: 2024-11-09
-- ============================================================================

-- ============================================================================
-- AUTH TRIGGERS
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
-- VERIFICATION
-- ============================================================================

SELECT
  'Migration 002 Complete' as status,
  COUNT(*) FILTER (WHERE proname = 'handle_new_user') as handle_new_user_func,
  COUNT(*) FILTER (WHERE proname = 'set_subscribed_on') as set_subscribed_on_func
FROM pg_proc
WHERE proname IN ('handle_new_user', 'set_subscribed_on');
