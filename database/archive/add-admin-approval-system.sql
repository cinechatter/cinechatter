-- Admin Approval System
-- Users request admin access, site owner approves

-- Create admin_requests table
CREATE TABLE IF NOT EXISTS admin_requests (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_message TEXT,
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  reviewed_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email and status
CREATE INDEX IF NOT EXISTS idx_admin_requests_email ON admin_requests(email);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status);

-- Enable RLS
ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a request (public submission)
CREATE POLICY "Anyone can submit admin request"
ON admin_requests
FOR INSERT
WITH CHECK (true);

-- Policy: Only admins can view requests
CREATE POLICY "Admins can view all requests"
ON admin_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = TRUE
  )
);

-- Policy: Only admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests"
ON admin_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = TRUE
  )
);

-- Function to approve admin request
CREATE OR REPLACE FUNCTION approve_admin_request(request_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  new_user_id UUID;
  result JSONB;
BEGIN
  -- Check if requester is admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get request details
  SELECT * INTO request_record
  FROM admin_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  -- Create Supabase auth user
  -- Note: This needs to be done via Supabase client in the app
  -- For now, just mark as approved and return the details

  -- Update request status
  UPDATE admin_requests
  SET
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = (SELECT email FROM users WHERE id = auth.uid())
  WHERE id = request_id;

  -- Return success with user details to create
  result := jsonb_build_object(
    'success', true,
    'name', request_record.name,
    'email', request_record.email,
    'password_hash', request_record.password_hash
  );

  RETURN result;
END;
$$;

-- Function to reject admin request
CREATE OR REPLACE FUNCTION reject_admin_request(request_id BIGINT, reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if requester is admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Update request status
  UPDATE admin_requests
  SET
    status = 'rejected',
    rejection_reason = reason,
    reviewed_at = NOW(),
    reviewed_by = (SELECT email FROM users WHERE id = auth.uid())
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_admin_request(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_admin_request(BIGINT, TEXT) TO authenticated;

-- Verification
SELECT
  'ADMIN APPROVAL SYSTEM INSTALLED' as status,
  (SELECT COUNT(*) FROM pg_tables WHERE tablename = 'admin_requests') as table_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'admin_requests') as policy_count;
