# AI Article Generator - Setup Guide

## Overview

The AI Article Generator is a powerful feature in CineChatter's Admin Dashboard that allows you to automatically create professional movie reviews and story synopses using Claude AI with web search capabilities.

## Features

### What It Does
- **Automated Content Creation**: Generate 800-1000 word reviews or 600-800 word story synopses
- **Web Research**: Searches the internet for accurate, up-to-date movie information
- **SEO Optimized**: Articles are optimized for search engines
- **Professional Quality**: Entertainment journalism style with proper structure
- **Preview & Edit**: Review generated content before publishing

### Current Status
The UI and workflow are **fully implemented**. The feature currently shows a demo with the prompt structure. To enable full AI generation, you need to integrate Claude API (instructions below).

## How to Use (Current Demo)

1. **Access the Agent Tab**
   - Login to Admin Dashboard
   - Click on the "Agent" tab

2. **Fill Out the Form**
   - **Movie Name**: Enter the movie title (e.g., "Inception", "RRR", "Dune Part Two")
   - **Content Type**: Choose between "Review" or "Story Synopsis"
   - **Category**: Select appropriate category (Hollywood, Bollywood, OTT, etc.)
   - **Image URL** (Optional): Add a poster URL or leave empty for placeholder

3. **Generate Article**
   - Click "Generate Article" button
   - The system will create a preview showing:
     - How the prompt is structured
     - What data would be gathered
     - What the final article would contain

4. **Review & Publish**
   - Review the generated preview
   - Click "Publish Article" to add it to your site
   - Or click "Start Over" to generate a new article

## The AI Prompt Template

The system builds intelligent prompts based on your inputs. Here's what makes it effective:

### Prompt Structure

```
You are an expert entertainment journalist writing for CineChatter

TASK: Write a [Review/Story] for "[Movie Name]" from [Industry]

INSTRUCTIONS:
1. Search the web for accurate information about the movie
2. Gather details about:
   - Release date and box office performance
   - Director, cast, and crew
   - Plot synopsis
   - Critical reception and ratings
   - Awards and nominations
   - Behind-the-scenes facts

3. For Reviews:
   - Engaging opening hook
   - Brief plot overview (spoiler-free)
   - Analysis of performances, direction, cinematography
   - Discussion of themes and storytelling
   - Technical aspects (music, editing, VFX)
   - Comparison to similar films
   - Final verdict and rating
   - Target audience

3. For Story Synopsis:
   - Intriguing introduction to the story world
   - Main characters and motivations
   - Key plot points and story arc
   - Central conflicts and themes
   - Emotional journey
   - Climactic moments (no ending spoilers)
   - Why it resonates with audiences

4. Writing Style:
   - Professional yet conversational tone
   - Engaging and easy to read
   - Vivid descriptions and specific examples
   - Include quotes from reviews/interviews
   - Maintain objectivity while being entertaining
   - Clear paragraphs and logical flow

5. SEO Optimization:
   - Naturally incorporate movie name multiple times
   - Use relevant keywords
   - Include searchable phrases

6. Format for web reading
```

## Enabling Full AI Generation

To enable actual AI article generation (not just the demo), follow these steps:

### Step 1: Get Claude API Access

1. **Sign up for Anthropic API**
   - Go to https://console.anthropic.com/
   - Create an account or sign in
   - Navigate to API Keys section
   - Generate a new API key
   - Copy and save it securely

### Step 2: Set Up Environment Variables

Add to your `.env` file:

```bash
# Claude AI Configuration
VITE_ANTHROPIC_API_KEY=your_api_key_here

# Or if using backend proxy (recommended for security)
VITE_AI_API_ENDPOINT=https://your-backend.com/api/generate-article
```

**IMPORTANT**: Never expose API keys in frontend code in production. Use a backend proxy.

### Step 3: Backend Implementation (Recommended)

Create a backend endpoint to handle AI generation securely:

**Example Node.js/Express Backend:**

