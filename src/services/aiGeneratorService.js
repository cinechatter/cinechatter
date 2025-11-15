/**
 * AI Generator Service
 * Handles API calls and prompt building for AI article generation
 */

/**
 * Build AI prompt based on movie details
 * @param {string} movieName - Name of the movie
 * @param {string} scriptType - Type of content ('review' or 'story')
 * @param {string} category - Category/industry of the movie
 * @param {string} customInstructions - Optional custom instructions from user
 * @param {number} articleLength - Target word count (default 800)
 * @returns {string} - Formatted prompt for AI
 */
export const buildAgentPrompt = (movieName, scriptType, category, customInstructions = '', articleLength = 800) => {
  const categoryMap = {
    'hollywood-movies': 'Hollywood',
    'hollywood-news': 'Hollywood',
    'bollywood-movies': 'Bollywood',
    'bollywood-news': 'Bollywood',
    'ott': 'OTT Platform',
    'music': 'Music Industry',
    'celebrity-style': 'Celebrity Fashion',
    'international': 'International Cinema'
  };

  const industryName = categoryMap[category] || 'Entertainment';
  const contentType = scriptType === 'review' ? 'Movie Review' : 'Movie Story Synopsis';

  let prompt = `You are an expert entertainment journalist writing for CineChatter, a premier entertainment news website.

TASK: Write a compelling ${contentType.toLowerCase()} for "${movieName}" from the ${industryName} industry.

WORD COUNT REQUIREMENT: Write approximately ${articleLength} words (target: ${articleLength} ± 50 words).

INSTRUCTIONS:
1. First, search the web for accurate, up-to-date information about "${movieName}"
2. Gather details about:
   - Release date and box office performance
   - Director, cast, and crew
   - Plot synopsis (avoid major spoilers for reviews)
   - Critical reception and audience ratings
   - Awards and nominations (if any)
   - Interesting behind-the-scenes facts

3. ${scriptType === 'review' ? `Write a professional movie REVIEW (${articleLength} words) that includes:
   - Engaging opening hook
   - Brief plot overview (spoiler-free)
   - Analysis of performances, direction, cinematography
   - Discussion of themes and storytelling
   - Technical aspects (music, editing, VFX if relevant)
   - Comparison to similar films or director's previous work
   - Final verdict and rating suggestion
   - Who would enjoy this film` : `Write a captivating STORY SYNOPSIS (${articleLength} words) that includes:
   - Intriguing introduction to the story world
   - Main characters and their motivations
   - Key plot points and story arc
   - Central conflicts and themes
   - Emotional journey of the characters
   - Climactic moments (without spoiling the ending)
   - Why this story resonates with audiences`}

4. Writing Style:
   - Professional yet conversational tone
   - Engaging and easy to read
   - Use vivid descriptions and specific examples
   - Include quotes from reviews or interviews if available
   - Maintain objectivity in reviews while being entertaining
   - Structure with clear paragraphs and logical flow

5. SEO Optimization:
   - Naturally incorporate the movie name multiple times
   - Use relevant keywords (${industryName}, ${scriptType}, film, cinema, etc.)
   - Include searchable phrases fans might use

6. Format the article in clean paragraphs suitable for web reading

IMPORTANT: Base your content on real, factual information found through web search. Do not fabricate details about the movie.`;

  // Append custom instructions if provided
  if (customInstructions && customInstructions.trim()) {
    prompt += `\n\nADDITIONAL REQUIREMENTS FROM USER:\n${customInstructions.trim()}`;
  }

  return prompt;
};

/**
 * Map model shorthand to actual Claude model ID
 */
const MODEL_MAP = {
  'sonnet': 'claude-sonnet-4-5-20250929',
  'haiku': 'claude-3-5-haiku-20241022'
};

