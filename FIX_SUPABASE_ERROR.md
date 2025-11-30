# Fix Supabase 406 Error for Featured Images

## Error You're Seeing

```
GET https://xpogipevekygeznakfjc.supabase.co/rest/v1/admin_settings?select=setting_value&setting_key=eq.featured_images 406 (Not Acceptable)
```

## What This Means

The `admin_settings` table has Row Level Security (RLS) enabled, but there are no policies allowing public read access. This blocks the app from fetching featured images.

## 🔧 How to Fix (5 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/xpogipevekygeznakfjc
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Fix Script

Copy and paste this entire script into the SQL Editor:

```sql
-- Enable RLS on admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Allow authenticated users to write admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can manage admin_settings" ON admin_settings;

-- Policy 1: Allow public read for public settings
CREATE POLICY "Allow public read access to admin_settings"
ON admin_settings
FOR SELECT
USING (
  is_public = true
  OR
  is_admin()
);

-- Policy 2: Allow admins to manage all settings
CREATE POLICY "Admins can manage admin_settings"
ON admin_settings
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create/update featured_images setting
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description, is_public)
VALUES (
  'featured_images',
  '[]',
  'json',
  'Featured images for homepage carousel',
  true
)
ON CONFLICT (setting_key)
DO UPDATE SET
  is_public = true,
  description = 'Featured images for homepage carousel';
```

### Step 3: Click "Run"

Click the **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 4: Verify

You should see output showing:
- ✅ Policies created successfully
- ✅ `featured_images` setting created/updated

### Step 5: Test

1. Go back to your Vercel app: https://cinechatter.vercel.app/
2. **Hard refresh** the page (`Ctrl+Shift+R` or `Cmd+Shift+R`)
3. **Check browser console** - the 406 error should be gone! ✅

## 🎯 What This Does

### Before (Error):
```
User requests page
  → App tries to read admin_settings
  → RLS blocks: "You don't have permission"
  → 406 Error ❌
```

### After (Working):
```
User requests page
  → App tries to read admin_settings
  → RLS checks: is_public = true?
  → Yes! Allow read ✅
  → Featured images load successfully
```

## 🔒 Security

**Q: Is this secure?**
**A: Yes!** The policy only allows:
- ✅ **Reading** public settings (is_public = true)
- ✅ **Writing** only by admins (is_admin())
- ❌ Regular users cannot modify settings
- ❌ Private settings (is_public = false) are still protected

**Q: What if I don't want featured images public?**
**A:** They need to be public so visitors can see them on the homepage. Only admins can edit them.

## 📊 Alternative: Check Current RLS Policies

If you want to see what policies already exist:

```sql
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'admin_settings';
```

## 🆘 Troubleshooting

### Still getting 406 error after running script?

1. **Clear browser cache** and hard refresh
2. **Check Vercel deployment** - make sure latest code is deployed
3. **Verify the policy** was created:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'admin_settings';
   ```
4. **Check is_public flag**:
   ```sql
   SELECT setting_key, is_public FROM admin_settings WHERE setting_key = 'featured_images';
   ```
   Should show: `is_public = true`

### Error: "column is_public does not exist"?

Your `admin_settings` table might not have the `is_public` column. Run this first:

```sql
-- Add is_public column if it doesn't exist
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Now run the main fix script above
```

### Error: "function is_admin() does not exist"?

You need to create the `is_admin()` function. It should already exist from your initial setup, but if not:

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT u.admin_status = 'A' FROM users u WHERE u.id = auth.uid() LIMIT 1),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

## ✅ Success Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Ran the fix script
- [ ] Saw "Success" message
- [ ] Refreshed Vercel app
- [ ] 406 error is gone
- [ ] Featured images load (if you have any)

---

**File Location:** `database/fix-admin-settings-rls.sql`

**Last Updated:** 2024-11-27
