# Claude API Setup Guide

Complete guide to setting up Claude AI integration for CineChatter.

---

## 📋 Prerequisites

- Node.js 18+ installed
- Credit/Debit card for API payments
- Email account for Anthropic signup

---

## 🔑 Step 1: Get Your Claude API Key

### 1.1 Create Anthropic Account

1. **Visit Anthropic Console**
   - Go to: https://console.anthropic.com/
   - Click "Sign Up" (top right)

2. **Sign Up Options**
   - Use Google/GitHub account (recommended)
   - OR create account with email + password

3. **Verify Email**
   - Check your inbox for verification email
   - Click verification link
   - Return to console

### 1.2 Add Payment Method

1. **Navigate to Billing**
   - In console, click "Settings" (left sidebar)
   - Click "Billing" tab

2. **Add Payment Method**
   - Click "Add Payment Method"
   - Enter credit/debit card details:
     * Card number
     * Expiration date
     * CVC
     * Billing address

3. **Set Budget (Optional but Recommended)**
   - Click "Usage Limits"
   - Set monthly budget (e.g., $10/month)
   - Enable email alerts at 50%, 80%, 100%
   - This prevents unexpected charges!

### 1.3 Generate API Key

1. **Navigate to API Keys**
   - Click "API Keys" in left sidebar
   - OR go to: https://console.anthropic.com/settings/keys

2. **Create New Key**
   - Click "+ Create Key" button
   - Give it a name: `cinechatter-production`
   - Click "Create"

3. **Copy API Key**
   - ⚠️ **IMPORTANT**: Copy the key immediately
   - It looks like: `sk-ant-api03-...`
   - You can only see it once!
   - Save it securely (password manager)

---

## 💰 Step 2: Understanding Pricing

### Current Pricing (January 2025)

| Model | Input | Output | Per Article (Avg) |
|-------|-------|--------|-------------------|
| **Claude Sonnet 4.5** | $3/M tokens | $15/M tokens | **~$0.02** |
| **Claude Haiku 3.5** | $0.25/M tokens | $1.25/M tokens | **~$0.002** |

### Monthly Cost Examples

```
With Claude Sonnet 4.5:
- 10 articles/month   = $0.20
- 50 articles/month   = $1.00
- 100 articles/month  = $2.00
- 500 articles/month  = $10.00
- 1000 articles/month = $20.00

With Claude Haiku 3.5:
- 10 articles/month   = $0.02
- 50 articles/month   = $0.10
- 100 articles/month  = $0.20
- 500 articles/month  = $1.00
- 1000 articles/month = $2.00
```

### Payment Methods

- **Credit/Debit Card**: Charged monthly
- **Prepaid Credits**: Add credits upfront (no minimum)
- **Auto-recharge**: Optional automatic top-up

---

## 🛠️ Step 3: Install Dependencies

```bash
# Install Anthropic SDK
npm install @anthropic-ai/sdk

# Verify installation
npm list @anthropic-ai/sdk
```

---

## 🔐 Step 4: Configure Environment Variables

### 4.1 Update .env File

```bash
# Open or create .env file
touch .env

# Add your API key (replace with actual key)
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here" >> .env
```

Your `.env` file should now have:

```env
# Supabase
VITE_SUPABASE_URL=https://xpogipevekygeznakfjc.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-key

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### 4.2 Verify .gitignore

Make sure `.env` is in your `.gitignore`:

```bash
# Check if .env is ignored
grep -q "^\.env$" .gitignore && echo "✅ .env is ignored" || echo "❌ Add .env to .gitignore"
```

If not found, add it:

```bash
echo ".env" >> .gitignore
```

---

## 🚀 Step 5: Deploy Backend API

### Option A: Deploy to Vercel (Recommended)

1. **Install Vercel CLI** (if not installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Add Environment Variable**
   ```bash
   vercel env add ANTHROPIC_API_KEY
   ```
   - When prompted, paste your API key
   - Select "Production" environment
   - Press Enter

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Test the API**
   ```bash
   curl -X POST https://your-app.vercel.app/api/claude/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Write a short movie review for Inception","model":"claude-sonnet-4-5-20250929","maxTokens":500}'
   ```

### Option B: Deploy to Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Set Environment Variable**
   ```bash
   netlify env:set ANTHROPIC_API_KEY "sk-ant-api03-your-key"
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Option C: Local Development

For local testing only (NOT for production):

```bash
# Run the dev server
npm run dev

# The API will be available at:
# http://localhost:3000/api/claude/generate
```

