# Google Sheets Integration Guide

## 📊 Required Format

Your Google Sheet must follow this **exact column order**:

| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Category | Title | Description | Image URL | Date | Status |

## 📝 Column Details

### Row 1: Header Row (Required)
```
Category | Title | Description | Image URL | Date | Status
```
**Note**: The header row is required and will be skipped during import.

### Data Rows (Row 2 onwards)

#### Column A: Category (Required)
**Format**: Text
**Valid Values**:
- `Hollywood Movies` or `hollywood-movies`
- `Hollywood News` or `hollywood-news`
- `Bollywood Movies` or `bollywood-movies`
- `Bollywood News` or `bollywood-news`
- `OTT` or `ott`
- `Music` or `music`
- `Celebrity Style` or `celebrity-style`
- `International` or `international`
- `YouTube Scripts` or `youtube-scripts`

**Note**: The system will automatically convert spaces to hyphens and make lowercase.

**Examples**:
```
Hollywood Movies  → hollywood-movies
Bollywood News    → bollywood-news
OTT               → ott
```

#### Column B: Title (Required)
**Format**: Text
**Max Length**: Recommended 100-200 characters

**Examples**:
```
Inception - A Mind-Bending Thriller
Top 10 Bollywood Movies of 2024
Why OTT is Changing Cinema
```

#### Column C: Description (Required)
**Format**: Text (multi-line allowed)
**Length**: Can be full article content

