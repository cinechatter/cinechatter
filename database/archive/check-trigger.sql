-- Check if the trigger exists and is working

-- Step 1: Check if the function exists
SELECT
  'FUNCTION CHECK' as status,
  proname as function_name,
  prosrc as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Step 2: Check if the trigger exists
SELECT
  'TRIGGER CHECK' as status,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 3: Check for any errors in trigger execution
-- (This shows recent logs if available)
SELECT
  'RECENT AUTH USERS' as status,
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: Manually run the trigger function for existing users
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    INSERT INTO users (id, email, name, created_at, updated_at)
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'name', split_part(auth_user.email, '@', 1)),
      auth_user.created_at,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Created user record for: %', auth_user.email;
  END LOOP;
END $$;

-- Step 5: Set all existing users as admin (since they're first users)
UPDATE users
SET is_admin = TRUE
WHERE id IN (
  SELECT id FROM users
  WHERE is_admin = FALSE OR is_admin IS NULL
);

-- Step 6: Verify everything
SELECT
  'FINAL VERIFICATION' as status,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_admin = TRUE) as admin_count,
  array_agg(email) FILTER (WHERE is_admin = TRUE) as admin_emails
FROM users;
