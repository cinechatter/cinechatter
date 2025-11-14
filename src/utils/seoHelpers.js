// ============================================================================
// SEO Helper Functions - Phase 1 (Auto-generation)
// ============================================================================
// These functions automatically generate SEO-friendly fields from article data
// No UI changes needed - works with existing article creation flow
// ============================================================================

/**
 * Generates a URL-friendly slug from a title
 * Example: "Avatar 2 Breaks Records!" -> "avatar-2-breaks-records"
 *
 * @param {string} title - Article title
 * @returns {string} URL-friendly slug
 */
export const generateSlug = (title) => {
  if (!title) return '';

  return title
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Generates SEO-friendly meta title (max 60 characters for Google)
 * Adds site name if title is short enough
 *
 * @param {string} title - Article title
 * @param {string} siteName - Site name (default: 'CineChatter')
 * @returns {string} Optimized meta title
 */
export const generateMetaTitle = (title, siteName = 'CineChatter') => {
  if (!title) return siteName;

  const maxLength = 60;
  const suffix = ` | ${siteName}`;

  // If title + suffix fits within limit, use both
  if ((title.length + suffix.length) <= maxLength) {
    return title + suffix;
  }

  // Otherwise, truncate title and add suffix
  const truncatedTitle = title.substring(0, maxLength - suffix.length - 3).trim();
  return truncatedTitle + '...' + suffix;
};

/**
 * Generates meta description from article content (max 160 characters)
 * Strips HTML tags and truncates intelligently at sentence boundaries
 *
 * @param {string} content - Article content
 * @returns {string} Optimized meta description
 */
export const generateMetaDescription = (content) => {
  if (!content) return '';

  const maxLength = 160;

  // Strip HTML tags if present
  const strippedContent = content.replace(/<[^>]*>/g, '');

  // Remove extra whitespace
  const cleanedContent = strippedContent.replace(/\s+/g, ' ').trim();

  // If content is short enough, return as-is
  if (cleanedContent.length <= maxLength) {
    return cleanedContent;
  }

  // Try to truncate at sentence boundary (period, question mark, exclamation)
  const truncated = cleanedContent.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('?'),
    truncated.lastIndexOf('!')
  );

  if (lastSentenceEnd > maxLength * 0.7) {
    // Found a sentence boundary in the last 30% - use it
    return cleanedContent.substring(0, lastSentenceEnd + 1).trim();
  }

  // Otherwise, truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  const finalText = cleanedContent.substring(0, lastSpace).trim();
  return finalText + '...';
};

/**
 * Extracts keywords from title and content
 * Uses simple word frequency analysis
 *
 * @param {string} title - Article title
 * @param {string} content - Article content
 * @param {number} maxKeywords - Maximum number of keywords to extract (default: 5)
 * @returns {string[]} Array of keywords
 */
export const extractKeywords = (title, content, maxKeywords = 5) => {
  if (!title && !content) return [];

  // Combine title and content
  const text = `${title || ''} ${content || ''}`.toLowerCase();

  // Strip HTML tags and special characters
  const cleanText = text
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Common stop words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very'
  ]);

  // Split into words and count frequency
  const words = cleanText.split(/\s+/);
  const wordFreq = {};

  words.forEach(word => {
    if (word.length > 3 && !stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // Sort by frequency and get top keywords
  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);

  return keywords;
};

/**
 * Calculates estimated reading time based on word count
 * Average reading speed: 200-250 words per minute
 *
 * @param {string} content - Article content
 * @param {number} wordsPerMinute - Reading speed (default: 225)
 * @returns {number} Reading time in minutes
 */
export const calculateReadingTime = (content, wordsPerMinute = 225) => {
  if (!content) return 1;

  // Strip HTML tags
  const strippedContent = content.replace(/<[^>]*>/g, '');

  // Count words
  const wordCount = strippedContent.trim().split(/\s+/).length;

  // Calculate reading time (minimum 1 minute)
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readingTime);
};

/**
 * Generates canonical URL for the article
 *
 * @param {string} slug - Article slug
 * @param {string} baseUrl - Site base URL (default: auto-detect)
 * @returns {string} Canonical URL
 */
