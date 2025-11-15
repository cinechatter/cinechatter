# Quick Start Guide - Claude AI Integration

## ⚡ 5-Minute Setup

### 1. Get API Key (2 minutes)
```
1. Visit: https://console.anthropic.com/
2. Sign up with Google/GitHub
3. Add payment method (card required)
4. Generate API key (Settings → API Keys)
5. Copy key: sk-ant-api03-...
```

### 2. Install & Configure (1 minute)
```bash
# Install dependencies
npm install

# Add API key to .env
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-key" >> .env
```

### 3. Deploy (2 minutes)
```bash
# Deploy to Vercel
vercel env add ANTHROPIC_API_KEY  # Paste your key
vercel --prod
```

### 4. Test It!
```
1. Open your deployed app
2. Go to Admin → Agent tab
3. Enter movie: "Inception"
4. Click "Generate Article"
5. ✅ See real AI content!
```

---

## 💰 Quick Pricing

| Model | Cost/Article | When to Use |
|-------|--------------|-------------|
| **Sonnet 4.5** | $0.02 | Production (best quality) |
| **Haiku 3.5** | $0.002 | Testing/high volume |

**100 articles/month = $2 (Sonnet) or $0.20 (Haiku)**

---

## 🔑 Where to Find Things

- **Get API Key**: https://console.anthropic.com/settings/keys
- **Check Usage**: https://console.anthropic.com/usage
- **Set Budget**: https://console.anthropic.com/settings/billing
- **Full Guide**: See `CLAUDE_API_SETUP.md`

---

## 🆘 Troubleshooting

**Error: API not connected**
- Check `.env` has `ANTHROPIC_API_KEY`
- Restart dev server: `npm run dev`

**Error: Invalid API key**
- Regenerate key in console
- Update `.env`
- Redeploy

**Costs too high?**
- Set budget limit in console
- Switch to Haiku model
- Enable usage alerts

---

**That's it! Start generating articles!** 🎉