---

## ✅ Step 6: Test the Integration

### 6.1 Test in Browser

1. **Start the app**
   ```bash
   npm run dev
   ```

2. **Navigate to Admin Panel**
   - Go to: http://localhost:3000/#admin
   - Login as admin

3. **Go to Agent Tab**
   - Click "Agent" tab

4. **Test Generation**
   - Enter movie: "Inception"
   - Select AI Quality: "High Quality - Claude Sonnet 4.5"
   - Click "Generate Article"
   - Wait 5-10 seconds
   - ✅ You should see a real AI-generated article!

### 6.2 Test via cURL

```bash
# Test the backend API directly
curl -X POST http://localhost:3000/api/claude/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a 200-word movie review for Inception",
    "model": "claude-sonnet-4-5-20250929",
    "maxTokens": 500
  }'
```

---

## 🔍 Step 7: Monitor Usage & Costs

### 7.1 View Usage in Console

1. **Go to Anthropic Console**
   - https://console.anthropic.com/

2. **Check Usage**
   - Click "Usage" in left sidebar
   - View tokens used and costs

3. **Set Up Alerts**
   - Settings → Billing → Usage Limits
   - Set budget alerts

### 7.2 Monitor in Code

Check the browser console after generating articles:

```
🤖 Calling Claude API...
Model: claude-sonnet-4-5-20250929
Max tokens: 2000
✅ Article generated successfully
Tokens used: 375 input + 1,234 output
```

---

## 🚨 Troubleshooting

### Error: "API key not configured"

**Solution**:
```bash
# Verify environment variable is set
echo $ANTHROPIC_API_KEY

# If empty, add to .env:
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-key" >> .env

# Restart server
```

### Error: "Invalid API key" (401)

**Solution**:
1. Check API key in console: https://console.anthropic.com/settings/keys
2. Regenerate key if needed
3. Update `.env` file
4. Redeploy if in production

### Error: "Rate limit exceeded" (429)

**Solution**:
- You're making too many requests
- Wait 1 minute and try again
- Consider upgrading plan for higher limits

### Error: "Insufficient credits"

**Solution**:
1. Go to: https://console.anthropic.com/settings/billing
2. Add payment method or buy credits
3. Ensure auto-recharge is enabled

### Generated content is simulation

**Solution**:
- Check browser console for API errors
- Verify `ANTHROPIC_API_KEY` is set correctly
- Ensure backend API is deployed
- Test backend endpoint directly with cURL

---

## 💡 Best Practices

### 1. Security

- ✅ **NEVER** commit `.env` file to Git
- ✅ Use environment variables for API key
- ✅ Never expose API key in frontend code
- ✅ Use serverless functions (Vercel/Netlify)
- ❌ Don't put API key directly in frontend

### 2. Cost Management

- Set monthly budget limits in Anthropic console
- Enable email alerts at 80% usage
- Monitor usage regularly
- Start with Haiku for testing (10x cheaper)
- Switch to Sonnet for production quality

### 3. Error Handling

- Always have fallback mode (simulation)
- Show clear error messages to users
- Log errors for debugging
- Implement retry logic for transient failures

---

## 📊 Cost Calculator

Use this to estimate your monthly costs:

```javascript
// Articles per month
const articlesPerMonth = 100;

// Model selection
const modelCosts = {
  sonnet: 0.02,  // $0.02 per article
  haiku: 0.002   // $0.002 per article
};

// Calculate
const monthlyCost = articlesPerMonth * modelCosts.sonnet;
console.log(`Monthly cost: $${monthlyCost.toFixed(2)}`);
```

---

## 🎯 Summary Checklist

- [ ] Created Anthropic account
- [ ] Added payment method
- [ ] Set budget limits ($10/month recommended)
- [ ] Generated API key
- [ ] Saved API key securely
- [ ] Installed `@anthropic-ai/sdk`
- [ ] Added `ANTHROPIC_API_KEY` to `.env`
- [ ] Verified `.env` is in `.gitignore`
- [ ] Deployed backend API to Vercel/Netlify
- [ ] Added environment variable in deployment
- [ ] Tested article generation
- [ ] Set up usage alerts

---

## 🆘 Need Help?

- **Anthropic Docs**: https://docs.anthropic.com/
- **Anthropic Support**: https://support.anthropic.com/
- **Pricing**: https://www.anthropic.com/api#pricing
- **Status Page**: https://status.anthropic.com/

---

**You're all set! 🎉**

Start generating high-quality movie reviews and articles with Claude AI!
