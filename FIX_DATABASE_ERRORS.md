# Fix Database Import Errors

## 🔴 Errors You're Seeing

```
406 (Not Acceptable) - categories table
403 (Forbidden) - categories table
Could not find the 'author_id' column
```

## 🔧 Quick Fix (5 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/xpogipevekygeznakfjc
2. Click **SQL Editor** in left sidebar
3. Click **New Query**

### Step 2: Run the Fix Script

Copy the **entire contents** of `database/fix-rls-and-schema.sql` and paste into the SQL Editor.

Or copy this:

```sql
-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Allow anyone to read categories
CREATE POLICY "Allow public read access to categories"
ON categories
FOR SELECT
USING (true);

-- Allow admins to manage categories
CREATE POLICY "Admins can manage categories"
ON categories
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Add author_id column to articles
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);

-- Enable RLS on articles
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read published articles" ON articles;
DROP POLICY IF EXISTS "Admins can manage all articles" ON articles;

-- Allow public to read published articles
CREATE POLICY "Allow public read published articles"
ON articles
FOR SELECT
USING (status = 'published' OR is_admin());

-- Allow admins to manage all articles
CREATE POLICY "Admins can manage all articles"
ON articles
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
```

### Step 3: Click "Run"

Click the **Run** button or press `Ctrl+Enter` / `Cmd+Enter`

### Step 4: Verify Success

You should see output showing:
- ✅ Policies created
- ✅ Column added
- ✅ No errors

### Step 5: Test Import

1. Go to your app: https://cinechatter.vercel.app/
2. **Hard refresh**: `Ctrl+Shift+R` or `Cmd+Shift+R`
3. Go to **Dashboard → Integration Settings**
4. Click **"Import Articles"**
5. Check **Articles tab** - articles should appear
6. **Check Supabase** → Table Editor → articles table
7. You should see your imported articles! ✅

---

## 📊 What This Does

### Before (Errors):
```
User imports article
  → App tries to read categories table
  → RLS blocks: 406 Not Acceptable ❌
  → App tries to create category
  → RLS blocks: 403 Forbidden ❌
  → App tries to save article with author_id
  → Column doesn't exist: 400 Bad Request ❌
```

### After (Working):
```
User imports article
  → App reads categories table
  → RLS allows: Public can read ✅
  → App creates category if needed
  → RLS allows: Admin can write ✅
  → App saves article (author_id is optional)
  → Column exists, save succeeds ✅
```

---

## 🔒 Security

**Q: Is this secure?**

**A: Yes!** The policies ensure:
- ✅ Anyone can **read** categories (needed for public site)
- ✅ Anyone can **read published** articles
- ✅ Only **admins** can create/edit/delete categories
- ✅ Only **admins** can create/edit/delete articles
- ❌ Regular users cannot modify data

---

## 🆘 Troubleshooting

### Still getting errors after running script?

1. **Check if is_admin() function exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'is_admin';
   ```

   If it doesn't exist, create it:
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

2. **Clear browser cache** and hard refresh

3. **Check console for new errors**

4. **Verify policies were created**:
   ```sql
   SELECT tablename, policyname FROM pg_policies
   WHERE tablename IN ('articles', 'categories');
   ```

### Error: "relation 'categories' does not exist"?

The categories table might not exist. Create it:

```sql
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ Success Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Ran the fix script
- [ ] Saw "Success" (no errors)
- [ ] Refreshed app on Vercel
- [ ] Imported articles
- [ ] Articles appear in app
- [ ] **Articles appear in Supabase articles table** ✅

---

## 📝 Note About Your Google Sheet

Your sheet format is missing Column F! It should be:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Category | Title | Description | Image | Date | **Status** |

Add a **Status** column (Column F) with value `published` for articles you want to show.

Without this column, articles will default to `draft` status and won't be visible on the site!

---

**Last Updated**: 2024-12-01
