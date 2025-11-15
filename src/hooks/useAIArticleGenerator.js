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
    model: 'haiku', // Default to fast/economical
    customInstructions: '', // Optional custom instructions
    articleLength: 500 // Default word count (max 1000)
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
    const { movieName, scriptType, imageUrl, category, model, customInstructions, articleLength } = agentForm;

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
        model,  // Pass selected model
        customInstructions,  // Pass custom instructions
        articleLength  // Pass article length
      });

      setAgentPreview(preview);
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      setAgentError('Failed to generate article. Please try again.');
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
      id: Date.now(),
      title: agentPreview.title,
      content: agentPreview.content,
      category: agentPreview.category,
      image: agentPreview.image,
      status: 'published',
      source: 'AI Agent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        scriptType: agentPreview.scriptType,
        movieName: agentPreview.movieName,
        generatedBy: 'AI'
      }
    };

    // Call parent's publish handler
    onPublish(articleData);

    // Reset form
    resetForm();

    alert('✅ AI-generated article published successfully!');
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
      model: 'haiku',
      customInstructions: '',
      articleLength: 500
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
