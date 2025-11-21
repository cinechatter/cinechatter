/**
 * YouTube Script Helper
 * Shared helper for building YouTube script prompts across all AI services
 */

/**
 * Build YouTube script section for prompts
 * @param {number} articleLength - Target word count
 * @returns {string} - YouTube script formatting instructions
 */
export const buildYouTubeScriptSection = (articleLength) => {
  return `Write a complete YOUTUBE VIDEO SCRIPT (${articleLength} words) for a movie review video that includes:

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
   - Approximate timing markers

📝 FORMAT EXAMPLE:
[INTRO - 0:00]
[VISUAL CUE: Movie poster fades in]
"Hey everyone, welcome back to the channel! [PAUSE] Today, we're diving into [Movie Name], the latest thriller that just dropped on Netflix. [PAUSE] Is it worth your time? Let's find out!"
[VISUAL CUE: Transition to host on camera]

IMPORTANT: Write the ENTIRE script in this format with all sections included.`;
};

/**
 * Get content type description
 * @param {string} scriptType - 'review', 'story', or 'youtube'
 * @returns {string}
 */
export const getContentTypeDescription = (scriptType) => {
  switch (scriptType) {
    case 'review':
      return 'Movie Review';
    case 'story':
      return 'Movie Story Synopsis';
    case 'youtube':
      return 'YouTube Video Script';
    default:
      return 'Movie Content';
  }
};
