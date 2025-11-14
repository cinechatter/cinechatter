-- ============================================================================
-- Admin System with 2FA Support
-- ============================================================================
-- Run this in Supabase SQL Editor after running the main schema.sql
-- ============================================================================

-- Add admin columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;

-- Create index for admin users
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin) WHERE is_admin = TRUE;

-- ============================================================================
-- Table: admin_login_attempts
-- ============================================================================
-- Track login attempts for security
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_attempts_user ON admin_login_attempts(user_id, created_at DESC);
CREATE INDEX idx_login_attempts_email ON admin_login_attempts(email, created_at DESC);

-- ============================================================================
-- Table: otp_codes
-- ============================================================================
-- Store one-time passwords for 2FA
CREATE TABLE IF NOT EXISTS otp_codes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) CHECK (purpose IN ('login', 'setup', 'reset')) DEFAULT 'login',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_user ON otp_codes(user_id, created_at DESC);
CREATE INDEX idx_otp_valid ON otp_codes(user_id, code, expires_at) WHERE used = FALSE;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = user_id AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate 6-digit OTP code
CREATE OR REPLACE FUNCTION generate_otp_code(
  p_user_id UUID,
  p_purpose VARCHAR DEFAULT 'login',
  p_validity_minutes INTEGER DEFAULT 10
)
RETURNS VARCHAR AS $$
DECLARE
  v_code VARCHAR(6);
BEGIN
  -- Generate random 6-digit code
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  -- Insert OTP
  INSERT INTO otp_codes (user_id, code, purpose, expires_at)
  VALUES (
    p_user_id,
    v_code,
    p_purpose,
    CURRENT_TIMESTAMP + (p_validity_minutes || ' minutes')::INTERVAL
  );

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify OTP code
CREATE OR REPLACE FUNCTION verify_otp_code(
  p_user_id UUID,
  p_code VARCHAR,
  p_purpose VARCHAR DEFAULT 'login'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  -- Check if code is valid
  SELECT EXISTS (
    SELECT 1 FROM otp_codes
    WHERE user_id = p_user_id
      AND code = p_code
      AND purpose = p_purpose
      AND used = FALSE
      AND expires_at > CURRENT_TIMESTAMP
  ) INTO v_valid;

  IF v_valid THEN
    -- Mark code as used
    UPDATE otp_codes
    SET used = TRUE
    WHERE user_id = p_user_id
      AND code = p_code
      AND purpose = p_purpose
      AND used = FALSE;
  END IF;

  RETURN v_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin login attempt
CREATE OR REPLACE FUNCTION log_admin_login(
  p_user_id UUID,
  p_email VARCHAR,
  p_success BOOLEAN,
  p_ip_address VARCHAR DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_login_attempts (user_id, email, success, ip_address, user_agent)
  VALUES (p_user_id, p_email, p_success, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if too many failed attempts
CREATE OR REPLACE FUNCTION check_failed_login_attempts(
  p_email VARCHAR,
  p_max_attempts INTEGER DEFAULT 5,
  p_time_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM admin_login_attempts
  WHERE email = p_email
    AND success = FALSE
    AND created_at > CURRENT_TIMESTAMP - (p_time_window_minutes || ' minutes')::INTERVAL;

  RETURN v_count >= p_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM otp_codes
  WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '1 day';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
CREATE POLICY "Admins can view all login attempts"
  ON admin_login_attempts FOR SELECT
  USING (is_user_admin(auth.uid()));

-- Users can only see their own OTP codes
CREATE POLICY "Users can view own OTP codes"
  ON otp_codes FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- Initial Admin Setup
-- ============================================================================

-- To manually create the first admin user (replace with your email):
-- UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';

-- Or wait for the first-time setup screen in the app

-- ============================================================================
-- DONE!
-- ============================================================================
-- Next: Update your React app to use these features
