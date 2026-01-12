# How to Update Sitemap When Publishing New Blog Articles

## Quick Reference

Every time you publish a new blog article, add this to `/public/sitemap.xml`:

```xml
<url>
  <loc>https://www.tftmadrasah.nz/blog/[ARTICLE-SLUG]</loc>
  <lastmod>YYYY-MM-DD</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

## Step-by-Step Instructions

### 1. Find Your Article Slug
When you create a blog post, note the slug. For example:
- Title: "The Importance of Daily Quran Reading"
- Slug: `importance-of-daily-quran-reading`

### 2. Open the Sitemap File
Location: `/public/sitemap.xml`

### 3. Add Your Article Entry
Find the `<!-- Blog Posts -->` section and add your new article:

```xml
<!-- Blog Posts -->
<url>
  <loc>https://www.tftmadrasah.nz/blog/why-do-hearts-harden</loc>
  <lastmod>2025-12-27</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>

<!-- ADD YOUR NEW ARTICLE HERE -->
<url>
  <loc>https://www.tftmadrasah.nz/blog/importance-of-daily-quran-reading</loc>
  <lastmod>2026-01-15</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

### 4. Update the Blog Page Date
Also update the main blog listing page date:

```xml
<!-- Blog Main Page -->
<url>
  <loc>https://www.tftmadrasah.nz/blog</loc>
  <lastmod>2026-01-15</lastmod> <!-- Update this to today's date -->
  <changefreq>daily</changefreq>
  <priority>0.8</priority>
</url>
```

### 5. Resubmit to Google Search Console
After updating:
1. Go to Google Search Console
2. Navigate to "Sitemaps"
3. Your sitemap will auto-refresh, or click "Fetch as Google"

---

## Date Format
Always use: `YYYY-MM-DD`
- ✅ Correct: `2026-01-15`
- ❌ Wrong: `15-01-2026` or `01/15/2026`

---

## Full Example

Here's what your sitemap section should look like with multiple articles:

```xml
<!-- Blog Posts -->
<url>
  <loc>https://www.tftmadrasah.nz/blog/why-do-hearts-harden</loc>
  <lastmod>2025-12-27</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>

<url>
  <loc>https://www.tftmadrasah.nz/blog/what-staying-connected-to-the-quran-means</loc>
  <lastmod>2025-12-19</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>

<url>
  <loc>https://www.tftmadrasah.nz/blog/benefits-of-learning-arabic</loc>
  <lastmod>2026-01-10</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

---

## Priority Levels (Reference)
- `1.0` - Homepage (most important)
- `0.9` - Apply page
- `0.8` - Blog main page
- `0.7` - Individual blog posts (use this)
- `0.6` - Secondary pages
- `0.3` - Low priority pages

---

## Automation (Future Enhancement)

If you want to automate this process, you would need to:
1. Create a server-side endpoint that queries Supabase
2. Generate the sitemap XML dynamically
3. Serve it at `/sitemap.xml`

This requires backend infrastructure (Node.js server, Netlify Functions, etc.)

For now, manual updates work perfectly fine!
