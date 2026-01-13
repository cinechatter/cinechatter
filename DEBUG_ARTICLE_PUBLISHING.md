# Debug Article Publishing Issue

## Run This Diagnostic Script

Copy and paste this entire script into your browser console (F12 → Console) while on https://cinechatter.vercel.app:

```javascript
// ============================================
// CineChatter Article Publishing Diagnostic
// ============================================

console.log('\n🔍 CINECHATTER DIAGNOSTIC REPORT\n' + '='.repeat(50) + '\n');

// 1. Check Environment
console.log('📍 ENVIRONMENT');
console.log('  URL:', window.location.href);
console.log('  Hostname:', window.location.hostname);
console.log('  Production:', import.meta.env.PROD);
console.log('');

// 2. Check Data Source Setting
console.log('⚙️ DATA SOURCE SETTING');
const dataSource = localStorage.getItem('cine-chatter-data-source');
console.log('  Current setting:', dataSource);

if (dataSource === 'sheets-only') {
  console.error('  ❌ ISSUE: dataSource is "sheets-only"');
  console.error('     AI articles will NOT be visible!');
  console.log('  ✅ FIX: Run this command:');
  console.log('     localStorage.setItem("cine-chatter-data-source", "admin-only"); location.reload();');
} else if (dataSource === 'admin-only') {
  console.log('  ✅ CORRECT: Only admin articles will show');
} else if (dataSource === 'both') {
  console.log('  ✅ CORRECT: Both admin and sheets articles will show');
} else {
  console.warn('  ⚠️  Unknown dataSource:', dataSource);
}
console.log('');

// 3. Check Storage Backend
console.log('💾 STORAGE BACKEND');
console.log('  Supabase URL configured:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('  Supabase Key configured:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('');

// 4. Check Articles in Memory
console.log('📚 ARTICLES IN MEMORY');
// We'll need to wait for React to load, so we'll check the DOM for article count
setTimeout(() => {
  console.log('  (Check the React DevTools or console logs for article count)');
  console.log('  Look for: "📚 Loaded X articles from..."');
}, 1000);
console.log('');

// 5. Available Categories
console.log('📂 AVAILABLE CATEGORIES');
const categories = [
  { id: 'hollywood-movies', name: 'Hollywood Movies' },
  { id: 'hollywood-news', name: 'Hollywood News' },
  { id: 'bollywood-movies', name: 'Bollywood Movies' },
  { id: 'bollywood-news', name: 'Bollywood News' },
  { id: 'ott', name: 'OTT' },
  { id: 'music', name: 'Music' },
  { id: 'celebrity-style', name: 'Celebrity Style' },
  { id: 'international', name: 'International Cinema' },
  { id: 'youtube-scripts', name: 'YouTube Scripts' }
];
categories.forEach(cat => {
  console.log(`  - ${cat.id} → "${cat.name}"`);
});
console.log('');

// 6. Test Category Normalization
console.log('🔧 CATEGORY NORMALIZATION TEST');
const testCategories = ['hollywood-news', 'Hollywood News', 'Hollywood-News', 'HOLLYWOOD-NEWS'];
const normalizeCat = (category) => {
  if (!category) return '';
  return category.toLowerCase().trim().replace(/\s+/g, '-');
};
testCategories.forEach(test => {
  console.log(`  "${test}" → "${normalizeCat(test)}"`);
});
console.log('');

// 7. Instructions
console.log('📋 NEXT STEPS');
console.log('  1. If dataSource is "sheets-only", fix it with the command above');
console.log('  2. Go to Dashboard → AI Agent');
console.log('  3. Generate a test article with:');
console.log('     - Movie Name: "Test Debug Article"');
console.log('     - Category: "Hollywood News"');
console.log('     - Click Generate → Publish');
console.log('  4. Watch the console for these logs:');
console.log('     📝 Publishing AI Article:');
console.log('       - Category: ...');
console.log('     ✅ Articles saved to ...');
console.log('       - Latest article: ...');
console.log('       - Category: ...');
console.log('  5. Navigate to Hollywood → News');
console.log('  6. Watch console for:');
console.log('     🔍 getCategoryArticles called for: "hollywood-news"');
console.log('       - All articles by category: [...]');
console.log('       - Matching admin articles: ...');
console.log('');

console.log('✅ Diagnostic complete! Follow the steps above and share the console output.');
console.log('='.repeat(50));
```

## Step-by-Step Debugging Process

### Step 1: Run the Diagnostic Script

