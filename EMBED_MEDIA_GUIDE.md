# Embed Images & Media in Articles

## 🎨 Overview

You can now embed multiple images, galleries, YouTube videos, and Instagram posts **anywhere** in your article content using simple tags.

This works in:
- ✅ Google Sheets (Description/Content column)
- ✅ Admin Panel editor
- ✅ All article types

---

## 📷 Single Image

**Syntax:**
```
[image]IMAGE_URL[/image]
```

**Example in Google Sheets:**
```
This is the first paragraph of your article.

[image]https://res.cloudinary.com/your-cloud/image1.jpg[/image]

This is more content after the image.

[image]https://res.cloudinary.com/your-cloud/image2.jpg[/image]

Final paragraph.
```

**Result:**
- Full-width responsive image
- Rounded corners with shadow
- Proper spacing above and below

---

## 🖼️ Image Gallery (Grid)

**Syntax:**
```
[gallery]
URL1
URL2
URL3
[/gallery]
```

**Example:**
```
Check out these amazing photos from the event:

[gallery]
https://res.cloudinary.com/your-cloud/photo1.jpg
https://res.cloudinary.com/your-cloud/photo2.jpg
https://res.cloudinary.com/your-cloud/photo3.jpg
https://res.cloudinary.com/your-cloud/photo4.jpg
[/gallery]

What an incredible night it was!
```

**Result:**
- Responsive grid (1 column on mobile, 2 on tablet, 3 on desktop)
- Equal height images (object-cover)
- Hover effects
- Professional spacing

---

## 🎬 YouTube Video

**Syntax:**
```
[youtube]YOUTUBE_URL[/youtube]
```

**Supported URL formats:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

**Example:**
```
Here's the official trailer:

[youtube]https://www.youtube.com/watch?v=dQw4w9WgXcQ[/youtube]

Amazing, right?
```

**Result:**
- Full-width responsive embed
- Maintains 16:9 aspect ratio
- Rounded corners with shadow

---

## 📱 Instagram Post/Reel

**Syntax:**
```
[instagram]INSTAGRAM_POST_URL[/instagram]
```

**Example:**
```
Check out this behind-the-scenes moment:

[instagram]https://www.instagram.com/p/ABC123XYZ/[/instagram]

The cast had so much fun filming this scene!
```

**How to get Instagram URL:**
1. Open Instagram post
2. Click the three dots (⋯)
3. Select "Copy link"
4. Paste into your article with `[instagram]...[/instagram]`

**Result:**
- Embedded Instagram post/reel
- Maintains Instagram's native styling
- Shows likes, comments, captions

---

## 📝 Complete Example

Here's a full article with multiple embedded media:

```
## Behind the Scenes: Making of Avatar 3

The highly anticipated Avatar 3 is finally here! Director James Cameron shares exclusive behind-the-scenes content.

[image]https://res.cloudinary.com/demo/avatar3-poster.jpg[/image]

James Cameron spent over 5 years perfecting the underwater motion capture technology for this sequel. The results are absolutely stunning.

## Exclusive Photos

Here are some never-before-seen production photos:

[gallery]
https://res.cloudinary.com/demo/bts1.jpg
https://res.cloudinary.com/demo/bts2.jpg
https://res.cloudinary.com/demo/bts3.jpg
https://res.cloudinary.com/demo/bts4.jpg
https://res.cloudinary.com/demo/bts5.jpg
https://res.cloudinary.com/demo/bts6.jpg
[/gallery]

## Watch the Official Trailer

[youtube]https://www.youtube.com/watch?v=TRAILER_ID[/youtube]

## What the Cast Says

Zoe Saldana shared this moment from the set:

[instagram]https://www.instagram.com/p/EXAMPLE/[/instagram]

Sam Worthington also posted about the film's emotional final scene, calling it "the most challenging but rewarding work of my career."

[image]https://res.cloudinary.com/demo/sam-worthington.jpg[/image]

**Avatar 3** releases in theaters December 2025. Get your tickets now!
```

