/**
 * Migration Service
 *
 * Utilities to migrate data from localStorage to Supabase
 * Can be triggered manually from admin panel or automatically on first production load
 */

import { localStorageBackend } from './storage/localStorageBackend';
import { supabaseBackend } from './storage/supabaseBackend';

/**
 * Check if migration is needed
 * Returns true if localStorage has data and Supabase is empty
 */
export const needsMigration = async () => {
  try {
    // Check if there's data in localStorage
    const localArticles = await localStorageBackend.getArticles();
    if (!localArticles || localArticles.length === 0) {
      return false;
    }

    // Check if Supabase is empty
    const supabaseArticles = await supabaseBackend.getArticles();
    if (supabaseArticles && supabaseArticles.length > 0) {
      return false; // Supabase already has data
    }

    return true; // localStorage has data, Supabase is empty
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};

/**
 * Migrate articles from localStorage to Supabase
 */
export const migrateArticles = async () => {
  try {
    console.log('🚀 Starting article migration from localStorage to Supabase...');

    // Get articles from localStorage
    const localArticles = await localStorageBackend.getArticles();
    if (!localArticles || localArticles.length === 0) {
      console.log('⚠️ No articles found in localStorage to migrate');
      return {
        success: true,
        articlesCount: 0,
        message: 'No articles to migrate'
      };
    }

    console.log(`📦 Found ${localArticles.length} articles in localStorage`);

    // Migrate to Supabase
    await supabaseBackend.saveArticles(localArticles);

    console.log(`✅ Successfully migrated ${localArticles.length} articles to Supabase`);

    return {
      success: true,
      articlesCount: localArticles.length,
      message: `Successfully migrated ${localArticles.length} articles`
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      articlesCount: 0,
      message: `Migration failed: ${error.message}`,
      error
    };
  }
};

/**
 * Migrate featured images from localStorage to Supabase
 */
export const migrateFeaturedImages = async () => {
  try {
    console.log('🚀 Starting featured images migration...');

    // Get featured images from localStorage
    const localImages = await localStorageBackend.getFeaturedImages();
    if (!localImages || localImages.length === 0) {
      console.log('⚠️ No featured images found in localStorage to migrate');
      return {
        success: true,
        imagesCount: 0,
        message: 'No featured images to migrate'
      };
    }

    console.log(`📦 Found ${localImages.length} featured images in localStorage`);

    // Migrate to Supabase
    await supabaseBackend.saveFeaturedImages(localImages);

    console.log(`✅ Successfully migrated ${localImages.length} featured images to Supabase`);

    return {
      success: true,
      imagesCount: localImages.length,
      message: `Successfully migrated ${localImages.length} featured images`
    };
  } catch (error) {
    console.error('❌ Featured images migration failed:', error);
    return {
      success: false,
      imagesCount: 0,
      message: `Migration failed: ${error.message}`,
      error
    };
  }
};

/**
 * Full migration - migrate both articles and featured images
 */
export const migrateAll = async () => {
  try {
    console.log('🚀 Starting full migration from localStorage to Supabase...');

    const articlesResult = await migrateArticles();
    const imagesResult = await migrateFeaturedImages();

    const success = articlesResult.success && imagesResult.success;
    const totalItems = articlesResult.articlesCount + imagesResult.imagesCount;

    if (success) {
      console.log(`✅ Full migration completed! Migrated ${totalItems} items total`);
    } else {
      console.log('⚠️ Migration completed with errors');
    }

    return {
      success,
      articles: articlesResult,
      featuredImages: imagesResult,
      totalItems,
      message: success
        ? `Successfully migrated ${totalItems} items (${articlesResult.articlesCount} articles, ${imagesResult.imagesCount} images)`
        : 'Migration completed with errors. Check console for details.'
    };
  } catch (error) {
    console.error('❌ Full migration failed:', error);
    return {
      success: false,
      totalItems: 0,
      message: `Migration failed: ${error.message}`,
      error
    };
  }
};

/**
 * Export localStorage data as JSON (for backup)
 */
export const exportLocalStorageData = async () => {
  try {
    const articles = await localStorageBackend.getArticles();
    const featuredImages = await localStorageBackend.getFeaturedImages();

    const exportData = {
      exportDate: new Date().toISOString(),
      articlesCount: articles.length,
      featuredImagesCount: featuredImages.length,
      articles,
      featuredImages
    };

    return exportData;
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
};

/**
 * Download localStorage data as JSON file
 */
export const downloadLocalStorageBackup = async () => {
  try {
    const data = await exportLocalStorageData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cinechatter-backup-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ Backup downloaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Backup download failed:', error);
    return false;
  }
};

export default {
  needsMigration,
  migrateArticles,
  migrateFeaturedImages,
  migrateAll,
  exportLocalStorageData,
  downloadLocalStorageBackup
};
