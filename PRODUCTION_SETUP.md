# Production Setup Guide - CineChatter

This guide will help you configure CineChatter for production deployment on Vercel or Netlify.

## Overview

CineChatter uses **serverless API routes** in production to keep API keys secure. The app automatically detects production environment and routes API calls through serverless functions.

---

## Required Environment Variables

### 1. Vercel/Netlify Dashboard Configuration

Go to your project settings and add these **Environment Variables**:

#### **Database & Authentication** (Required)
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **AI Article Generation** (Required)
**IMPORTANT: Use keys WITHOUT VITE_ prefix for production!**

```bash
# Anthropic Claude API (for serverless endpoint)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI API (for serverless endpoint)
OPENAI_API_KEY=sk-proj-...
```

#### **Google Custom Search** (Optional - for web search features)
```bash
VITE_GOOGLE_SEARCH_API_KEY=AIzaSy...
VITE_GOOGLE_CSE_ID=your-cse-id
```

---

## Step-by-Step Setup

### Step 1: Configure Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add each variable one by one:
   - **Key**: Variable name (e.g., `ANTHROPIC_API_KEY`)
   - **Value**: Your actual API key
   - **Environment**: Select **Production**, **Preview**, and **Development**
3. Click **Save**

### Step 2: Verify API Keys

Make sure you have valid API keys:

#### Anthropic Claude API
- Get key from: https://console.anthropic.com/settings/keys
- Format: `sk-ant-api03-...`
- Verify it works: Test in Anthropic Console

#### OpenAI API
- Get key from: https://platform.openai.com/api-keys
- Format: `sk-proj-...`
- Check billing: Ensure you have credits available

#### Google Custom Search (Optional)
- API Key: https://console.cloud.google.com/apis/credentials
- Search Engine ID: https://programmablesearchengine.google.com
- Free tier: 100 queries/day

### Step 3: Deploy

After adding environment variables:

```bash
# Push your changes
git add .
git commit -m "Configure production environment"
git push origin main

# Vercel will automatically redeploy
```

Or manually redeploy in Vercel Dashboard → **Deployments** → **Redeploy**

---

## Troubleshooting

### Error: "Failed to generate article"

**Check Browser Console**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for error messages starting with ❌

**Common Issues:**

#### 1. "API key not configured"
- ✅ **Fix**: Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to Vercel environment variables
- ⚠️ **Important**: Use keys WITHOUT `VITE_` prefix in production!

#### 2. "Invalid API key" (401 error)
- ✅ **Fix**: Verify API keys are correct and active
- Check Anthropic Console: https://console.anthropic.com/settings/keys
- Check OpenAI Dashboard: https://platform.openai.com/account/api-keys

#### 3. "Rate limit exceeded" (429 error)
- ✅ **Fix**: You've hit the API rate limit
- Wait a few minutes and try again
- Consider upgrading your API plan

#### 4. "Network error" or "Failed to fetch"
- ✅ **Fix**: Check if serverless API routes are deployed
- Verify `api/claude/generate.js` and `api/openai/generate.js` exist in your repo
- Check Vercel Functions logs

### Checking Serverless Function Logs

1. Go to **Vercel Dashboard** → Your Project → **Functions**
2. Click on `/api/claude/generate` or `/api/openai/generate`
3. View execution logs to see errors

### Testing in Development

Before deploying, test locally:

```bash
# Set development environment variables
cp .env.example .env
# Edit .env with your keys (use VITE_ prefix)

# Run development server
npm run dev

# Test AI article generation
# If it works locally but fails in production, it's likely an environment variable issue
```

---

## Security Best Practices

### ✅ DO:
- Use `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` WITHOUT `VITE_` prefix in production
- Keep `.env` in `.gitignore` (never commit real keys)
- Use serverless API routes for sensitive operations
- Rotate API keys regularly

### ❌ DON'T:
- Set `VITE_ANTHROPIC_API_KEY` or `VITE_OPENAI_API_KEY` in production (exposes keys in browser!)
- Commit `.env` file to Git
- Share API keys publicly
- Use same keys for development and production

---

## API Cost Estimation

### Anthropic Claude Sonnet 4.5
- Input: $3.00 / 1M tokens (~750K words)
- Output: $15.00 / 1M tokens (~750K words)
- Average article (800 words): ~$0.02-0.04

### OpenAI GPT-4o
- Input: $2.50 / 1M tokens
- Output: $10.00 / 1M tokens
- Average article (800 words): ~$0.02-0.03

### Google Custom Search
- Free tier: 100 queries/day
- Paid: $5 per 1000 additional queries

**Tip**: Start with GPT-4o-mini (cheaper) or Claude Haiku for testing.

---

## Monitoring & Alerts

### Vercel
- Monitor function execution time and errors in **Functions** tab
- Set up error alerts in **Settings** → **Notifications**

### API Usage
- Anthropic: https://console.anthropic.com/settings/usage
- OpenAI: https://platform.openai.com/usage
- Google Search: https://console.cloud.google.com/apis/dashboard

---

## Support

If you're still experiencing issues after following this guide:

1. Check Vercel function logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test API keys directly in respective consoles
4. Check API billing and quota limits

For more help, open an issue on GitHub with:
- Error message from browser console
- Vercel function logs (remove sensitive info)
- Steps to reproduce the issue
