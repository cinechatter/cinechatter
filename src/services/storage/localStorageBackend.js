/**
 * localStorage Backend
 *
 * Simple browser localStorage implementation for development
 * - Fast and requires no setup
 * - Data persists in browser only
 * - Cleared when browser cache is cleared
 */

const ARTICLES_KEY = 'cine-chatter-articles';
const FEATURED_IMAGES_KEY = 'cine-chatter-featured-images';

export const localStorageBackend = {
  /**
   * Get all articles from localStorage
   */
  getArticles: async () => {
    try {
      const data = localStorage.getItem(ARTICLES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ localStorage getArticles error:', error);
      return [];
    }
  },

  /**
   * Save all articles to localStorage (replaces existing)
   */
  saveArticles: async (articles) => {
    try {
      localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
      console.log(`✅ Saved ${articles.length} articles to localStorage`);
    } catch (error) {
      console.error('❌ localStorage saveArticles error:', error);
      throw error;
    }
  },

  /**
   * Add a single article
   */
  addArticle: async (article) => {
    try {
      const articles = await localStorageBackend.getArticles();
      const newArticles = [article, ...articles];
      await localStorageBackend.saveArticles(newArticles);
      return article;
    } catch (error) {
      console.error('❌ localStorage addArticle error:', error);
      throw error;
    }
  },

  /**
   * Update a single article
   */
  updateArticle: async (article) => {
    try {
      const articles = await localStorageBackend.getArticles();
      const updatedArticles = articles.map(a =>
        a.id === article.id ? article : a
      );
      await localStorageBackend.saveArticles(updatedArticles);
      return article;
    } catch (error) {
      console.error('❌ localStorage updateArticle error:', error);
      throw error;
    }
  },

  /**
   * Delete an article
   */
  deleteArticle: async (id) => {
    try {
      const articles = await localStorageBackend.getArticles();
      const filteredArticles = articles.filter(a => a.id !== id);
      await localStorageBackend.saveArticles(filteredArticles);
    } catch (error) {
      console.error('❌ localStorage deleteArticle error:', error);
      throw error;
    }
  },

  /**
   * Get featured images
   */
  getFeaturedImages: async () => {
    try {
      const data = localStorage.getItem(FEATURED_IMAGES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ localStorage getFeaturedImages error:', error);
      return [];
    }
  },

  /**
   * Save featured images
   */
  saveFeaturedImages: async (images) => {
    try {
      localStorage.setItem(FEATURED_IMAGES_KEY, JSON.stringify(images));
      console.log(`✅ Saved ${images.length} featured images to localStorage`);
    } catch (error) {
      console.error('❌ localStorage saveFeaturedImages error:', error);
      throw error;
    }
  }
};
