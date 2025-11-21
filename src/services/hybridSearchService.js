/**
 * Hybrid Search Service
 * Orchestrates Google Search + Claude for best writing quality with real-time data
 */

import { performGoogleSearch, buildSearchQuery, formatSearchResultsForAI, isGoogleSearchConfigured } from './googleSearchService';

/**
 * Build enhanced prompt with search results
 * @param {string} movieName - Movie/show name
 * @param {string} scriptType - 'review' or 'story'
 * @param {string} category - Category
 * @param {string} platform - Platform
 * @param {string} searchContext - Formatted search results
 * @param {string} customInstructions - Custom instructions
 * @param {number} articleLength - Target word count
 * @returns {string} - Enhanced prompt
 */
export const buildHybridPrompt = (
  movieName,
  scriptType,
  category,
  platform,
  searchContext,
  customInstructions = '',
  articleLength = 800,
  language = 'english'
) => {
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
  const currentDate = new Date().toISOString().split('T')[0];

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

IMPORTANT: You have access to REAL-TIME WEB SEARCH RESULTS below. Use this current information to write an accurate, up-to-date article.

${searchContext}
${languageInstructions[language]}
TASK: Write a compelling ${contentType.toLowerCase()} for "${movieName}" from the ${industryName} industry.

WORD COUNT REQUIREMENT: Write approximately ${articleLength} words (target: ${articleLength} ± 50 words).

CRITICAL INSTRUCTIONS:
1. ✅ USE the search results above to find:
   - Exact release date and streaming platform
   - Current availability status
   - Cast and crew information
   - Plot details and reviews
   - Ratings and critical reception

2. ✅ PRIORITIZE information from these trusted sources (if found in search results):
   - Netflix.com, Prime Video, Disney+ (official platforms)
   - IMDb, Rotten Tomatoes (ratings and cast)
   - Pinkvilla, Variety, Hollywood Reporter (entertainment news)
   - Reddit discussions for audience reactions

3. ✅ WRITE CONFIDENTLY based on the search results
   - Start with platform availability: "Now streaming on Netflix..." or "Available on Amazon Prime Video..."
   - Include specific release dates found in search results
   - Cite ratings and scores from search results
   - Reference reviewer quotes or audience reactions

4. ❌ DO NOT:
   - Say "according to search results" repeatedly (write naturally)
   - Include meta-commentary about searching
   - Make up information not in search results
   - Say "information not available" if it's in the search results

CONTENT STRUCTURE:
${scriptType === 'review' ? `Write a professional movie REVIEW (${articleLength} words) that includes:
   - Opening hook with platform availability (e.g., "Now streaming on Netflix since [date]...")
   - Release date and platform in first paragraph
   - Brief plot overview (spoiler-free)
   - Analysis of performances, direction, cinematography
   - Discussion of themes and storytelling
   - Technical aspects (music, editing, VFX)
   - Ratings from IMDb, Rotten Tomatoes (if found in search)
   - Final verdict and recommendation
   - Clear statement of where to watch` : scriptType === 'story' ? `Write a captivating STORY SYNOPSIS (${articleLength} words) that includes:
   - Platform and release info upfront
   - Introduction to the story world
   - Main characters and their motivations
   - Key plot points and story arc
   - Central conflicts and themes
   - Emotional journey
   - Climactic moments (spoiler-free ending)
   - Why audiences love it
   - Where to watch it now` : `Write a complete YOUTUBE VIDEO SCRIPT (${articleLength} words) for a movie review video.

📹 YOUTUBE FORMAT with [VISUAL CUES] and timing:
[INTRO - 0:00] Hook + Platform availability
  [VISUAL CUE: Movie poster]
[BACKGROUND - 0:30] Release date, cast, director
  [VISUAL CUE: Static cast images]
[PLOT - 1:00] Spoiler-free summary
  [VISUAL CUE: Promotional stills ONLY]
[WHAT WORKS - 2:00] Strengths analysis
  [VISUAL CUE: Scene stills]
[WHAT DOESN'T WORK - 3:00] Fair criticism
  [VISUAL CUE: Text overlays]
[VERDICT - 4:00] Rating + Recommendation
  [VISUAL CUE: Rating graphics]
[CALL TO ACTION - 4:45] Like/Subscribe + Where to watch
  [VISUAL CUE: Subscribe animation]

⚠️ COPYRIGHT-SAFE: Use ONLY static images, NO movie clips >5-10 seconds
🎤 SPEAKING SCRIPT: Include [PAUSE] and [EMPHASIS] tags`}

WRITING STYLE:
- Professional yet conversational tone
- Engaging and easy to read
- Use specific details from search results
- Natural incorporation of facts
- Clear paragraphs with logical flow
- Proper entertainment terminology

SEO OPTIMIZATION:
- Include: "${movieName}", platform name (Netflix, Prime Video, etc.)
- Use keywords: streaming, ${industryName}, ${scriptType}, OTT, web series
- Include phrases: "where to watch ${movieName}", "is ${movieName} on [platform]"

FORMAT: Clean paragraphs with no markdown formatting. Plain text only.`;

  // Append custom instructions if provided
  if (customInstructions && customInstructions.trim()) {
    prompt += `\n\nADDITIONAL REQUIREMENTS FROM USER:\n${customInstructions.trim()}`;
  }

  return prompt;
};

/**
 * Generate article using hybrid approach (Google Search + Claude)
 * @param {Object} params - Generation parameters
 * @returns {Promise<Object>} - Generated article
 */
export const generateHybridArticle = async ({
  movieName,
  scriptType,
  category,
  platform = 'auto-detect',
  imageUrl,
  model = 'sonnet',
  customInstructions = '',
  articleLength = 800,
  language = 'english'
}) => {
  console.log('🔍 Starting Hybrid Search + Claude generation...');

  // Check if Google Search is configured
  if (!isGoogleSearchConfigured()) {
    throw new Error('Google Search API is not configured. Please add VITE_GOOGLE_SEARCH_API_KEY and VITE_GOOGLE_CSE_ID to your .env file.');
  }

  try {
    // Step 1: Perform Google Search
    const searchQuery = buildSearchQuery(movieName, platform, scriptType);
    console.log('📡 Search query:', searchQuery);

    const searchResults = await performGoogleSearch(searchQuery, 5);

    if (!searchResults || searchResults.length === 0) {
      console.warn('⚠️ No search results found. Falling back to Claude-only mode.');
      // Fallback to regular Claude generation without search
      const { generateArticle } = await import('./aiGeneratorService');
      return generateArticle({
        movieName,
        scriptType,
        category,
        platform,
        imageUrl,
        model,
        customInstructions,
        articleLength,
        language
      });
    }

    // Step 2: Format search results for AI
    const searchContext = formatSearchResultsForAI(searchResults);
    console.log(`✅ Formatted ${searchResults.length} search results`);

    // Step 3: Build enhanced prompt with search context
    const prompt = buildHybridPrompt(
      movieName,
      scriptType,
      category,
      platform,
      searchContext,
      customInstructions,
      articleLength,
      language
    );

    // Step 4: Call Claude with enhanced prompt
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true
    });

    const MODEL_MAP = {
      'sonnet': 'claude-sonnet-4-5-20250929',
      'haiku': 'claude-3-5-haiku-20241022'
    };
    const modelId = MODEL_MAP[model] || MODEL_MAP.sonnet;

    console.log('🤖 Calling Claude with search-enhanced prompt...');
    console.log('Model:', modelId);

    const message = await anthropic.messages.create({
      model: modelId,
      max_tokens: scriptType === 'youtube' ? 4000 : scriptType === 'review' ? 3000 : 2500,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    console.log('✅ Hybrid article generated successfully');
    console.log(`Tokens used: ${message.usage.input_tokens} input + ${message.usage.output_tokens} output`);

    // Extract text content
    const content = message.content[0].text;

    // Extract title
    const extractedTitle = extractTitleFromContent(content) ||
                          `${scriptType === 'review' ? 'Review' : scriptType === 'story' ? 'Story' : 'YouTube Script'}: ${movieName}`;

    return {
      title: extractedTitle,
      content: content,
      category: category,
      image: imageUrl || '',
      source: 'AI Agent (Hybrid)',
      scriptType: scriptType,
      movieName: movieName,
      language: language,
      metadata: {
        searchResultsUsed: searchResults.length,
        sources: searchResults.map(r => r.displayLink).join(', '),
        language: language
      }
    };

  } catch (error) {
    console.error('❌ Hybrid generation failed:', error);
    throw error;
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
