/**
 * Google Custom Search Service
 * Handles Google Custom Search API calls for entertainment content
 */

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
const GOOGLE_CSE_ID = import.meta.env.VITE_GOOGLE_CSE_ID;

/**
 * Perform Google Custom Search
 * @param {string} query - Search query
 * @param {number} numResults - Number of results to fetch (max 10 per request)
 * @returns {Promise<Array>} - Array of search results
 */
export const performGoogleSearch = async (query, numResults = 5) => {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    console.warn('⚠️ Google Search API credentials not configured');
    console.warn('   Articles will be generated without web search data');
    return [];
  }

  // Validate credentials are not placeholders
  if (GOOGLE_API_KEY.includes('your_') || GOOGLE_CSE_ID.includes('your_')) {
    console.warn('⚠️ Google Search API credentials are placeholder values');
    console.warn('   Articles will be generated without web search data');
    return [];
  }

  console.log('🔍 Performing Google Search:', query);
  console.log('   API Key configured:', GOOGLE_API_KEY ? 'Yes' : 'No');
  console.log('   CSE ID configured:', GOOGLE_CSE_ID ? 'Yes' : 'No');

  try {
    // Google Custom Search JSON API endpoint
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', GOOGLE_API_KEY);
    url.searchParams.append('cx', GOOGLE_CSE_ID);
    url.searchParams.append('q', query);
    url.searchParams.append('num', Math.min(numResults, 10)); // Max 10 per request

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Google Search API error:', response.status, errorData);

      if (response.status === 429) {
        console.error('Rate limit exceeded. Daily quota: 100 free queries');
      } else if (response.status === 403) {
        console.error('API key invalid or API not enabled');
      }

      return [];
    }

    const data = await response.json();
    console.log(`✅ Found ${data.items?.length || 0} results`);

    // Extract and format search results
    const results = (data.items || []).map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
      // Extract metadata if available
      metadata: item.pagemap?.metatags?.[0] || {}
    }));

    return results;

  } catch (error) {
    console.error('❌ Google Search failed:', error);
    return [];
  }
};

/**
 * Build search query for movie/show
 * @param {string} movieName - Name of the movie/show
 * @param {string} platform - Streaming platform
 * @param {string} scriptType - 'review' or 'story'
 * @returns {string} - Optimized search query
 */
export const buildSearchQuery = (movieName, platform = 'auto-detect', scriptType = 'review') => {
  let query = movieName;

  // Add platform if specified
  const platformKeywords = {
    'netflix': 'Netflix',
    'amazon-prime': 'Prime Video Amazon',
    'disney-plus': 'Disney Plus',
    'hulu': 'Hulu',
    'apple-tv': 'Apple TV+',
    'hbo-max': 'Max HBO',
    'paramount-plus': 'Paramount+',
    'peacock': 'Peacock',
    'youtube-premium': 'YouTube Premium',
    'theatrical': 'theatrical release box office'
  };

  if (platform !== 'auto-detect' && platformKeywords[platform]) {
    query += ` ${platformKeywords[platform]}`;
  }

  // Add search intent keywords
  if (scriptType === 'review') {
    query += ' review release date rating';
  } else {
    query += ' story plot synopsis';
  }

  // Add current year for recent content
  const currentYear = new Date().getFullYear();
  query += ` ${currentYear}`;

  return query;
};

/**
 * Format search results into context for AI
 * @param {Array} searchResults - Raw search results from Google
 * @returns {string} - Formatted context string for AI prompt
 */
export const formatSearchResultsForAI = (searchResults) => {
  if (!searchResults || searchResults.length === 0) {
    return 'No search results available.';
  }

  let formattedContext = 'SEARCH RESULTS FROM WEB:\n\n';

  searchResults.forEach((result, index) => {
    formattedContext += `[${index + 1}] ${result.title}\n`;
    formattedContext += `Source: ${result.displayLink}\n`;
    formattedContext += `URL: ${result.link}\n`;
    formattedContext += `Summary: ${result.snippet}\n`;

    // Add metadata if available (release date, rating, etc.)
    if (result.metadata.description) {
      formattedContext += `Description: ${result.metadata.description}\n`;
    }

    formattedContext += '\n---\n\n';
  });

  formattedContext += 'Use the above search results to write an accurate, current article with specific details about release dates, platforms, and availability.\n';

  return formattedContext;
};

/**
 * Check if Google Search API is configured
 * @returns {boolean}
 */
export const isGoogleSearchConfigured = () => {
  return !!(
    GOOGLE_API_KEY &&
    GOOGLE_CSE_ID &&
    !GOOGLE_API_KEY.includes('your_') &&
    !GOOGLE_CSE_ID.includes('your_')
  );
};
