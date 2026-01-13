# AI Article Visibility Fix

## Problem

AI-generated articles are being created successfully but **not appearing on category pages** (e.g., Hollywood > News, Bollywood > Movies, etc.).

## Root Cause

The `dataSource` setting in your browser's `localStorage` is set to **"sheets-only"**, which means:
- ✅ Articles FROM Google Sheets are displayed
- ❌ Articles FROM AI Generator (admin articles) are HIDDEN

This happens because the app caches your data source preference in `localStorage`, and it was originally defaulted to "sheets-only" before we fixed it.

---

## Solution Options

### ✅ **Option 1: Use the Warning Banner (Easiest - After Next Deploy)**

After you deploy the latest changes, you'll see a **yellow warning banner** at the top of the AI Agent page if your dataSource is set to "sheets-only".

**Just click the "Fix Now" button** and it will:
1. Switch to "admin-only"
2. Reload the page
3. Your articles will appear!

---

### ✅ **Option 2: Fix Manually via Browser Console (Works Right Now)**

1. Go to https://cinechatter.vercel.app
2. Open browser DevTools (Press **F12**)
3. Go to **Console** tab
4. Paste this command and press Enter:

```javascript
localStorage.setItem('cine-chatter-data-source', 'admin-only');
location.reload();
```

5. Your AI articles will now appear!

---

### ✅ **Option 3: Fix via Dashboard UI**

1. Go to **Dashboard** → **Integration Settings** tab
2. Scroll down to find **"Data Source Settings"**
3. Select one of these:
   - **"Admin Only"** - Shows only AI-generated articles (recommended)
   - **"Both Sources"** - Shows both AI articles AND Google Sheets articles
4. Click Save
5. Navigate to your category pages to see the articles

---

## How to Verify It's Fixed

### Step 1: Check Your Current Setting

Open browser console (F12) and run:

```javascript
console.log('Current dataSource:', localStorage.getItem('cine-chatter-data-source'));
```

**Should show:** `admin-only` or `both` (NOT `sheets-only`)

### Step 2: Generate and Publish a Test Article

1. Go to **Dashboard** → **AI Agent**
2. Generate an article with these settings:
   - Movie Name: "Test Article"
   - Content Type: Review
   - Category: **Hollywood News**
   - AI Quality: ChatGPT 4o + Google Search
3. Click **"Generate Article with AI"**
4. Review and click **"Publish Article"**

### Step 3: Check Console Logs

After clicking Publish, you should see in the console:

```
📝 Publishing AI Article:
  - Title: Review: Test Article
  - Category: hollywood-news
  - Status: published
  - ID: 1736719262000
  - Current dataSource setting: admin-only
✅ dataSource is set correctly: admin-only
```

✅ **If you see this**, the article will appear on the site!

❌ **If you see "sheets-only" warning**, use one of the solutions above.

### Step 4: Navigate to the Category Page

1. Click **"Home"** in the top menu
2. Hover over **"Hollywood"** dropdown
3. Click **"News"**
4. Your test article should appear at the top!

---

## Understanding Data Source Settings

CineChatter has three data source options:

| Setting | What Shows | When to Use |
|---------|-----------|-------------|
| **Admin Only** | Only AI-generated articles | Best for most users - shows your AI content |
| **Sheets Only** | Only Google Sheets articles | If you're importing from Sheets and don't want AI articles |
| **Both Sources** | All articles (AI + Sheets) | If you want to use both AI generation AND Sheets import |

---

## Debugging Commands

### Check if Articles Are Saved

```javascript
// For Supabase (production)
const { data } = await window.supabase.from('articles').select('*');
console.log('Articles in database:', data);

// Or check console after publishing
// You'll see: "✅ Articles saved to supabase. Total: X"
```

### View All Articles by Category

```javascript
// Check what's in storage
const articles = JSON.parse(localStorage.getItem('cine-chatter-articles') || '[]');
console.log('Total articles:', articles.length);
console.log('By category:', articles.reduce((acc, a) => {
  acc[a.category] = (acc[a.category] || 0) + 1;
  return acc;
}, {}));
```

### Force Switch to Admin Only

```javascript
localStorage.setItem('cine-chatter-data-source', 'admin-only');
alert('Switched to Admin Only mode!');
location.reload();
```

---

## After Deploying the Fix

Once you push the latest code to production, you'll get these improvements:

### 1. **Warning Banner**
- Shows automatically if dataSource is "sheets-only"
- One-click fix button
- Clear explanation of the issue

### 2. **Better Console Logging**
- See exactly what's happening when you publish
- Track category, status, and dataSource
- Warnings if articles won't be visible

### 3. **Smart Alerts**
- Different messages based on dataSource setting
- Guidance on where to find the published article
- Instructions if articles won't show

---

## Deploy Instructions

To deploy these fixes to production:

```bash
cd /Users/namitasudan/Namita/code/cinechatter/cinechatter
git push origin main
```

Wait 2-3 minutes for Vercel to build and deploy.

Then visit https://cinechatter.vercel.app and:
1. Go to Dashboard → AI Agent
2. You'll see the warning banner if needed
3. Click "Fix Now" to resolve

---

## FAQ

### Q: I fixed the dataSource but articles still don't appear?

**A:** Try these steps:
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser console for errors
3. Verify article was saved: Go to Dashboard → Articles tab
4. Make sure the category matches exactly (e.g., "hollywood-news" not "Hollywood > News")

### Q: Can I see both AI articles and Google Sheets articles?

**A:** Yes! Change dataSource to **"Both Sources"** in Dashboard → Integration Settings

### Q: Will changing dataSource delete my articles?

**A:** No! All articles are saved. The dataSource setting only controls **which articles are displayed**, not which are stored.

### Q: I'm in production but don't see the warning banner?

**A:** You need to deploy the latest changes first. Run `git push origin main` and wait for deployment.

---

## Quick Reference

### Current DataSource?
```javascript
localStorage.getItem('cine-chatter-data-source')
```

### Fix to Admin Only
```javascript
localStorage.setItem('cine-chatter-data-source', 'admin-only'); location.reload();
```

### Fix to Both Sources
```javascript
localStorage.setItem('cine-chatter-data-source', 'both'); location.reload();
```

### Check Total Articles
```javascript
// Check all articles (you'll need to check in Dashboard → Articles tab)
// Or run in console after articles are loaded
```

---

For more help, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) and [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)
