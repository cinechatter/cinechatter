# RSS Feed Integration Guide

## Overview

CineChatter now pulls trending entertainment news from Google News RSS feeds and displays them in the "Trending Now" section on the homepage.

---

## How It Works

### 1. RSS Feed Sources

The app fetches news from three Google News RSS feeds:

- **Entertainment News**: General entertainment industry news
- **Movie Releases**: New and upcoming movie releases
- **TV/Web Series**: New streaming shows and TV series releases

### 2. Feed Location

File: `/src/services/rssFeedService.js`

This service handles:
- Fetching RSS feeds from Google News
- Parsing XML to JSON
- Extracting article data (title, description, image, link, date)
- CORS proxy handling (uses allorigins.win)

### 3. Integration Points

**App.jsx Changes:**

1. **Import**: Added `getTrendingNews` import from `rssFeedService`
2. **State**: Added `rssArticles` and `rssLoading` state variables
3. **Load Function**: Created `loadRSSFeed()` function to fetch articles on mount
4. **Trending Now Section**: Modified to display both local and RSS articles

---

## Display Logic

### Trending Now Section Shows:

- **4 local articles** (from your database/Google Sheets)
- **6 RSS articles** (from Google News)
- **Total**: Up to 10 articles in horizontal scroll

### Article Differentiation:

**Local Articles:**
- Opens in modal overlay when clicked
- Shows category from your categories list
- Says "Read →" button

**RSS Articles:**
- Opens in new browser tab when clicked
- Shows "Google News" badge in top-right corner
- Shows source name (e.g., "The Hollywood Reporter")
- Says "View →" button

---

## Features

### ✅ What's Implemented:

1. **Automatic Loading**: RSS feed loads when homepage loads
2. **Error Handling**: Gracefully handles feed failures
3. **Loading State**: Shows "Loading trending news..." while fetching
4. **Image Fallback**: Hides images that fail to load
5. **External Link Handling**: Opens RSS articles in new tab with security flags
6. **Mixed Content**: Seamlessly mixes your articles with external news
7. **Responsive Design**: Works on mobile, tablet, and desktop

### 🎨 Visual Design:

- RSS articles have **blue "Google News" badge** in top-right
- Local articles have **trending number badge** (#1, #2, etc.) in top-left
- Hover effects on all cards
- Gradient backgrounds matching theme
- Dark mode compatible

---

## CORS Proxy

### Why Needed?

Google News RSS feeds don't allow direct fetching from browsers due to CORS restrictions.

### Solution:

Using **allorigins.win** - a free CORS proxy service

```javascript
const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
```

### Alternative Proxies (if needed):

If allorigins.win is down, you can replace it with:
- `https://corsproxy.io/?url=`
- `https://cors-anywhere.herokuapp.com/`
- Your own CORS proxy server

---

## Configuration

### Change Feed Sources:

Edit `/src/services/rssFeedService.js`:

```javascript
const RSS_FEEDS = {
  entertainment: 'YOUR_CUSTOM_RSS_URL',
  movies: 'YOUR_CUSTOM_RSS_URL',
  tvSeries: 'YOUR_CUSTOM_RSS_URL',
};
```

### Change Article Count:

In `App.jsx`, find the Trending Now section:

```javascript
// Show 4 local articles + 6 RSS articles
const trendingArticles = [
  ...localArticles.slice(0, 4),  // Change this number
  ...rssArticles.slice(0, 6)     // Change this number
];
```

### Disable RSS Feed:

Comment out this line in `App.jsx` useEffect:

```javascript
useEffect(() => {
  loadArticles();
  loadFeaturedImages();
  checkUser();
  loadSheetSettings();
  // loadRSSFeed(); // ← Comment this line to disable
}, []);
```

---

## API Functions

### Available Functions:

```javascript
import {
  getTrendingNews,        // Get mixed news (entertainment, movies, TV)
  getEntertainmentNews,   // Get only entertainment news
  getMovieReleases,       // Get only movie news
  getTVSeriesReleases     // Get only TV/streaming news
} from './services/rssFeedService';
```

### Usage Example:

```javascript
// Get 15 trending articles
const articles = await getTrendingNews(15);

// Get 20 movie articles only
const movies = await getMovieReleases(20);
```

---

## Troubleshooting

### RSS Articles Not Showing?

1. **Check Browser Console**: Look for errors in Developer Tools
2. **CORS Proxy Down**: Try alternative proxy services
3. **Network Issues**: RSS fetch might be blocked by firewall/VPN
4. **RSS Feed Changed**: Google may have changed feed URLs

### Images Not Loading?

- RSS feeds don't always include images
- Some images fail due to CORS or hotlinking protection
- Images gracefully hide if they fail to load

### Slow Loading?

- RSS feed fetch takes 2-5 seconds on first load
- This is normal due to external API calls
- Consider caching RSS results in localStorage for better performance

---

## Future Enhancements

### Potential Improvements:

1. **Caching**: Store RSS results in localStorage for 15-30 minutes
2. **Refresh Button**: Manual refresh option for RSS feeds
3. **Filter Options**: Let users choose which types of news to show
4. **Personalization**: Remember user's preferred news categories
5. **Backend Integration**: Move RSS fetching to backend to avoid CORS entirely
6. **RSS Categories**: Add more specific RSS feeds (celebrity news, awards, etc.)

---

## Performance

### Current Stats:

- **RSS Fetch Time**: ~2-5 seconds on first load
- **Articles Fetched**: 10 total (from 3 different feeds)
- **Memory Usage**: Minimal (~50KB for 10 articles)
- **Re-fetch**: Only on page reload (no auto-refresh)

### Optimization Tips:

```javascript
// Add localStorage caching:
const cachedRSS = localStorage.getItem('rss-cache');
const cacheTime = localStorage.getItem('rss-cache-time');
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

if (cachedRSS && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
  setRssArticles(JSON.parse(cachedRSS));
} else {
  const news = await getTrendingNews(10);
  localStorage.setItem('rss-cache', JSON.stringify(news));
  localStorage.setItem('rss-cache-time', Date.now());
}
```

---

## Testing

### How to Test:

1. **Open homepage**: Navigate to http://localhost:3000
2. **Check "Trending Now"**: Should see 10 articles
3. **Look for badges**: RSS articles have blue "Google News" badge
4. **Click local article**: Should open in modal
5. **Click RSS article**: Should open in new browser tab
6. **Check console**: Should see "📰 Loaded X RSS articles from Google News"

### Test Different Scenarios:

- Disable internet → Should show only local articles
- Clear cache → Should fetch fresh RSS articles
- Dark mode → RSS articles should look good in both themes

---

## Support

For issues or questions:
- Check browser console for errors
- Review RSS feed URLs in `rssFeedService.js`
- Verify CORS proxy is working
- Test with different proxy services if needed

---

**Happy news aggregation!** 🎬📰✨