export const generateCanonicalUrl = (slug, baseUrl = null) => {
  if (!slug) return '';

  // Auto-detect base URL if not provided
  const siteUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://cinechatter.com');

  return `${siteUrl}/article/${slug}`;
};

/**
 * Generates unique slug by appending timestamp if slug already exists
 *
 * @param {string} baseSlug - Base slug generated from title
 * @param {Function} checkExists - Async function to check if slug exists
 * @returns {Promise<string>} Unique slug
 */
export const generateUniqueSlug = async (baseSlug, checkExists) => {
  let slug = baseSlug;
  let counter = 1;

  // Check if slug exists
  while (await checkExists(slug)) {
    // Append counter or timestamp
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Main function: Auto-generates all SEO fields for an article
 * This is what you'll call when creating/editing articles
 *
 * @param {Object} article - Article object with title and content
 * @param {string} article.title - Article title
 * @param {string} article.content - Article content
 * @param {string} [article.slug] - Existing slug (optional, will auto-generate if missing)
 * @param {string} [article.meta_title] - Existing meta title (optional)
 * @param {string} [article.meta_description] - Existing meta description (optional)
 * @param {string[]} [article.keywords] - Existing keywords (optional)
 * @returns {Object} Article with auto-generated SEO fields
 */
export const autoGenerateSEOFields = (article) => {
  const {
    title,
    content,
    slug = null,
    meta_title = null,
    meta_description = null,
    keywords = null
  } = article;

  return {
    ...article,
    // Auto-generate slug if not provided
    slug: slug || generateSlug(title),

    // Auto-generate meta_title if not provided
    meta_title: meta_title || generateMetaTitle(title),

    // Auto-generate meta_description if not provided
    meta_description: meta_description || generateMetaDescription(content),

    // Auto-generate keywords if not provided
    keywords: keywords || extractKeywords(title, content),

    // Auto-generate reading_time
    reading_time: calculateReadingTime(content),

    // Auto-generate canonical_url
    canonical_url: generateCanonicalUrl(slug || generateSlug(title))
  };
};

/**
 * Validates SEO fields and returns warnings/suggestions
 *
 * @param {Object} seoFields - SEO fields to validate
 * @returns {Object} Validation result with warnings array
 */
export const validateSEOFields = (seoFields) => {
  const warnings = [];

  // Check slug
  if (!seoFields.slug) {
    warnings.push('Missing slug - required for SEO-friendly URLs');
  } else if (seoFields.slug.length > 100) {
    warnings.push('Slug is too long - keep under 100 characters');
  }

  // Check meta_title
  if (!seoFields.meta_title) {
    warnings.push('Missing meta title - important for search rankings');
  } else if (seoFields.meta_title.length > 60) {
    warnings.push(`Meta title is ${seoFields.meta_title.length} chars - Google truncates at 60`);
  } else if (seoFields.meta_title.length < 30) {
    warnings.push('Meta title is too short - aim for 50-60 characters');
  }

  // Check meta_description
  if (!seoFields.meta_description) {
    warnings.push('Missing meta description - important for click-through rate');
  } else if (seoFields.meta_description.length > 160) {
    warnings.push(`Meta description is ${seoFields.meta_description.length} chars - Google truncates at 160`);
  } else if (seoFields.meta_description.length < 120) {
    warnings.push('Meta description is too short - aim for 150-160 characters');
  }

  // Check keywords
  if (!seoFields.keywords || seoFields.keywords.length === 0) {
    warnings.push('No keywords - add 3-5 relevant keywords');
  } else if (seoFields.keywords.length > 10) {
    warnings.push('Too many keywords - focus on 3-5 most relevant');
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
};

// ============================================================================
// Export all functions
// ============================================================================
export default {
  generateSlug,
  generateMetaTitle,
  generateMetaDescription,
  extractKeywords,
  calculateReadingTime,
  generateCanonicalUrl,
  generateUniqueSlug,
  autoGenerateSEOFields,
  validateSEOFields
};