1. Go to https://cinechatter.vercel.app
2. Press F12 (DevTools)
3. Go to Console tab
4. Paste the script above
5. Press Enter

**What to look for:**
- Is dataSource set to "admin-only" or "both"? (NOT "sheets-only")
- Are Supabase credentials configured?

### Step 2: Generate and Publish Test Article

1. Go to **Dashboard → AI Agent**
2. Fill in:
   - **Movie Name**: Test Debug Article
   - **Content Type**: Review
   - **Category**: **Hollywood News** (select from dropdown)
   - **AI Quality**: ChatGPT 4o + Google Search
3. Click **"Generate Article with AI"**
4. Wait for generation
5. Click **"Publish Article"**

**Watch Console For:**

```
📝 Publishing AI Article:
  - Title: Review: Test Debug Article
  - Category: hollywood-news     <-- Should be "hollywood-news"
  - Status: published
  - Current dataSource setting: admin-only

📝 handleAIArticlePublish called
  - Article: Review: Test Debug Article
  - Category: hollywood-news
  - Current articles count: X

✅ Articles saved to supabase. Total: X
  - Latest article: "Review: Test Debug Article"
  - Category: "hollywood-news"    <-- Verify this matches
  - Status: "published"

🔄 Reloading articles from storage to refresh state...

📚 Loaded X articles from supabase
  - By category: { hollywood-news: 1, ... }
  - Recent articles: [{ title: "Review: Test Debug Article", category: "hollywood-news", ... }]
```

**Take a screenshot of this output!**

### Step 3: Navigate to Category Page

1. Click **"Home"** in top menu
2. Hover over **"Hollywood"**
3. Click **"News"**

**Watch Console For:**

```
🔍 getCategoryArticles called for: "hollywood-news"
  - Normalized: "hollywood-news"
  - Total articles in memory: X
  - Current dataSource: admin-only
  - All articles by category: [
      {
        title: "Review: Test Debug Article",
        category: "hollywood-news",
        normalized: "hollywood-news",
        status: "published",
        matches: true      <-- Should be TRUE
      },
      ...
    ]
  - Matching admin articles: X    <-- Should be at least 1
  - Matching sheets articles: 0
```

**Take a screenshot of this output!**

### Step 4: Share Results

Send me screenshots showing:
1. The diagnostic script output
2. The console logs when publishing (Step 2)
3. The console logs when viewing category page (Step 3)

## Common Issues and Fixes

### Issue 1: Category Saved as Different Value

**Symptom:** Console shows:
```
  - Category: "celebrity-style"    <-- But you selected "Hollywood News"
```

**Cause:** Form default not updating when you select category

**Fix:** Will need to fix the dropdown binding

---

### Issue 2: dataSource is "sheets-only"

**Symptom:** Console shows:
```
  - Current dataSource: sheets-only
  ⚠️ WARNING: dataSource is set to "sheets-only"!
```

**Fix:** Run this in console:
```javascript
localStorage.setItem('cine-chatter-data-source', 'admin-only');
location.reload();
```

---

### Issue 3: Articles Not in Memory

**Symptom:** Console shows:
```
  - Total articles in memory: 0
```

**Cause:** Articles not loading from storage

**Fix:** Check Supabase connection, check for errors in console

---

### Issue 4: Category Mismatch

**Symptom:** Console shows:
```
  category: "Hollywood News",    <-- Not normalized!
  normalized: "hollywood-news",
  matches: false                 <-- Doesn't match
```

**Cause:** Category saved with spaces instead of hyphens

**Fix:** Will need to ensure category is saved as category ID, not name

---

## Quick Fixes to Try

### Fix 1: Clear and Reset dataSource

```javascript
localStorage.clear();
localStorage.setItem('cine-chatter-data-source', 'admin-only');
alert('Cleared and reset. Refreshing...');
location.reload();
```

### Fix 2: Check Supabase Articles Directly

```javascript
// Only works if logged in
const { data, error } = await window.supabase
  .from('articles')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);

console.log('Recent articles from Supabase:', data);
console.log('Errors:', error);
```

### Fix 3: Force Reload Articles

Refresh the page and check if articles appear after a hard refresh (Ctrl+Shift+R or Cmd+Shift+R).

---

## What I Need From You

Please run through Steps 1-3 above and send me:

1. **Screenshot of diagnostic script output**
2. **Screenshot of console when publishing article**
3. **Screenshot of console when viewing category page**
4. Tell me: **Do you see the article in Dashboard → Articles tab?**

This will help me pinpoint exactly where the issue is!
