import { useState } from 'react';
import { generateArticle, validateGenerationInput } from '../services/aiGeneratorService';

/**
 * Custom hook for AI Article Generator
 * Manages all state and logic for AI article generation
 *
 * @param {Function} onPublish - Callback when article is published
 * @returns {Object} Hook state and methods
 */
export const useAIArticleGenerator = (onPublish) => {
  // Form state
  const [agentForm, setAgentForm] = useState({
    movieName: '',
    scriptType: 'review',
    imageUrl: '',
    category: 'hollywood-movies',
    platform: 'auto-detect', // Streaming platform
    model: 'gpt-4o', // Default to ChatGPT 4o with search
    customInstructions: '', // Optional custom instructions
    articleLength: 500, // Default word count (max 1000)
    language: 'english' // Language selection: english, hindi, hinglish
  });

  // UI state
  const [agentGenerating, setAgentGenerating] = useState(false);
  const [agentPreview, setAgentPreview] = useState(null);
  const [agentError, setAgentError] = useState(null);

  /**
   * Update form field
   */
  const updateFormField = (field, value) => {
    setAgentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Update preview content (when user edits)
   */
  const updatePreviewContent = (field, value) => {
    setAgentPreview(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Generate AI article
   */
  const handleGenerate = async () => {
    const { movieName, scriptType, imageUrl, category, platform, model, customInstructions, articleLength, language } = agentForm;

    // Validate input
    const validation = validateGenerationInput(movieName);
    if (!validation.isValid) {
      setAgentError(validation.error);
      return;
    }

    // Start generation
    setAgentGenerating(true);
    setAgentError(null);
    setAgentPreview(null);

    try {
      // Call service to generate article
      const preview = await generateArticle({
        movieName,
        scriptType,
        imageUrl,
        category,
        platform,  // Pass selected platform
        model,  // Pass selected model
        customInstructions,  // Pass custom instructions
        articleLength,  // Pass article length
        language  // Pass selected language
      });

      setAgentPreview(preview);
    } catch (error) {
      console.error('❌ AI generation failed:', error);

      // Show detailed error message
      let errorMessage = 'Failed to generate article. ';

      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again or contact support.';
      }

      // Add troubleshooting hints
      if (error.message?.includes('API key') || error.message?.includes('401')) {
        errorMessage += '\n\n💡 Tip: Check that API keys are configured in your hosting platform environment variables.';
      } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        errorMessage += '\n\n💡 Tip: API rate limit exceeded. Please wait a few minutes and try again.';
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        errorMessage += '\n\n💡 Tip: Check your internet connection and try again.';
      }

      setAgentError(errorMessage);
    } finally {
      setAgentGenerating(false);
    }
  };

  /**
   * Publish the AI-generated article
   */
  const handlePublish = () => {
    if (!agentPreview) return;

    const articleData = {
      // Don't set id - let database generate it
      title: agentPreview.title,
      content: agentPreview.content,
      // Route YouTube scripts to 'youtube-scripts' category, otherwise use selected category
      category: agentPreview.scriptType === 'youtube' ? 'youtube-scripts' : agentPreview.category,
      image: agentPreview.image,
      status: 'published',
      source: 'AI Agent',
      language: agentPreview.language || 'english', // Store language
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        scriptType: agentPreview.scriptType,
        movieName: agentPreview.movieName,
        generatedBy: 'AI',
        language: agentPreview.language || 'english' // Store in metadata too
      }
    };

    console.log('📝 Publishing AI Article:');
    console.log('  - Title:', articleData.title);
    console.log('  - Category:', articleData.category);
    console.log('  - Status:', articleData.status);
    console.log('  - ID:', articleData.id);

    // Check current dataSource setting
    const currentDataSource = localStorage.getItem('cine-chatter-data-source');
    console.log('  - Current dataSource setting:', currentDataSource);

    if (currentDataSource === 'sheets-only') {
      console.warn('⚠️ WARNING: dataSource is set to "sheets-only"!');
      console.warn('   This article will be saved but NOT displayed.');
      console.warn('   To see AI articles, change to "admin-only" or "both" in Dashboard > Integration Settings');
    } else {
      console.log('✅ dataSource is set correctly:', currentDataSource);
    }

    // Call parent's publish handler
    onPublish(articleData);

    // Reset form
    resetForm();

    // Show contextual message based on dataSource
    if (currentDataSource === 'sheets-only') {
      alert(`✅ ${agentPreview.scriptType === 'youtube' ? 'YouTube script' : 'Article'} published!\n\n⚠️ Note: Your Data Source is set to "Sheets Only".\nTo see this article, go to Dashboard > Integration Settings and select "Admin Only" or "Both Sources".`);
    } else {
      alert(`✅ ${agentPreview.scriptType === 'youtube' ? 'YouTube script' : 'Article'} published successfully!\n\nNavigate to ${articleData.category} to view it.`);
    }
  };

  /**
   * Reset form and preview
   */
  const resetForm = () => {
    setAgentForm({
      movieName: '',
      scriptType: 'review',
      imageUrl: '',
      category: 'hollywood-movies',
      platform: 'auto-detect',
      model: 'gpt-4o',
      customInstructions: '',
      articleLength: 500,
      language: 'english'
    });
    setAgentPreview(null);
    setAgentError(null);
  };

  // Return hook interface
  return {
    // State
    agentForm,
    agentGenerating,
    agentPreview,
    agentError,

    // Methods
    updateFormField,
    updatePreviewContent,
    handleGenerate,
    handlePublish,
    resetForm
  };
};
