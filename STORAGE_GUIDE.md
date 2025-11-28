# CineChatter Storage System Guide

## Overview

CineChatter uses an **environment-based storage system** that automatically routes data to the appropriate backend based on your environment:

- **Development (`npm run dev`)**: Uses **browser localStorage** (fast, simple, no setup needed)
- **Production (`npm run build` + deploy)**: Uses **Supabase database** (persistent, scalable, multi-user)

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              storageService (Adapter)                    │
│              Detects environment automatically           │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌──────────────────┐
│ localStorage  │   │    Supabase      │
│ (Development) │   │  (Production)    │
│               │   │                  │
│ • Fast        │   │ • Persistent     │
│ • Simple      │   │ • Multi-user     │
│ • No setup    │   │ • Scalable       │
│ • Browser only│   │ • Cloud-backed   │
└───────────────┘   └──────────────────┘
```

### Environment Detection

The system automatically detects your environment using Vite's built-in variables:

```javascript
// Development mode (npm run dev)
import.meta.env.DEV === true
import.meta.env.MODE === 'development'

// Production mode (npm run build)
import.meta.env.PROD === true
import.meta.env.MODE === 'production'
```

## Data Persistence

### Development Environment
- **Storage**: Browser localStorage
- **Persistence**: Data survives page reloads
- **Limitations**:
  - Cleared when browser cache is cleared
  - Per-browser (Chrome data ≠ Firefox data)
  - Per-device (laptop data ≠ phone data)
  - Not suitable for production

### Production Environment
- **Storage**: Supabase PostgreSQL database
- **Persistence**: Permanent, survives:
  - Browser cache clears
  - Redeployments
  - Device changes
  - Server restarts
- **Features**:
  - Multi-user support
  - User authentication integration
  - Automatic timestamps
  - Data relationships (categories, authors)

## File Structure

```
src/
├── services/
│   ├── storageService.js          # Main adapter (routes to correct backend)
│   ├── migrationService.js        # Tools to migrate data
│   └── storage/
│       ├── localStorageBackend.js # localStorage implementation
│       └── supabaseBackend.js     # Supabase implementation
└── components/
    └── MigrationPanel.jsx         # UI for data migration
```

## API Usage

### Basic Operations

```javascript
import storageService from './services/storageService';

// Get all articles
const articles = await storageService.getArticles();

// Save articles
await storageService.saveArticles(updatedArticles);

// Add single article
const newArticle = await storageService.addArticle(articleData);

// Update single article
const updated = await storageService.updateArticle(articleData);

// Delete article
await storageService.deleteArticle(articleId);

// Check current backend
const backend = storageService.getBackendType(); // 'localStorage' or 'supabase'
```

## Data Migration

### When to Migrate

Migrate data from localStorage to Supabase when:
1. Moving from development to production
2. You have test data you want to keep
3. Switching from local testing to production deployment

### How to Migrate

#### Option 1: Using Migration Panel (Recommended)

1. Add the MigrationPanel component to your admin settings:

```jsx
import MigrationPanel from './components/MigrationPanel';

// In your admin panel:
<MigrationPanel />
```

2. Open admin panel in your app
3. Navigate to Migration section
4. Click "Migrate to Supabase" button
5. Confirm migration

#### Option 2: Manual Migration

```javascript
import migrationService from './services/migrationService';

// Check if migration is needed
const needed = await migrationService.needsMigration();

if (needed) {
  // Migrate everything
  const result = await migrationService.migrateAll();

  console.log(result.message);
  // "Successfully migrated 50 items (45 articles, 5 images)"
}
```

#### Option 3: Backup and Restore

```javascript
import migrationService from './services/migrationService';

// Download backup as JSON file
await migrationService.downloadLocalStorageBackup();

