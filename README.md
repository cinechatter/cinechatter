# CineChatter - Entertainment News & Reviews

Your ultimate entertainment hub for movies, music, celebrity style, and more!

## 🚀 Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This creates a `dist` folder ready for deployment.

## 📦 Deployment Instructions

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   - Create a new repository on GitHub
   - Push this code to GitHub

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect settings
   - Click "Deploy"
   - Done! Your site is live at `your-app.vercel.app`

### Deploy to Netlify

1. **Push to GitHub** (same as above)

2. **Deploy on Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Build settings will be auto-detected:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy"
   - Done! Your site is live at `your-app.netlify.app`

### Manual Deployment (Any Host)

1. Build the project:
```bash
npm run build
```

2. Upload the `dist` folder contents to your web host

## 🔧 Configuration

### Custom Domain

Both Vercel and Netlify allow you to add a custom domain for free:
- Go to your project settings
- Navigate to "Domains"
- Add your custom domain (e.g., cinechatter.com)
- Follow DNS configuration instructions

### Environment Variables

If you add Firebase or other backend services, add environment variables:

**Vercel:**
- Go to Project Settings → Environment Variables
- Add your variables

**Netlify:**
- Go to Site Settings → Environment Variables
- Add your variables

## 📱 Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Multiple categories (Hollywood, Bollywood, OTT, Music, etc.)
- ✅ Treasure Box daily feature
- ✅ Google Sheets integration
- ✅ Admin panel for content management
- ✅ Search functionality
- ✅ Newsletter subscription

## 🔐 Admin Access

Default admin password: `admin123`

**⚠️ IMPORTANT:** Change this password before deployment or implement proper authentication (Firebase/Supabase recommended).

## 📊 Google Sheets Integration

To use Google Sheets for content management:

1. Create a Google Sheet with columns: Category | Title | Content | Image URL | Date | Status
2. Publish to web as CSV
3. In admin panel → Integration Settings
4. Paste your sheet URL
5. Click "Connect Sheet"
6. Choose data source (Admin Only, Sheets Only, or Both)

## 🛠️ Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **localStorage** - Data persistence

## 📄 License

Private project - All rights reserved

## 🤝 Support

For issues or questions, contact: cinechattercontact@gmail.com

---

Built with ❤️ for entertainment enthusiasts