```javascript
// backend/routes/ai.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post('/api/generate-article', async (req, res) => {
  const { movieName, scriptType, category } = req.body;

  // Build the prompt (use buildAgentPrompt function)
  const prompt = buildPrompt(movieName, scriptType, category);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }],
      // Enable web search
      tools: [{
        type: 'web_search',
        name: 'web_search',
        description: 'Search the web for information'
      }]
    });

    res.json({
      success: true,
      content: message.content[0].text
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Step 4: Update Frontend Code

In `src/App.jsx`, update the `generateAIArticle` function:

```javascript
const generateAIArticle = async () => {
  const { movieName, scriptType, imageUrl, category } = agentForm;

  if (!movieName.trim()) {
    setAgentError('Please enter a movie name');
    return;
  }

  setAgentGenerating(true);
  setAgentError(null);
  setAgentPreview(null);

  try {
    // Call your backend API
    const response = await fetch('/api/generate-article', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movieName,
        scriptType,
        category
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Generation failed');
    }

    // Create preview with actual AI-generated content
    const preview = {
      title: `${scriptType === 'review' ? 'Review' : 'Story'}: ${movieName}`,
      content: data.content,
      category: category,
      image: imageUrl || `https://via.placeholder.com/800x400?text=${encodeURIComponent(movieName)}`,
      source: 'AI Agent',
      scriptType: scriptType,
      movieName: movieName
    };

    setAgentPreview(preview);
    console.log('✅ AI article generated successfully');

  } catch (error) {
    console.error('❌ AI generation failed:', error);
    setAgentError(error.message || 'Failed to generate article. Please try again.');
  } finally {
    setAgentGenerating(false);
  }
};
```

## Alternative: Image Upload Feature

If you want to add image upload instead of URL input:

### Using Supabase Storage

```javascript
// Add to your form
<input
  type="file"
  accept="image/*"
  onChange={handleImageUpload}
  className="..."
/>

// Upload handler
const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('movie-posters')
      .upload(`${Date.now()}_${file.name}`, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('movie-posters')
      .getPublicUrl(data.path);

    setAgentForm({...agentForm, imageUrl: publicUrl});
  } catch (error) {
    console.error('Upload failed:', error);
    setAgentError('Image upload failed');
  }
};
```

## Cost Estimation

Using Claude API:

- **Claude 3.5 Sonnet**: ~$3 per million input tokens, ~$15 per million output tokens
- **Average article**: ~1,000 input tokens + ~1,200 output tokens
- **Cost per article**: ~$0.02 - $0.03
- **100 articles/month**: ~$2-3

Very affordable for professional content creation!

## Best Practices

1. **Review Before Publishing**: Always review AI-generated content for accuracy
2. **Add Personal Touch**: Edit to add your unique perspective
3. **Verify Facts**: Double-check dates, names, and statistics
4. **Image Selection**: Use high-quality, copyright-free images
5. **SEO Enhancement**: Add meta descriptions and tags manually if needed
6. **Regular Updates**: Keep articles updated with new information

## Troubleshooting

### Issue: "Please enter a movie name"
- **Solution**: Ensure movie name field is not empty

### Issue: Generation takes too long
- **Solution**: Web search can take 10-30 seconds. Be patient or add a timeout

### Issue: Incorrect information in article
- **Solution**: The AI searches the web, but verify facts manually. Edit before publishing

### Issue: API key errors
- **Solution**: Check your `.env` file and ensure API key is valid

## Future Enhancements

Potential improvements:

1. **Bulk Generation**: Generate multiple articles at once
2. **Template Customization**: Custom prompt templates
3. **Multi-language Support**: Generate in different languages
4. **Auto-scheduling**: Schedule articles for future publishing
5. **Draft Management**: Save drafts before publishing
6. **A/B Testing**: Generate multiple versions and choose best
7. **Image Search Integration**: Auto-find and suggest poster images
8. **Fact Checking**: Automatic verification of claims

## Support

If you need help:
1. Check the console for error messages
2. Verify your API configuration
3. Test with simple movie names first
4. Check network requests in browser DevTools

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit API keys** to git
2. **Use environment variables** for all sensitive data
3. **Implement rate limiting** to prevent abuse
4. **Use backend proxy** instead of frontend API calls
5. **Validate all inputs** to prevent injection attacks
6. **Set up CORS properly** if using separate backend

---

**Version**: 1.0
**Last Updated**: November 14, 2024
**Status**: Demo Mode (Backend integration required for full functionality)
