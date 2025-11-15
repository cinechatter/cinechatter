/**
 * Serverless API endpoint for Claude AI generation
 * Works with Vercel/Netlify serverless functions
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model, maxTokens = 2000 } = req.body;

    // Validate inputs
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'API key not configured',
        message: 'Please set ANTHROPIC_API_KEY environment variable'
      });
    }

    console.log('🤖 Calling Claude API...');
    console.log('Model:', model);
    console.log('Max tokens:', maxTokens);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: model || 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Extract text content
    const content = message.content[0].text;

    console.log('✅ Article generated successfully');
    console.log(`Tokens used: ${message.usage.input_tokens} input + ${message.usage.output_tokens} output`);

    // Return generated content
    return res.status(200).json({
      content,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        total_tokens: message.usage.input_tokens + message.usage.output_tokens
      },
      model: message.model
    });

  } catch (error) {
    console.error('❌ Claude API error:', error);

    // Handle different error types
    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'Please check your ANTHROPIC_API_KEY'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

    return res.status(500).json({
      error: 'Generation failed',
      message: error.message || 'Unknown error occurred'
    });
  }
}
