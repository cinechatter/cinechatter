/**
 * RSS Feed Service
 *
 * Fetches entertainment news from Google News RSS feeds
 * - Entertainment news
 * - Movie releases
 * - TV/Web series releases
 */

// Google News RSS Feed URLs
const RSS_FEEDS = {
  entertainment: 'https://news.google.com/rss/search?q=entertainment+news&hl=en-US&gl=US&ceid=US:en',
  movies: 'https://news.google.com/rss/search?q=new+movie+releases+OR+upcoming+movies&hl=en-US&gl=US&ceid=US:en',
  tvSeries: 'https://news.google.com/rss/search?q=new+web+series+OR+new+tv+shows+OR+streaming+releases&hl=en-US&gl=US&ceid=US:en',
};

/**
 * Parse RSS XML to JSON
 */
const parseRSS = (xmlText) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const items = xmlDoc.querySelectorAll('item');
  const articles = [];

  items.forEach((item, index) => {
    // Extract data from RSS item
    const title = item.querySelector('title')?.textContent || '';
    const link = item.querySelector('link')?.textContent || '';
    const description = item.querySelector('description')?.textContent || '';
    const pubDate = item.querySelector('pubDate')?.textContent || '';
    const source = item.querySelector('source')?.textContent || 'Google News';

    // Try to extract image from description HTML
    let image = null;
    const descDiv = document.createElement('div');
    descDiv.innerHTML = description;
    const imgTag = descDiv.querySelector('img');
    if (imgTag) {
      image = imgTag.src;
    }

    // Clean description (remove HTML tags)
    const cleanDescription = descDiv.textContent?.trim() || description.replace(/<[^>]*>/g, '').trim();

    articles.push({
      id: `rss-${Date.now()}-${index}`,
      title,
      link,
      description: cleanDescription,
      excerpt: cleanDescription.substring(0, 150) + (cleanDescription.length > 150 ? '...' : ''),
      image,
      source,
      publishedAt: pubDate,
      createdAt: pubDate,
      isExternal: true, // Flag to indicate this is external content
    });
  });

  return articles;
};

/**
 * Fetch RSS feed via CORS proxy
 * Note: Direct RSS fetching is blocked by CORS, so we use a proxy
 */
const fetchRSSFeed = async (feedUrl) => {
  try {
    // Using allorigins.win as CORS proxy (free service)
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;

    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    const xmlText = await response.text();
    return parseRSS(xmlText);
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return [];
  }
};

/**
 * Get trending entertainment news
 * Combines news from all RSS feeds
 */
export const getTrendingNews = async (limit = 10) => {
  try {
    // Fetch all feeds in parallel
    const [entertainmentNews, movieNews, tvNews] = await Promise.all([
      fetchRSSFeed(RSS_FEEDS.entertainment),
      fetchRSSFeed(RSS_FEEDS.movies),
      fetchRSSFeed(RSS_FEEDS.tvSeries),
    ]);

    // Combine all articles
    const allArticles = [
      ...entertainmentNews.slice(0, 4),
      ...movieNews.slice(0, 3),
      ...tvNews.slice(0, 3),
    ];

    // Sort by publish date (newest first)
    allArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt);
      const dateB = new Date(b.publishedAt);
      return dateB - dateA;
    });

    // Return limited results
    return allArticles.slice(0, limit);
  } catch (error) {
    console.error('Error getting trending news:', error);
    return [];
  }
};

/**
 * Get entertainment news only
 */
export const getEntertainmentNews = async (limit = 10) => {
  const articles = await fetchRSSFeed(RSS_FEEDS.entertainment);
  return articles.slice(0, limit);
};

/**
 * Get movie releases only
 */
export const getMovieReleases = async (limit = 10) => {
  const articles = await fetchRSSFeed(RSS_FEEDS.movies);
  return articles.slice(0, limit);
};

/**
 * Get TV/Web series releases only
 */
export const getTVSeriesReleases = async (limit = 10) => {
  const articles = await fetchRSSFeed(RSS_FEEDS.tvSeries);
  return articles.slice(0, limit);
};
