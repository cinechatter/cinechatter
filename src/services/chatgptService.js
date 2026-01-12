/**
 * ChatGPT Service
 * Handles OpenAI ChatGPT API calls with Google Search integration
 */

import { performGoogleSearch, buildSearchQuery, formatSearchResultsForAI } from './googleSearchService';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Build prompt for ChatGPT with search results
 */
const buildChatGPTPrompt = (
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
 * Generate article using ChatGPT with Google Search
 * @param {Object} params - Generation parameters
 * @returns {Promise<Object>} - Generated article
 */
export const generateChatGPTArticle = async ({
  movieName,
  scriptType,
  category,
  platform = 'auto-detect',
  imageUrl,
  model = 'gpt-4o',
  customInstructions = '',
  articleLength = 800,
  language = 'english'
}) => {
  console.log('🤖 Starting ChatGPT + Google Search generation...');

  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your_')) {
    throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  try {
    // Step 1: Perform Google Search
    const searchQuery = buildSearchQuery(movieName, platform, scriptType);
    console.log('📡 Search query:', searchQuery);

    const searchResults = await performGoogleSearch(searchQuery, 5);

    if (!searchResults || searchResults.length === 0) {
      console.warn('⚠️ No search results found. Generating without search context.');
    }

    // Step 2: Format search results
    const searchContext = searchResults.length > 0
      ? formatSearchResultsForAI(searchResults)
      : 'No web search results available. Please use your training knowledge to write the article.';

    console.log(`✅ Using ${searchResults.length} search results`);

    // Step 3: Build prompt
    const prompt = buildChatGPTPrompt(
      movieName,
      scriptType,
      category,
      platform,
      searchContext,
      customInstructions,
      articleLength,
      language
    );

    // Step 4: Call OpenAI API (production vs development)
    const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
    const useServerlessAPI = isProduction && !import.meta.env.VITE_OPENAI_API_KEY;

    let content;
    let usage;

    if (useServerlessAPI) {
      // Production: Use serverless API endpoint
      console.log('📡 Calling OpenAI serverless API endpoint...');
      console.log('Mode: PRODUCTION (serverless)');
      console.log('Model:', model);
      console.log('Endpoint: /api/openai/generate');

      const response = await fetch('/api/openai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          model: model,
          maxTokens: scriptType === 'youtube' ? 4000 : scriptType === 'review' ? 3000 : 2500,
          temperature: 0.7,
          systemPrompt: 'You are an expert entertainment journalist writing professional movie reviews and story synopses for CineChatter.'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || `API call failed with status ${response.status}`;
        console.error('❌ OpenAI API error response:', errorData);
        throw new Error(errorMsg);
      }

      const data = await response.json();

      console.log('✅ ChatGPT article generated successfully (serverless)');
      console.log(`Tokens used: ${data.usage.input_tokens} input + ${data.usage.output_tokens} output`);

      content = data.content;
      usage = {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.total_tokens
      };
    } else {
      // Development: Use direct API call with browser SDK
      console.log('📡 Calling ChatGPT API directly (development mode)...');

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true // For development
      });

      console.log('Model:', model);

      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert entertainment journalist writing professional movie reviews and story synopses for CineChatter.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: scriptType === 'youtube' ? 4000 : scriptType === 'review' ? 3000 : 2500
      });

      console.log('✅ ChatGPT article generated successfully');
      console.log(`Tokens used: ${completion.usage.prompt_tokens} input + ${completion.usage.completion_tokens} output`);

      content = completion.choices[0].message.content;
      usage = completion.usage;
    }

    // Extract title
    const extractedTitle = extractTitleFromContent(content) ||
                          `${scriptType === 'review' ? 'Review' : scriptType === 'story' ? 'Story' : 'YouTube Script'}: ${movieName}`;

    return {
      title: extractedTitle,
      content: content,
      category: category,
      image: imageUrl || '',
      source: 'AI Agent (ChatGPT + Search)',
      scriptType: scriptType,
      movieName: movieName,
      language: language,
      metadata: {
        model: model,
        searchResultsUsed: searchResults.length,
        sources: searchResults.map(r => r.displayLink).join(', '),
        tokensUsed: usage.total_tokens,
        language: language
      }
    };

  } catch (error) {
    console.error('❌ ChatGPT generation failed:', error);
    throw error;
  }
};

/**
 * Extract title from generated content
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
 * Check if OpenAI API is configured
 */
export const isOpenAIConfigured = () => {
  return !!(OPENAI_API_KEY && !OPENAI_API_KEY.includes('your_'));
};
