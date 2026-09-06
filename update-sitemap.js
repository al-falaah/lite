// Script to update sitemap.xml with published blog posts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSitemap() {
  console.log('Fetching published blog posts...');

  // Fetch published blog posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    process.exit(1);
  }

  console.log(`Found ${posts.length} published blog posts`);

  // Build sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">

${[
  // Public, indexable routes only. Private areas (student/teacher/admin/blog-admin)
  // are intentionally excluded (also Disallowed in robots.txt).
  { loc: '/', changefreq: 'weekly', priority: '1.0', label: 'Homepage' },
  { loc: '/programs', changefreq: 'monthly', priority: '0.9', label: 'Programs' },
  { loc: '/apply', changefreq: 'monthly', priority: '0.9', label: 'Application Page' },
  { loc: '/faqs', changefreq: 'monthly', priority: '0.8', label: 'FAQs' },
  { loc: '/blog', changefreq: 'daily', priority: '0.8', label: 'Blog Main Page' },
  { loc: '/store', changefreq: 'weekly', priority: '0.7', label: 'Store' },
  { loc: '/vacancies', changefreq: 'weekly', priority: '0.6', label: 'Vacancies/Careers' },
  // Free Qur'anic learning tools
  { loc: '/tools', changefreq: 'monthly', priority: '0.8', label: 'Tools — home' },
  { loc: '/tools/examples', changefreq: 'monthly', priority: '0.8', label: 'Tools — Shawaahid' },
  { loc: '/tools/roots', changefreq: 'monthly', priority: '0.8', label: 'Tools — Tasreef' },
  { loc: '/tools/arabiyyah', changefreq: 'monthly', priority: '0.8', label: 'Tools — Arabiyyah Workbench' },
  { loc: '/tools/pages', changefreq: 'monthly', priority: '0.8', label: 'Tools — Safha' },
].map(r => `  <!-- ${r.label} -->
  <url>
    <loc>https://tftmadrasah.nz${r.loc}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n\n')}

  <!-- Blog Posts -->
${posts.map(post => `  <url>
    <loc>https://tftmadrasah.nz/blog/${post.slug}</loc>
    <lastmod>${post.updated_at.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}

</urlset>
`;

  // Write sitemap to file
  const sitemapPath = path.join(__dirname, 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);

  console.log(`✅ Sitemap updated successfully with ${posts.length} blog posts`);
  console.log(`📝 Sitemap saved to: ${sitemapPath}`);
}

// Run the update
updateSitemap().catch(error => {
  console.error('Failed to update sitemap:', error);
  process.exit(1);
});