**Tips**:
- This is your article content/body
- Can include line breaks (they'll be preserved)
- Can include special characters
- Quotes will be automatically escaped

**Example**:
```
Inception is a 2010 science fiction thriller directed by Christopher Nolan.
The film follows Dom Cobb, a skilled thief who steals secrets from deep
within the subconscious during the dream state. Leonardo DiCaprio delivers
an outstanding performance...
```

#### Column D: Image URL (Required)
**Format**: Full URL starting with `http://` or `https://`

**Examples**:
```
https://example.com/images/inception.jpg
https://cdn.example.com/movie-posters/inception.png
```

**Tips**:
- Use direct image URLs (not Google Drive share links)
- Recommended formats: JPG, PNG, WebP
- Ensure images are publicly accessible
- For best results, use images at least 800x600px

#### Column E: Date (Optional)
**Format**: `YYYY-MM-DD` (ISO 8601)

**Examples**:
```
2024-11-27
2024-01-15
2023-12-31
```

**If empty**: Current date will be used automatically

#### Column F: Status (Optional)
**Format**: Text
**Valid Values**:
- `published` - Article will appear on website
- `draft` - Article will be hidden

**If empty**: Defaults to `draft`

**Note**: Case-insensitive (PUBLISHED, Published, published all work)

## 📋 Example Google Sheet

### Sample Data

| Category | Title | Description | Image URL | Date | Status |
|----------|-------|-------------|-----------|------|--------|
| **Header** | **⬇️ Data starts below** | | | | |
| Hollywood Movies | Inception Review | Inception is a mind-bending thriller directed by Christopher Nolan. The film explores dreams within dreams... | https://example.com/inception.jpg | 2024-11-27 | published |
| Bollywood Movies | Jawan Movie Review | Shah Rukh Khan returns with an action-packed entertainer. The film directed by Atlee... | https://example.com/jawan.jpg | 2024-11-20 | published |
| OTT | Top 10 Netflix Shows 2024 | Here are the must-watch Netflix shows this year... | https://example.com/netflix.jpg | 2024-11-15 | published |
| Hollywood News | Oscar Nominations 2024 | The Academy has announced the nominations for the 96th Oscars... | https://example.com/oscars.jpg | 2024-11-10 | draft |

## 🔗 How to Set Up Your Google Sheet

### Step 1: Create the Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it (e.g., "CineChatter Articles")

### Step 2: Set Up Columns
1. **Row 1** - Add headers:
   ```
   A1: Category
   B1: Title
   C1: Description
   D1: Image URL
   E1: Date
   F1: Status
   ```

2. **Row 2 onwards** - Add your article data

### Step 3: Publish the Sheet
**Option A: Publish to Web (Recommended)**
1. Click `File` → `Share` → `Publish to web`
2. Choose:
   - **Entire Document** or specific sheet
   - **Comma-separated values (.csv)**
3. Click `Publish`
4. Copy the generated URL
5. Use this URL in CineChatter

**Option B: Share with Link**
1. Click `Share` button (top-right)
2. Under "General access" → Select `Anyone with the link`
3. Set permission to `Viewer`
4. Copy the share link
5. Use this URL in CineChatter

### Step 4: Connect to CineChatter
1. Open CineChatter admin panel
2. Go to **Integration Settings**
3. Paste your Google Sheet URL
4. Click **Test Connection**
5. If successful, set **Data Source** to:
   - `Sheets Only` - Use only Google Sheets articles
   - `Both` - Use both admin articles and Google Sheets
   - `Admin Only` - Disable Google Sheets

## ✅ Validation Rules

### Required Fields
- ❌ Missing Category → Row will be **skipped**
- ❌ Missing Title → Row will be **skipped**
- ✅ Missing Description → Empty content (not recommended)
- ✅ Missing Image URL → No image shown
- ✅ Missing Date → Uses current date
- ✅ Missing Status → Defaults to `draft`

### Data Cleaning
The system automatically:
- Trims whitespace from all fields
- Converts category to lowercase with hyphens
- Removes empty rows
- Escapes special characters in text

## 🚨 Common Issues & Solutions

### Issue 1: "Sheet appears empty"
**Cause**: Sheet has only headers or no data rows
**Solution**: Add at least one data row with Category and Title

### Issue 2: Articles not showing
**Cause**: Status is `draft` or Data Source is set to `Admin Only`
**Solution**:
- Set Status column to `published`
- Set Data Source to `Sheets Only` or `Both`

### Issue 3: "Connection failed"
**Causes**:
- Sheet is not published or shared
- Wrong URL format
- Sheet is private

**Solutions**:
- Ensure sheet is published to web as CSV
- Use the full Google Sheets URL
- Check sharing settings (must be public or "Anyone with link")

### Issue 4: Categories not working
**Cause**: Invalid category name
**Solution**: Use only valid category names (see Column A above)

### Issue 5: Images not loading
**Causes**:
- Image URL is not publicly accessible
- Using Google Drive share links instead of direct URLs
- URL format is incorrect

**Solutions**:
- Use direct image URLs (must end in .jpg, .png, etc.)
- Host images on public CDN or image hosting service
- Ensure URL starts with `https://`

## 📥 CSV Export Format

When you export articles from CineChatter, the CSV will have this format:

```csv
Category,Title,Description,Image URL,Date
"hollywood-movies","Inception Review","Full article content here...","https://...","2024-11-27"
```

**Tips**:
- You can export from CineChatter and import to Google Sheets
- You can also export from Google Sheets and import to CineChatter
- Format is compatible both ways

## 🔄 Updating Articles

### Real-time Updates
Articles from Google Sheets are fetched when:
1. You click **Test Connection**
2. You click **Refresh** (if connection is active)
3. You change the Data Source setting
4. Page is refreshed (if sheets are enabled)

### To Update Articles
1. Edit your Google Sheet
2. Go to CineChatter admin
3. Click **Refresh** button in Integration Settings
4. Changes will appear immediately

## 💡 Best Practices

### 1. Data Organization
✅ **DO**:
- Keep one article per row
- Use consistent category naming
- Fill all required fields
- Use high-quality images
- Set meaningful dates

❌ **DON'T**:
- Leave Category or Title empty
- Mix different formats in same column
- Use local file paths for images
- Add extra columns between A-F

### 2. Content Quality
- Write clear, engaging titles
- Provide complete article content in Description
- Use proper grammar and formatting
- Include relevant, high-quality images

### 3. Publishing Workflow
1. Add articles with Status = `draft`
2. Review content in CineChatter
3. Edit sheet to change Status to `published`
4. Refresh in CineChatter
5. Articles go live!

## 📊 Sample Template

Copy this template to get started:

```
Category,Title,Description,Image URL,Date,Status
Hollywood Movies,Sample Movie Review,"This is a sample article content. Replace with your actual review...",https://via.placeholder.com/800x600,2024-11-27,published
Bollywood News,Sample News Article,"This is sample news content. Replace with actual news...",https://via.placeholder.com/800x600,2024-11-27,draft
```

## 🎯 Quick Checklist

Before connecting your sheet, verify:

- [ ] Row 1 has headers (Category, Title, Description, Image URL, Date, Status)
- [ ] At least one data row exists
- [ ] Category column uses valid category names
- [ ] Title column is filled for all rows
- [ ] Image URLs are publicly accessible
- [ ] Sheet is published to web as CSV OR shared with "Anyone with link"
- [ ] Copied the correct Google Sheets URL
- [ ] Status is set to `published` for visible articles

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for error messages
2. Verify sheet format matches this guide exactly
3. Test with sample data first
4. Ensure sheet is properly published/shared

---

**Last Updated**: 2024-11-27
**Compatible With**: CineChatter v1.0.0+
