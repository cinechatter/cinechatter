/**
 * Supabase Backend
 *
 * Production-grade database storage with Supabase
 * - Persistent across devices and deployments
 * - Scalable and supports multiple users
 * - Maps App.jsx structure to Supabase schema
 */

import { supabase } from '../../lib/supabase';

/**
 * Generate URL-friendly slug from title
 */
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 255);
};

/**
 * Map category string to category_id
 * This creates/gets categories as needed
 */
const getCategoryId = async (categorySlug) => {
  if (!categorySlug) return null;

  try {
    // Check if category exists
    const { data: existing, error: selectError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (existing) {
      return existing.id;
    }

    // Category doesn't exist, create it
    const categoryNames = {
      'hollywood-movies': 'Hollywood Movies',
      'hollywood-news': 'Hollywood News',
      'bollywood-movies': 'Bollywood Movies',
      'bollywood-news': 'Bollywood News',
      'ott': 'OTT',
      'music': 'Music',
      'celebrity-style': 'Celebrity Style',
      'international': 'International Cinema',
      'youtube-scripts': 'YouTube Scripts'
    };

    const categoryName = categoryNames[categorySlug] || categorySlug;

    const { data: newCategory, error: insertError } = await supabase
      .from('categories')
      .insert({
        name: categoryName,
        slug: categorySlug,
        is_active: true
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating category:', insertError);
      return null;
    }

    return newCategory?.id;
  } catch (error) {
    console.error('Error getting category ID:', error);
    return null;
  }
};

/**
 * Map App.jsx article format to Supabase schema
 */
const mapToSupabaseFormat = async (article, userId = null) => {
  // Get category ID from category slug
  const categoryId = await getCategoryId(article.category);

  // Generate slug from title (or use existing if editing)
  const slug = article.slug || `${generateSlug(article.title)}-${Date.now()}`;

  return {
    // Use existing Supabase ID if present, otherwise let DB generate
    ...(article.supabaseId && { id: article.supabaseId }),
    title: article.title,
    slug: slug,
    content: article.content,
    excerpt: article.excerpt || article.content?.substring(0, 200) || '',
    featured_image: article.image || article.featured_image || null,
    category_id: categoryId,
    author_id: userId,
    status: article.status || 'published',
    source: article.source || 'manual',
    published_at: article.status === 'published' ? (article.publishedAt || article.createdAt || new Date().toISOString()) : null,
    view_count: article.view_count || 0,
    is_featured: article.is_featured || false,
    meta_title: article.meta_title || article.title,
    meta_description: article.meta_description || article.excerpt || article.content?.substring(0, 160),
    meta_keywords: article.meta_keywords || null
  };
};

/**
 * Map Supabase format back to App.jsx format
 */
const mapFromSupabaseFormat = (dbArticle, category = null) => {
  return {
    // Keep both IDs for compatibility
    id: dbArticle.id, // Use Supabase ID as primary
    supabaseId: dbArticle.id, // Store Supabase ID
    localId: dbArticle.id, // Fallback for legacy code
    title: dbArticle.title,
    slug: dbArticle.slug,
    content: dbArticle.content,
    excerpt: dbArticle.excerpt,
    image: dbArticle.featured_image,
    featured_image: dbArticle.featured_image,
    category: category?.slug || 'hollywood-movies', // Use slug for App.jsx
    category_id: dbArticle.category_id,
    status: dbArticle.status,
    source: 'Database',
    createdAt: dbArticle.created_at,
    updatedAt: dbArticle.updated_at,
    publishedAt: dbArticle.published_at,
    view_count: dbArticle.view_count,
    is_featured: dbArticle.is_featured,
    meta_title: dbArticle.meta_title,
    meta_description: dbArticle.meta_description,
    meta_keywords: dbArticle.meta_keywords,
    author_id: dbArticle.author_id
  };
};

export const supabaseBackend = {
  /**
   * Get all articles from Supabase
   */
  getArticles: async () => {
    try {
      const { data: articles, error } = await supabase
        .from('articles')
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase getArticles error:', error);
        return [];
      }

      // Map to App.jsx format
      return articles.map(article =>
        mapFromSupabaseFormat(article, article.categories)
      );
    } catch (error) {
      console.error('❌ Supabase getArticles exception:', error);
      return [];
    }
  },

  /**
   * Save all articles (bulk upsert)
   * Used for initial migration or bulk operations
   */
  saveArticles: async (articles) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Map all articles to Supabase format
      const supabaseArticles = await Promise.all(
        articles.map(article => mapToSupabaseFormat(article, user?.id))
      );

      // Bulk upsert
      const { data, error } = await supabase
        .from('articles')
        .upsert(supabaseArticles, {
          onConflict: 'id'
        })
        .select();

      if (error) {
        console.error('❌ Supabase saveArticles error:', error);
        throw error;
      }

      console.log(`✅ Saved ${data?.length || 0} articles to Supabase`);
    } catch (error) {
      console.error('❌ Supabase saveArticles exception:', error);
      throw error;
    }
  },

  /**
   * Add a single article
   */
  addArticle: async (article) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Map to Supabase format
      const supabaseArticle = await mapToSupabaseFormat(article, user?.id);

      // Remove id field for insert (let DB generate)
      const { id, ...insertData } = supabaseArticle;

      const { data, error } = await supabase
        .from('articles')
        .insert(insertData)
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .single();

      if (error) {
        console.error('❌ Supabase addArticle error:', error);
        throw error;
      }

      console.log('✅ Added article to Supabase:', data.id);

      // Return in App.jsx format
      return mapFromSupabaseFormat(data, data.categories);
    } catch (error) {
      console.error('❌ Supabase addArticle exception:', error);
      throw error;
    }
  },

  /**
   * Update a single article
   */
  updateArticle: async (article) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Map to Supabase format
      const supabaseArticle = await mapToSupabaseFormat(article, user?.id);

      // Use Supabase ID if available, otherwise use the ID field
      const articleId = article.supabaseId || article.id;

      const { data, error } = await supabase
        .from('articles')
        .update(supabaseArticle)
        .eq('id', articleId)
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .single();

      if (error) {
        console.error('❌ Supabase updateArticle error:', error);
        throw error;
      }

      console.log('✅ Updated article in Supabase:', data.id);

      // Return in App.jsx format
      return mapFromSupabaseFormat(data, data.categories);
    } catch (error) {
      console.error('❌ Supabase updateArticle exception:', error);
      throw error;
    }
  },

  /**
   * Delete an article
   */
  deleteArticle: async (id) => {
    try {
      // Skip if ID is a temporary string ID (not from database)
      if (typeof id === 'string' && (id.startsWith('sheet-') || id.startsWith('demo-'))) {
        console.log('⚠️ Skipping delete for temporary ID:', id);
        return; // Don't try to delete temporary IDs from database
      }

      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Supabase deleteArticle error:', error);
        throw error;
      }

      console.log('✅ Deleted article from Supabase:', id);
    } catch (error) {
      console.error('❌ Supabase deleteArticle exception:', error);
      throw error;
    }
  },

  /**
   * Get featured images
   * For now, store in a simple table or admin_settings
   */
  getFeaturedImages: async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'featured_images')
        .single();

      if (error || !data) {
        return [];
      }

      return JSON.parse(data.setting_value || '[]');
    } catch (error) {
      console.error('❌ Supabase getFeaturedImages error:', error);
      return [];
    }
  },

  /**
   * Save featured images
   */
  saveFeaturedImages: async (images) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'featured_images',
          setting_value: JSON.stringify(images),
          setting_type: 'json',
          description: 'Featured images for homepage carousel'
        }, {
          onConflict: 'setting_key'
        });

      if (error) {
        console.error('❌ Supabase saveFeaturedImages error:', error);
        throw error;
      }

      console.log(`✅ Saved ${images.length} featured images to Supabase`);
    } catch (error) {
      console.error('❌ Supabase saveFeaturedImages exception:', error);
      throw error;
    }
  }
};
