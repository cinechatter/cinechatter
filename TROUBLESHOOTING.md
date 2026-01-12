# Troubleshooting Guide - CineChatter AI Generation

## Quick Diagnostics

If AI article generation is failing in production, follow these steps:

### Step 1: Check Browser Console

1. Open DevTools (Press F12 or Right-click → Inspect)
2. Go to **Console** tab
3. Try generating an article
4. Look for error messages with these prefixes:
   - `❌` - Errors
   - `⚠️` - Warnings
   - `📡` - API calls
   - `✅` - Success messages

### Step 2: Run Diagnostic Script

Copy and paste this script into your browser console:

```javascript
// CineChatter Production Diagnostic
console.log('🔍 CineChatter Diagnostic Check\n=================================\n');

// Check environment
console.log('Environment:', import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('Hostname:', window.location.hostname);
console.log('');

// Check API endpoint accessibility
console.log('Testing API Endpoints...');

// Test Claude endpoint
fetch('/api/claude/generate', { method: 'OPTIONS' })
  .then(r => console.log('✅ /api/claude/generate:', r.status))
  .catch(e => console.error('❌ /api/claude/generate:', e.message));

// Test OpenAI endpoint
fetch('/api/openai/generate', { method: 'OPTIONS' })
  .then(r => console.log('✅ /api/openai/generate:', r.status))
  .catch(e => console.error('❌ /api/openai/generate:', e.message));

console.log('');

// Check environment variables (client-side only)
console.log('Client-Side Environment Variables:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('VITE_GOOGLE_SEARCH_API_KEY:', import.meta.env.VITE_GOOGLE_SEARCH_API_KEY ? '✅ Set' : '❌ Missing');
console.log('VITE_GOOGLE_CSE_ID:', import.meta.env.VITE_GOOGLE_CSE_ID ? '✅ Set' : '❌ Missing');
console.log('');
console.log('⚠️ Server-side keys (ANTHROPIC_API_KEY, OPENAI_API_KEY) cannot be checked from browser.');
console.log('   Check Vercel Dashboard → Settings → Environment Variables');
```

### Step 3: Test API Endpoints Manually

#### Test Claude Endpoint

```bash
# Replace YOUR_VERCEL_URL with your actual deployment URL
curl -X POST https://YOUR_VERCEL_URL/api/claude/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short test message",
    "model": "claude-sonnet-4-5-20250929",
    "maxTokens": 100,
    "temperature": 0.7
  }'
```

Expected response:
```json
{
  "content": "Test message here...",
  "usage": { ... },
  "model": "claude-sonnet-4-5-20250929"
}
```

#### Test OpenAI Endpoint

```bash
curl -X POST https://YOUR_VERCEL_URL/api/openai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short test message",
    "model": "gpt-4o",
    "maxTokens": 100,
    "temperature": 0.7
  }'
```

---

## Common Errors and Solutions

### Error: "API key not configured"

**Symptoms:**
- Error message: "Please set ANTHROPIC_API_KEY environment variable"
- Status 500 from API endpoint

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `ANTHROPIC_API_KEY` (without VITE_ prefix)
3. Add `OPENAI_API_KEY` (without VITE_ prefix)
4. **Redeploy** your project (important!)

**Why it happens:**
Server-side API keys are not set in Vercel environment variables.

---

### Error: "Invalid API key" (401)

**Symptoms:**
- Error message: "Please check your ANTHROPIC_API_KEY"
- Status 401 from API endpoint

**Solution:**
1. Verify your API key is correct and active
2. Check Anthropic Console: https://console.anthropic.com/settings/keys
3. Make sure the key hasn't expired or been revoked
4. Copy the key carefully (no extra spaces)

**Why it happens:**
The API key in Vercel is incorrect, expired, or invalid.

---

### Error: "Rate limit exceeded" (429)

**Symptoms:**
- Error message: "Too many requests"
- Status 429 from API endpoint

