/**
 * AI Generator Service
 * Handles API calls and prompt building for AI article generation
 */

/**
 * Build AI prompt based on movie details
 * @param {string} movieName - Name of the movie
 * @param {string} scriptType - Type of content ('review' or 'story')
 * @param {string} category - Category/industry of the movie
 * @param {string} platform - Streaming platform (auto-detect, netflix, etc.)
 * @param {string} customInstructions - Optional custom instructions from user
 * @param {number} articleLength - Target word count (default 800)
 * @returns {string} - Formatted prompt for AI
 */
export const buildAgentPrompt = (movieName, scriptType, category, platform = 'auto-detect', customInstructions = '', articleLength = 800, language = 'english') => {
  const categoryMap = {
    'hollywood-movies': 'Hollywood',
    'hollywood-news': 'Hollywood',
    'bollywood-movies': 'Bollywood',
    'bollywood-news': 'Bollywood',
    'ott': 'OTT Platform / Streaming',
    'music': 'Music Industry',
    'celebrity-style': 'Celebrity Fashion',
    'international': 'International Cinema'
  };

  const industryName = categoryMap[category] || 'Entertainment';
  const contentType = scriptType === 'review' ? 'Movie Review' :
                      scriptType === 'story' ? 'Movie Story Synopsis' :
                      'YouTube Video Script';

  // Get current date for context
  const currentDate = new Date().toISOString().split('T')[0];

  // Platform-specific search hints
  const platformMap = {
    'auto-detect': 'Search across all platforms (Netflix, Prime Video, Disney+, Hulu, etc.) and theatrical releases',
    'netflix': 'This is specifically a NETFLIX title. Search "Netflix ${movieName}" to verify',
    'amazon-prime': 'This is specifically an AMAZON PRIME VIDEO title. Search "Prime Video ${movieName}" or "Amazon Prime ${movieName}"',
    'disney-plus': 'This is specifically a DISNEY+ title. Search "Disney Plus ${movieName}" or "Disney+ ${movieName}"',
    'hulu': 'This is specifically a HULU title. Search "Hulu ${movieName}"',
    'apple-tv': 'This is specifically an APPLE TV+ title. Search "Apple TV+ ${movieName}"',
    'hbo-max': 'This is specifically a MAX (HBO MAX) title. Search "Max ${movieName}" or "HBO Max ${movieName}"',
    'paramount-plus': 'This is specifically a PARAMOUNT+ title. Search "Paramount+ ${movieName}"',
    'peacock': 'This is specifically a PEACOCK title. Search "Peacock ${movieName}"',
    'youtube-premium': 'This is specifically a YOUTUBE PREMIUM title. Search "YouTube Premium ${movieName}"',
    'theatrical': 'This is a THEATRICAL RELEASE (cinema/movie theater). Focus on box office and theater availability',
    'other': 'Search for this title across various streaming platforms and sources'
  };

  const platformHint = platformMap[platform] || platformMap['auto-detect'];

  // Language-specific instructions
  const languageInstructions = {
    english: '',
    hindi: `
🌐 LANGUAGE REQUIREMENT: Write the ENTIRE article in PURE HINDI (हिंदी).
- Use Devanagari script ONLY for all content
- Write naturally in Hindi - no transliteration
- English words allowed ONLY for: Movie names, Actor names, Director names, Platform names (Netflix, Amazon Prime, etc.)
- Use proper Hindi grammar, expressions, and idioms
- Example: "यह फिल्म Netflix पर उपलब्ध है और इसे Atlee ने निर्देशित किया है..."
- NOT: "This movie is available on Netflix..."

`,
    hinglish: `
🌐 LANGUAGE REQUIREMENT: Write the ENTIRE article in HINGLISH (Hindi words in Roman/English script).
- Mix Hindi and English naturally like everyday conversation
- Write Hindi words phonetically in English/Roman script
- Natural flow combining both languages
- Example: "Ye film Netflix par available hai aur bahut zabardast hai. Atlee ne direction ki hai aur SRK ki acting kaafi impressive hai..."
- NOT: "This movie is available on Netflix and is very good..."
- Common Hinglish patterns:
  * "Film ka plot ekdum solid hai"
  * "Acting kaafi impressive thi"
  * "Direction bahut achha tha"
  * "Ye movie definitely dekhne layak hai"

`
  };

  let prompt = `You are an expert entertainment journalist writing for CineChatter, a premier entertainment news website. Today's date is ${currentDate}.

IMPORTANT INSTRUCTIONS:
1. DO NOT include any search status messages like "Let me search for..." or "I'll search for..."
2. Write ONLY the article content - no explanations about searching
3. Use your knowledge up to January 2025 to write about this title
4. If you know the title was released, write the article confidently
5. If you're not certain about the title, check these naming variations first:
   - "${movieName}"
   - "${movieName.replace(/(\d+)$/, 'Season $1')}" (add "Season" before numbers)
   - "${movieName.replace(/season\s*/i, 'S')}" (S notation)

PLATFORM SPECIFICATION: ${platformHint}
${languageInstructions[language]}
KNOWN RELEASES TO REFERENCE (if applicable):
- Delhi Crime Season 3: Released on Netflix on August 18, 2023
- Delhi Crime Season 2: Released on Netflix on August 26, 2022
- Delhi Crime Season 1: Released on Netflix on March 22, 2019

TASK: Write a compelling ${contentType.toLowerCase()} for "${movieName}" from the ${industryName} industry.

WORD COUNT REQUIREMENT: Write approximately ${articleLength} words (target: ${articleLength} ± 50 words).

STEP 1 - TITLE INTERPRETATION:
If the title ends with a number (like "Delhi Crime 3"), it likely means "Season 3".
Consider variations like:
- "${movieName}"
- "${movieName.replace(/(\d+)$/, 'Season $1')}"
- "${movieName.replace(/season\s*/i, 'S')}"

STEP 2 - PLATFORM & RELEASE INFO:
You MUST determine and explicitly state:
✓ Is this a Netflix original/exclusive?
✓ Is this on Amazon Prime Video?
✓ Is this on Disney+, Hulu, or other streaming platforms?
✓ Is this a theatrical release?
✓ EXACT release date (day, month, year)
✓ Current availability status (Released / Coming Soon / In Production)

Use your training data knowledge (up to January 2025) to identify:
- Streaming platform (Netflix, Prime Video, Disney+, etc.)
- Release date
- Current availability
- Cast and crew
- Plot details
- Reviews and ratings

STEP 3 - ARTICLE CONTENT:
Write based on your knowledge of:
   - EXACT release date and streaming platform
   - Director, main cast, and production team
   - Genre and runtime
   - Plot synopsis (avoid major spoilers for reviews)
   - Critical reception and ratings
   - Audience response
   - Awards and nominations (if any)
   - Number of seasons/episodes (if series)

STEP 4 - WRITE THE CONTENT:
${scriptType === 'review' ? `Write a professional movie REVIEW (${articleLength} words) that includes:
   - Engaging opening hook with platform availability (e.g., "Now streaming on Netflix...")
   - Release date and platform clearly mentioned in first paragraph
   - Brief plot overview (spoiler-free)
   - Analysis of performances, direction, cinematography
   - Discussion of themes and storytelling
   - Technical aspects (music, editing, VFX if relevant)
   - Comparison to similar titles on the same platform
   - Final verdict and rating
   - Who would enjoy this ${category === 'ott' ? 'show/movie' : 'film'}
   - Clear statement of current availability` : scriptType === 'story' ? `Write a captivating STORY SYNOPSIS (${articleLength} words) that includes:
   - Platform and release info upfront
   - Intriguing introduction to the story world
   - Main characters and their motivations
   - Key plot points and story arc
   - Central conflicts and themes
   - Emotional journey of the characters
   - Climactic moments (without spoiling the ending)
   - Why this story resonates with audiences
   - Where to watch it now` : `Write a complete YOUTUBE VIDEO SCRIPT (${articleLength} words) for a movie review video that includes:

📹 YOUTUBE-SPECIFIC REQUIREMENTS:
   - Format as a SPEAKING SCRIPT with clear sections
   - Include [VISUAL CUE] instructions for video editing
   - Mark timing for B-roll footage and images
   - Follow YouTube copyright guidelines (no extended movie clips)
   - Engaging, conversational tone for camera delivery
   - Natural speech patterns with pauses marked

🎬 SCRIPT STRUCTURE:

[INTRO - 0:00]
   - Hook: Engaging opening line to grab attention
   - Brief intro of what you'll discuss
   - Platform availability mention
   [VISUAL CUE: Show movie poster/thumbnail]

[BACKGROUND - 0:30]
   - Release date and platform
   - Director, main cast
   - Genre and runtime
   [VISUAL CUE: Static images of cast, behind-the-scenes photos]

[PLOT OVERVIEW - 1:00]
   - Brief, spoiler-free plot summary
   - Set up the premise
   [VISUAL CUE: Static promotional images, NEVER full movie clips]

[WHAT WORKS - 2:00]
   - Discuss strong points: performances, direction, cinematography
   - Use specific examples from the film
   - Engaging delivery with enthusiasm
   [VISUAL CUE: Static stills from key scenes, promotional photos]

[WHAT DOESN'T WORK - 3:00] (if applicable)
   - Constructive criticism of weak points
   - Balanced, fair assessment
   [VISUAL CUE: More static images, text overlays with key points]

[RATINGS & VERDICT - 4:00]
   - Your rating (out of 10 or 5 stars)
   - IMDb, Rotten Tomatoes scores
   - Final recommendation
   - Who should watch this
   [VISUAL CUE: Rating graphics, comparison charts]

[CALL TO ACTION - 4:45]
   - Ask viewers to like, subscribe, comment
   - Mention where to watch the movie/show
   - Tease next video topic
   [VISUAL CUE: Subscribe button animation, social media handles]

⚠️ COPYRIGHT-SAFE GUIDELINES:
   - Use ONLY static images (posters, promotional photos, behind-the-scenes)
   - NEVER use extended movie clips (>5-10 seconds)
   - Mark all visuals as [VISUAL CUE: description]
   - Keep speaking over any brief clips shown
   - Use transformative commentary (fair use)
   - Include text overlays for key points

🎤 SPEAKING DIRECTIONS:
   - Write exactly what to say to camera
   - Mark pauses with [PAUSE]
   - Include [EMPHASIS] tags for important points
   - Natural, conversational language
   - Include transitional phrases
   - Approximate timing markers`}

STEP 5 - WRITING STYLE:
   - Start with platform availability: "Streaming now on Netflix..." or "Available on Amazon Prime Video..."
   - Professional yet conversational tone
   - Engaging and easy to read
   - Use vivid descriptions and specific examples
   - Include actual ratings and scores (IMDb, RT, Metacritic)
   - Cite sources when mentioning reviews or facts
   - Structure with clear paragraphs and logical flow
   - Use proper terminology (series vs movie, season vs film, etc.)

STEP 6 - SEO OPTIMIZATION:
   - Naturally incorporate: movie/show name, platform name (Netflix, Prime Video, etc.)
   - Use relevant keywords: streaming, ${industryName}, ${scriptType}, OTT, web series, etc.
   - Include searchable phrases: "where to watch ${movieName}", "is ${movieName} on Netflix", etc.

CRITICAL WRITING REQUIREMENTS:
❌ DO NOT include search status messages like "Let me search..." or "I'll look for..."
❌ DO NOT explain that you're going to search
❌ DO NOT say "yet to be released" if you know it's already out
✅ DO write the article directly - no meta-commentary
✅ DO interpret "Delhi Crime 3" as "Delhi Crime Season 3"
✅ DO use your knowledge up to January 2025
✅ DO state platform clearly in the opening
✅ DO provide specific release dates if you know them
✅ DO write confidently about titles you recognize

If you truly don't have information about this specific title, write:
"While specific details about this release are limited, here's what we can explore about this title..." Then write based on what you do know about the series/franchise.

FORMAT: Clean paragraphs with no markdown formatting. Plain text only.`;

  // Append custom instructions if provided
  if (customInstructions && customInstructions.trim()) {
    prompt += `\n\nADDITIONAL REQUIREMENTS FROM USER:\n${customInstructions.trim()}`;
  }

  return prompt;
};

/**
 * Map model shorthand to actual model ID
 */
const MODEL_MAP = {
  'sonnet': 'claude-sonnet-4-5-20250929',
  'haiku': 'claude-3-5-haiku-20241022',
  'hybrid-sonnet': 'claude-sonnet-4-5-20250929', // Uses Google Search + Claude Sonnet
  'hybrid-haiku': 'claude-3-5-haiku-20241022',    // Uses Google Search + Claude Haiku
  'gpt-4o': 'gpt-4o',                             // ChatGPT 4o with Google Search
  'gpt-4o-mini': 'gpt-4o-mini'                    // ChatGPT 4o-mini (cheaper) with Google Search
};

/**
 * Generate AI article using Claude API
 * @param {Object} params - Generation parameters
 * @param {string} params.movieName - Name of the movie
 * @param {string} params.scriptType - Type of content ('review' or 'story')
 * @param {string} params.category - Category/industry
 * @param {string} params.platform - Streaming platform
 * @param {string} params.imageUrl - Optional image URL
 * @param {string} params.model - Model selection ('sonnet' or 'haiku')
 * @param {string} params.customInstructions - Optional custom instructions
 * @param {number} params.articleLength - Target word count
 * @returns {Promise<Object>} - Generated article preview
 */
export const generateArticle = async ({ movieName, scriptType, category, platform = 'auto-detect', imageUrl, model = 'sonnet', customInstructions = '', articleLength = 800, language = 'english' }) => {
  // Check if using ChatGPT models
  if (model.startsWith('gpt-')) {
    console.log('🤖 Using ChatGPT with Google Search');
    const { generateChatGPTArticle } = await import('./chatgptService');
    return generateChatGPTArticle({
      movieName,
      scriptType,
      category,
      platform,
      imageUrl,
      model: model,
      customInstructions,
      articleLength,
      language
    });
  }

  // Check if using hybrid mode (Google Search + Claude)
  if (model.startsWith('hybrid-')) {
    console.log('🔍 Using Hybrid Mode: Google Search + Claude');
    const { generateHybridArticle } = await import('./hybridSearchService');
    const baseModel = model.replace('hybrid-', ''); // 'hybrid-sonnet' -> 'sonnet'
    return generateHybridArticle({
      movieName,
      scriptType,
      category,
      platform,
      imageUrl,
      model: baseModel,
      customInstructions,
      articleLength,
      language
    });
  }

  // Standard Claude-only mode
  // Build the prompt
  const prompt = buildAgentPrompt(movieName, scriptType, category, platform, customInstructions, articleLength, language);

  // Map model shorthand to actual model ID
  const modelId = MODEL_MAP[model] || MODEL_MAP.sonnet;

  console.log('🤖 Generating AI article (Claude only)...');
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

    // Call Claude API directly with extended thinking for better research
    const message = await anthropic.messages.create({
      model: modelId,
      max_tokens: scriptType === 'review' ? 3000 : 2500, // Increased for better quality
      temperature: 0.7, // Balanced creativity and accuracy
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
      movieName: movieName,
      language: language
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
      movieName: movieName,
      language: language
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
