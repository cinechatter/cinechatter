# CineChatter Database Setup Guide

This guide walks you through setting up the Supabase database for CineChatter.

---

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. Create a new organization (e.g., "CineChatter")

---

## Step 2: Create New Project

1. Click **"New Project"**
2. Fill in details:
   - **Name**: `cinechatter`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (500MB database, 50MB file storage)
3. Click **"Create new project"**
4. Wait 2-3 minutes for setup to complete

---

## Step 3: Run Database Schema

1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open `database/schema.sql` from this project
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. You should see: **"Success. No rows returned"**

This creates all 7 tables:
- ✅ categories (10 default categories)
- ✅ articles (with SEO fields)
- ✅ google_sheets_sync
- ✅ users (linked to Supabase Auth)
- ✅ admin_settings (with default settings)
- ✅ comments
- ✅ bookmarks

---

## Step 4: Get API Credentials

1. In Supabase dashboard, click **"Settings"** (left sidebar)
2. Click **"API"**
3. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 5: Add Environment Variables

1. Create a `.env` file in your project root:

```bash
# CineChatter/.env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Make sure `.env` is in your `.gitignore` (it already is!)

---

## Step 6: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

---

## Step 7: Test Connection

Create a test file to verify database connection:

```javascript
// test-db.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Test 1: Fetch categories
const { data: categories, error } = await supabase
  .from('categories')
  .select('*')

if (error) {
  console.error('Error:', error)
} else {
  console.log('✅ Categories loaded:', categories.length)
}

// Test 2: Fetch admin settings
const { data: settings } = await supabase
  .from('admin_settings')
  .select('setting_key, setting_value')
  .eq('is_public', true)

console.log('✅ Settings loaded:', settings)
```

Run with: `node test-db.js`

---

## Database Tables Overview

### 1. **categories**
Stores article categories (Hollywood, Bollywood, etc.)
- 10 default categories pre-populated
- Supports hierarchical structure (parent_id)

### 2. **articles**
Main content table with SEO optimization
- Auto-generated: slug, meta_title, meta_description, keywords, reading_time
- Multi-source: New Article, Google Sheets, Untold Stories, Agent
- Features: is_featured flag for Treasure Box stories

### 3. **google_sheets_sync**
Tracks Google Sheets synchronization
- Upsert support: same URL = update existing record
- Fields: sheet_url, articles_synced, status, updated_on

### 4. **users**
User profiles linked to Supabase Auth
- Auto-created when user signs up via Supabase Auth
- Tracks: newsletter subscription, favorite categories, reading history
- UUID primary key (matches auth.users)

### 5. **admin_settings**
Key-value configuration store
- Pre-populated with 20+ default settings
- Groups: general, seo, integration, appearance, newsletter, social
- No code changes needed to add new settings

### 6. **comments**
User comments on articles
- Requires authentication to create
- Supports nested replies (parent_comment_id)
- Moderation: pending, approved, spam, deleted

### 7. **bookmarks**
User bookmarked articles
- Requires authentication
- Unique constraint prevents duplicates

---

## Security (Row Level Security)

All tables have RLS policies enabled:

| Table | Who Can Access |
|-------|----------------|
| **categories** | Anyone (published only) |
| **articles** | Anyone (published only) |
| **admin_settings** | Anyone (public settings only) |
| **users** | User can only see/edit own profile |
| **comments** | Anyone can view approved; users can create/edit own |
| **bookmarks** | Users can only see/edit own bookmarks |

---

## Helper Functions

The schema includes several helper functions:

### `increment_article_view_count(article_id)`
Increments view count for an article
```javascript
await supabase.rpc('increment_article_view_count', { article_id: 123 })
```

### `get_sitemap_articles()`
Returns all published articles for sitemap generation
```javascript
const { data } = await supabase.rpc('get_sitemap_articles')
```

### `get_category_article_counts()`
Returns article count per category
```javascript
const { data } = await supabase.rpc('get_category_article_counts')
```

### `get_trending_articles(limit_count)`
Returns top articles by view count
```javascript
const { data } = await supabase.rpc('get_trending_articles', { limit_count: 10 })
```

---

## SEO Auto-Generation (Phase 1)

SEO fields are auto-generated using `src/utils/seoHelpers.js`:

```javascript
import { autoGenerateSEOFields } from './utils/seoHelpers'

// When creating an article
const article = {
  title: 'Avatar 2 Breaks Box Office Records',
  content: 'James Cameron\'s Avatar sequel has shattered...',
  category_id: 1,
  image_url: 'https://i.imgur.com/example.jpg'
}

// Auto-generate SEO fields
const articleWithSEO = autoGenerateSEOFields(article)

// Result:
{
  title: 'Avatar 2 Breaks Box Office Records',
  content: 'James Cameron\'s Avatar sequel has shattered...',
  slug: 'avatar-2-breaks-box-office-records',
  meta_title: 'Avatar 2 Breaks Box Office Records | CineChatter',
  meta_description: 'James Cameron\'s Avatar sequel has shattered box office records...',
  keywords: ['avatar', 'james', 'cameron', 'sequel', 'records'],
  reading_time: 3,
  canonical_url: 'https://cinechatter.com/article/avatar-2-breaks-box-office-records',
  category_id: 1,
  image_url: 'https://i.imgur.com/example.jpg'
}

// Save to database
const { data, error } = await supabase
  .from('articles')
  .insert(articleWithSEO)
```

---

## Next Steps

1. ✅ Database schema created
2. ✅ SEO auto-generation ready
3. ⏳ Update React app to use Supabase (instead of localStorage)
4. ⏳ Implement Google Sheets sync to database
5. ⏳ Add user authentication UI
6. ⏳ Migrate existing articles from localStorage to Supabase

---

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the entire `schema.sql` script
- Check for any SQL errors in the output

### Error: "permission denied for schema auth"
- Normal for `auth.users` table - it's managed by Supabase
- The trigger `on_auth_user_created` handles user profile creation

### Error: "JWT expired" or "Invalid API key"
- Check your `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after changing `.env`

### Articles not showing up
- Check RLS policies - only `status = 'published'` articles are visible
- Use Supabase Table Editor to verify data exists

---

## Free Tier Limits

Supabase Free Plan includes:
- ✅ 500 MB database space (~1.35 million articles)
- ✅ 50 MB file storage (use Imgur for images)
- ✅ 50,000 monthly active users
- ✅ 2 GB bandwidth
- ✅ 500 MB egress

**For CineChatter, this is more than enough!**

---

## Support

- Supabase Docs: https://supabase.com/docs
- CineChatter Issues: cinechattercontact@gmail.com