**Solution:**
1. Wait a few minutes before trying again
2. Check your API usage:
   - Anthropic: https://console.anthropic.com/settings/usage
   - OpenAI: https://platform.openai.com/usage
3. Upgrade your API plan if needed

**Why it happens:**
You've hit the API rate limit or quota.

---

### Error: "Failed to fetch" or "Network error"

**Symptoms:**
- Error in console: "Failed to fetch"
- No response from API endpoint

**Solution:**
1. Check if API routes are deployed:
   - Vercel Dashboard → Functions tab
   - Should see `/api/claude/generate` and `/api/openai/generate`
2. Verify `api/` folder is in your Git repository
3. Check Vercel build logs for errors
4. Try redeploying:
   ```bash
   git push origin main
   ```

**Why it happens:**
- API routes weren't deployed
- Build failed
- CORS issues

---

### Google Search Not Working

**Symptoms:**
- Warning: "Google Search API credentials not configured"
- Articles generated without search results

**Solution:**
1. Get Google API key: https://console.cloud.google.com/apis/credentials
2. Create Custom Search Engine: https://programmablesearchengine.google.com
3. Add to Vercel environment variables:
   ```
   VITE_GOOGLE_SEARCH_API_KEY=AIzaSy...
   VITE_GOOGLE_CSE_ID=your-cse-id
   ```
4. Redeploy

**Note:** Google Search is optional. AI generation will still work using the model's training data.

---

## Vercel Function Logs

To see detailed error logs:

1. Go to **Vercel Dashboard** → Your Project
2. Click **Functions** in the sidebar
3. Click `/api/claude/generate` or `/api/openai/generate`
4. View **Invocations** and **Logs**

Look for:
- Error messages
- Status codes
- Execution duration
- Memory usage

---

## Testing Locally vs Production

### Local Development
```bash
# Uses VITE_ prefixed keys (exposed to browser)
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-proj-...
```

### Production (Vercel)
```bash
# Uses non-VITE keys (server-side only)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
```

If it works locally but fails in production:
- ✅ Your code is correct
- ❌ Environment variables are misconfigured in Vercel

---

## Still Having Issues?

### Checklist:
- [ ] All environment variables are set in Vercel Dashboard
- [ ] Used correct variable names (no VITE_ prefix for server keys)
- [ ] API keys are valid and active
- [ ] Redeployed after adding environment variables
- [ ] Checked Vercel function logs for errors
- [ ] API has sufficient credits/quota
- [ ] Browser console shows detailed error messages

### Get Help:
1. Export Vercel function logs (remove sensitive info)
2. Copy browser console error messages
3. Note which model you're using (GPT-4o, Claude Sonnet, etc.)
4. Check if it works in development mode locally
5. Open a GitHub issue with all the above information

---

## Prevention Tips

### Before Deploying:
1. ✅ Test locally first with `npm run dev`
2. ✅ Verify all API keys are working
3. ✅ Check API billing and credits
4. ✅ Set up environment variables in Vercel before deploying
5. ✅ Use `.env.example` as a reference

### Monitoring:
- Set up Vercel error alerts
- Monitor API usage daily
- Keep API keys secure
- Rotate keys periodically

---

## Environment Variable Quick Reference

| Variable | Where | Required | Purpose |
|----------|-------|----------|---------|
| `ANTHROPIC_API_KEY` | Vercel | Yes* | Claude API (server) |
| `OPENAI_API_KEY` | Vercel | Yes* | OpenAI API (server) |
| `VITE_SUPABASE_URL` | Vercel | Yes | Database |
| `VITE_SUPABASE_ANON_KEY` | Vercel | Yes | Auth |
| `VITE_GOOGLE_SEARCH_API_KEY` | Vercel | No | Web search |
| `VITE_GOOGLE_CSE_ID` | Vercel | No | Web search |

\* At least one AI provider (Anthropic or OpenAI) is required

---

For more details, see [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)
