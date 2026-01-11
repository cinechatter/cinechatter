/**
 * Serverless API endpoint for OpenAI (ChatGPT) generation
 * Works with Vercel/Netlify serverless functions
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model, maxTokens = 2000, temperature = 0.7, systemPrompt } = req.body;

    // Validate inputs
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'API key not configured',
        message: 'Please set OPENAI_API_KEY environment variable in Vercel dashboard'
      });
    }

    console.log('🤖 Calling OpenAI API...');
    console.log('Model:', model);
    console.log('Max tokens:', maxTokens);
    console.log('Temperature:', temperature);

    // Build messages array
    const messages = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: prompt
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o',
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens
    });

    // Extract content
    const content = completion.choices[0].message.content;

    console.log('✅ Article generated successfully');
    console.log(`Tokens used: ${completion.usage.prompt_tokens} input + ${completion.usage.completion_tokens} output`);

    // Return generated content
    return res.status(200).json({
      content,
      usage: {
        input_tokens: completion.usage.prompt_tokens,
        output_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      },
      model: completion.model
    });

  } catch (error) {
    console.error('❌ OpenAI API error:', error);

    // Handle different error types
    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'Please check your OPENAI_API_KEY'
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