/**
 * Generate AI article using Claude API
 * @param {Object} params - Generation parameters
 * @param {string} params.movieName - Name of the movie
 * @param {string} params.scriptType - Type of content ('review' or 'story')
 * @param {string} params.category - Category/industry
 * @param {string} params.imageUrl - Optional image URL
 * @param {string} params.model - Model selection ('sonnet' or 'haiku')
 * @param {string} params.customInstructions - Optional custom instructions
 * @param {number} params.articleLength - Target word count
 * @returns {Promise<Object>} - Generated article preview
 */
export const generateArticle = async ({ movieName, scriptType, category, imageUrl, model = 'sonnet', customInstructions = '', articleLength = 800 }) => {
  // Build the prompt
  const prompt = buildAgentPrompt(movieName, scriptType, category, customInstructions, articleLength);

  // Map model shorthand to actual model ID
  const modelId = MODEL_MAP[model] || MODEL_MAP.sonnet;

  console.log('🤖 Generating AI article...');
  console.log('Movie:', movieName);
  console.log('Type:', scriptType);
  console.log('Category:', category);
  console.log('Model:', modelId);
  console.log('Target Length:', articleLength, 'words');

  try {
    // Import Anthropic SDK dynamically (for development)
    const Anthropic = (await import('@anthropic-ai/sdk')).default;

    // Initialize client with API key from environment
    const anthropic = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true // Enable for development
    });

    console.log('📡 Calling Claude API directly...');

    // Call Claude API directly
    const message = await anthropic.messages.create({
      model: modelId,
      max_tokens: scriptType === 'review' ? 2000 : 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    console.log('✅ Article generated successfully');
    console.log(`Tokens used: ${message.usage.input_tokens} input + ${message.usage.output_tokens} output`);

    // Extract text content
    const data = {
      content: message.content[0].text,
      usage: message.usage
    };

    // Extract title from content (first line or heading)
    const extractedTitle = extractTitleFromContent(data.content) ||
                          `${scriptType === 'review' ? 'Review' : 'Story'}: ${movieName}`;

    return {
      title: extractedTitle,
      content: data.content,
      category: category,
      image: imageUrl || '',  // Don't use placeholder, let user add image if needed
      source: 'AI Agent',
      scriptType: scriptType,
      movieName: movieName
    };

  } catch (error) {
    console.error('❌ API call failed:', error);

    // Fallback: Return simulation for development/testing
    console.log('⚠️ Falling back to simulation mode');

    await new Promise(resolve => setTimeout(resolve, 1500));

    const articleTitle = `${scriptType === 'review' ? 'Review' : 'Story'}: ${movieName}`;
    const articleContent = `[Simulated AI Content - API Not Connected]\n\nModel: ${modelId}\n\nThis article would be generated using Claude AI.\n\nPrompt:\n${prompt}\n\nTo enable real generation:\n1. Set up backend API at /api/claude/generate\n2. Add ANTHROPIC_API_KEY to environment\n3. Deploy backend server`;

    return {
      title: articleTitle,
      content: articleContent,
      category: category,
      image: imageUrl || '',  // Don't use placeholder
      source: 'AI Agent (Simulation)',
      scriptType: scriptType,
      movieName: movieName
    };
  }
};

/**
 * Extract title from generated content
 * @param {string} content - Generated content
 * @returns {string|null} - Extracted title or null
 */
function extractTitleFromContent(content) {
  // Try to extract title from markdown heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Try to extract from first line if it looks like a title
  const lines = content.split('\n');
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.length < 100 && !firstLine.endsWith('.')) {
    return firstLine;
  }

  return null;
}

/**
 * Validate form inputs before generation
 * @param {string} movieName - Name of the movie
 * @returns {Object} - Validation result { isValid, error }
 */
export const validateGenerationInput = (movieName) => {
  if (!movieName || !movieName.trim()) {
    return {
      isValid: false,
      error: 'Please enter a movie name'
    };
  }

  if (movieName.trim().length < 2) {
    return {
      isValid: false,
      error: 'Movie name must be at least 2 characters'
    };
  }

  return {
    isValid: true,
    error: null
  };
};
