-- ============================================================================
-- Utility: Promote First Admin
-- Description: Manually promote a user to admin status
-- Usage: Replace 'your-email@example.com' with actual email
-- ============================================================================

-- IMPORTANT: Update the email address below!
UPDATE users
SET admin_status = 'A'
WHERE email = 'your-email@example.com';

-- Verification
SELECT
  'Admin Promoted' as status,
  email,
  admin_status,
  CASE
    WHEN admin_status = 'A' THEN 'Admin'
    WHEN admin_status = 'P' THEN 'Pending'
    WHEN admin_status = 'R' THEN 'Rejected'
    ELSE 'Regular'
  END as status_label
FROM users
WHERE email = 'your-email@example.com';