---

## 🎨 Styling & Responsive Design

All embedded media is:
- ✅ **Fully responsive** (adapts to mobile, tablet, desktop)
- ✅ **Dark mode compatible** (looks great in both themes)
- ✅ **Professional styling** (shadows, rounded corners, spacing)
- ✅ **Fast loading** (optimized rendering)

---

## 💡 Tips & Best Practices

### For Images:
1. **Use Cloudinary URLs** for best performance
2. **Optimal size**: 1200px wide minimum
3. **Format**: JPG for photos, PNG for graphics
4. **Alt text**: Automatically added ("Article image" or "Gallery image")

### For Galleries:
1. **3-6 images** works best
2. **Same aspect ratio** for all images looks cleaner
3. **High resolution** - they'll be resized automatically

### For YouTube:
1. Copy the **full URL** from your browser
2. Any YouTube URL format works
3. Video is embedded, not just linked

### For Instagram:
1. Use **public posts** only
2. Link format must be: `instagram.com/p/POST_ID/`
3. Works for posts, reels, and IGTV

---

## 🔧 Google Sheets Format

When using Google Sheets, your Description column should look like:

| Column C (Description) |
|------------------------|
| Regular text here.<br><br>[image]https://...[/image]<br><br>More text.<br><br>[gallery]https://... https://...[/gallery] |

**Note:** Use Alt+Enter (Windows) or Option+Enter (Mac) to add line breaks in the cell.

---

## 🆘 Troubleshooting

### Images not showing?
- ✅ Check the URL is correct and public
- ✅ Make sure URL starts with `https://`
- ✅ Verify image URL ends with `.jpg`, `.png`, etc.
- ✅ Test the URL directly in your browser

### YouTube not embedding?
- ✅ Check the video is public (not private/unlisted)
- ✅ Copy the full URL from YouTube
- ✅ Try different URL formats if one doesn't work

### Instagram not loading?
- ✅ Post must be public
- ✅ URL must be direct post link (not profile)
- ✅ Format: `https://www.instagram.com/p/POST_ID/`

### Gallery images different sizes?
- ✅ This is normal - they use `object-cover`
- ✅ For uniform look, use images with same aspect ratio
- ✅ Images are cropped to fit the grid

---

## 📊 Examples in Google Sheets

**Example 1: Movie Review with Trailer**
```
Dune: Part Two is a masterpiece! Denis Villeneuve has outdone himself.

[image]https://res.cloudinary.com/demo/dune2-poster.jpg[/image]

The cinematography is breathtaking. Every frame is a work of art. Timothée Chalamet and Zendaya deliver powerful performances.

[youtube]https://www.youtube.com/watch?v=DUNE_TRAILER[/youtube]

Rating: ⭐⭐⭐⭐⭐ 5/5 stars
```

**Example 2: Celebrity Event Coverage**
```
## Red Carpet Highlights from the Oscars

Last night's Academy Awards ceremony was filled with stunning fashion moments.

[gallery]
https://res.cloudinary.com/demo/oscars1.jpg
https://res.cloudinary.com/demo/oscars2.jpg
https://res.cloudinary.com/demo/oscars3.jpg
[/gallery]

Emma Stone won Best Actress for her role in Poor Things.

[instagram]https://www.instagram.com/p/OSCARS_POST/[/instagram]
```

---

## ✅ Quick Reference

| Media Type | Tag | Example |
|-----------|-----|---------|
| Single Image | `[image]URL[/image]` | `[image]https://...[/image]` |
| Gallery | `[gallery]URL1 URL2[/gallery]` | `[gallery]https://... https://...[/gallery]` |
| YouTube | `[youtube]URL[/youtube]` | `[youtube]https://youtube.com/watch?v=...[/youtube]` |
| Instagram | `[instagram]URL[/instagram]` | `[instagram]https://instagram.com/p/...[/instagram]` |

---

**Happy blogging!** 🎬✨
