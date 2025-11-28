/**
 * Storage Service - Environment-Based Storage Adapter
 *
 * Routes storage operations to the appropriate backend:
 * - Development: localStorage (fast, simple, no setup)
 * - Production: Supabase (persistent, scalable, multi-user)
 */

import { localStorageBackend } from './storage/localStorageBackend';
import { supabaseBackend } from './storage/supabaseBackend';

/**
 * Detect if we're in production environment
 */
const isProduction = () => {
  // Check if we're in production mode
  return import.meta.env.PROD || import.meta.env.MODE === 'production';
};

/**
 * Get the appropriate storage backend based on environment
 */
const getBackend = () => {
  if (isProduction()) {
    console.log('🗄️ Using Supabase storage (Production)');
    return supabaseBackend;
  } else {
    console.log('💾 Using localStorage (Development)');
    return localStorageBackend;
  }
};

/**
 * Storage Service API
 * Provides a unified interface for both storage backends
 */
export const storageService = {
  /**
   * Get all articles
   * @returns {Promise<Array>} Array of articles
   */
  getArticles: async () => {
    const backend = getBackend();
    return await backend.getArticles();
  },

  /**
   * Save articles (replace all)
   * @param {Array} articles - Articles to save
   * @returns {Promise<void>}
   */
  saveArticles: async (articles) => {
    const backend = getBackend();
    return await backend.saveArticles(articles);
  },

  /**
   * Add a single article
   * @param {Object} article - Article to add
   * @returns {Promise<Object>} Created article with database ID
   */
  addArticle: async (article) => {
    const backend = getBackend();
    return await backend.addArticle(article);
  },

  /**
   * Update a single article
   * @param {Object} article - Article to update
   * @returns {Promise<Object>} Updated article
   */
  updateArticle: async (article) => {
    const backend = getBackend();
    return await backend.updateArticle(article);
  },

  /**
   * Delete an article
   * @param {string|number} id - Article ID
   * @returns {Promise<void>}
   */
  deleteArticle: async (id) => {
    const backend = getBackend();
    return await backend.deleteArticle(id);
  },

  /**
   * Get featured images
   * @returns {Promise<Array>} Array of featured images
   */
  getFeaturedImages: async () => {
    const backend = getBackend();
    return await backend.getFeaturedImages();
  },

  /**
   * Save featured images
   * @param {Array} images - Featured images to save
   * @returns {Promise<void>}
   */
  saveFeaturedImages: async (images) => {
    const backend = getBackend();
    return await backend.saveFeaturedImages(images);
  },

  /**
   * Check which storage backend is being used
   * @returns {string} 'localStorage' or 'supabase'
   */
  getBackendType: () => {
    return isProduction() ? 'supabase' : 'localStorage';
  }
};

export default storageService;