// This creates a file: cinechatter-backup-{timestamp}.json
```

## Schema Mapping

The system automatically maps between your App.jsx format and Supabase schema:

### App.jsx Format (what your code uses)
```javascript
{
  id: 12345,
  title: "Movie Review",
  content: "Article content...",
  category: "hollywood-movies",  // String slug
  image: "https://...",
  status: "published",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Supabase Format (how it's stored in database)
```javascript
{
  id: 1,                          // Auto-incremented
  title: "Movie Review",
  slug: "movie-review-12345",     // Auto-generated
  content: "Article content...",
  category_id: 5,                 // Foreign key to categories table
  featured_image: "https://...",
  author_id: "uuid-...",          // Foreign key to users
  status: "published",
  published_at: "2024-01-15T10:30:00Z",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z"
}
```

The mapping happens automatically - you don't need to change any code!

## Supabase Schema

### Required Tables

#### 1. articles
```sql
- id (BIGSERIAL PRIMARY KEY)
- title (VARCHAR 255)
- slug (VARCHAR 255 UNIQUE)
- content (TEXT)
- featured_image (VARCHAR 500)
- category_id (BIGINT -> categories.id)
- author_id (UUID -> auth.users.id)
- status (VARCHAR 20)
- published_at (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 2. categories
```sql
- id (BIGSERIAL PRIMARY KEY)
- name (VARCHAR 100)
- slug (VARCHAR 100 UNIQUE)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 3. admin_settings
```sql
- setting_key (VARCHAR 100 UNIQUE)
- setting_value (TEXT)
- setting_type (VARCHAR 20)
```

**Note**: These tables should already exist in your Supabase database from the migration files.

## Testing

### Test in Development

```bash
# Start dev server
npm run dev

# Open browser console
# You should see: "💾 Using localStorage (Development)"

# Create some test articles
# Data will be saved to localStorage
```

### Test in Production

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Open browser console
# You should see: "🗄️ Using Supabase storage (Production)"

# Create articles - they'll be saved to Supabase
```

### Verify Migration

```javascript
// In browser console (development mode):

// Check localStorage data
const data = localStorage.getItem('cine-chatter-articles');
console.log(JSON.parse(data));

// In production, query Supabase directly via dashboard
```

## Troubleshooting

### Issue: Articles not saving in production

**Check:**
1. Supabase credentials in `.env` file
2. Browser console for errors
3. Supabase dashboard > Table Editor > articles
4. Network tab for failed requests

**Solution:**
```bash
# Verify env variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check Supabase connection
# In browser console:
import { supabase } from './lib/supabase';
const { data, error } = await supabase.from('articles').select('count');
console.log(data, error);
```

### Issue: Migration fails

**Common causes:**
1. Supabase not configured
2. Missing categories table
3. RLS (Row Level Security) blocking inserts

**Solution:**
```sql
-- Run in Supabase SQL Editor:

-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'articles';

-- Temporarily disable RLS for testing (re-enable after!)
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
```

### Issue: Data lost after browser refresh (development)

**This is normal** - localStorage can be cleared by:
- Browser cache clear
- Incognito/private mode
- Browser settings

**Solution:**
```javascript
// Backup before clearing cache
import migrationService from './services/migrationService';
await migrationService.downloadLocalStorageBackup();
```

## Best Practices

### Development Workflow

1. **Start with dev mode**: `npm run dev`
2. **Create test data** in localStorage
3. **Test features** thoroughly
4. **Backup data**: Download JSON backup before deploying
5. **Build for production**: `npm run build`
6. **Deploy** to production (Vercel, Netlify, etc.)
7. **Migrate** if you want to keep dev data

### Production Deployment

1. **Verify Supabase is set up** with all tables
2. **Set environment variables** in hosting platform:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```
3. **Deploy** your app
4. **Test** article creation in production
5. **Verify** data persists in Supabase dashboard

### Data Safety

- ✅ **DO**: Backup localStorage before major changes
- ✅ **DO**: Test in production mode locally before deploying
- ✅ **DO**: Verify Supabase connection before migration
- ❌ **DON'T**: Rely on localStorage for production data
- ❌ **DON'T**: Clear browser cache without backup in development
- ❌ **DON'T**: Disable RLS policies permanently

## FAQ

### Q: Will my data be lost when I restart the app?

**Development**: Only if you clear browser cache
**Production**: No, data is in Supabase database

### Q: Can I use Supabase in development?

Yes, but not recommended. Change this in `storageService.js`:

```javascript
const isProduction = () => {
  return true; // Always use Supabase
};
```

### Q: How do I switch back to localStorage in production?

Not recommended, but possible:

```javascript
const isProduction = () => {
  return false; // Always use localStorage
};
```

### Q: What happens if Supabase is down?

In production, article operations will fail. You should:
1. Add error handling UI
2. Show user-friendly error messages
3. Implement retry logic
4. Have monitoring/alerting for Supabase status

### Q: Can I use both backends simultaneously?

No, only one backend is active at a time based on environment.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment detection: `storageService.getBackendType()`
3. Check Supabase dashboard for data
4. Review this guide's troubleshooting section

---

**Last Updated**: 2024-11-27
**Version**: 1.0.0
