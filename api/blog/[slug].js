import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { slug } = req.query;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).send('Server configuration error');
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch blog post data
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      // Redirect to main blog page if post not found
      return res.redirect(307, '/blog');
    }

    // Generate excerpt
    const getExcerpt = (content, length = 160) => {
      if (!content) return '';
      const text = content.replace(/<[^>]*>/g, '').trim();
      return text.length > length ? text.substring(0, length) + '...' : text;
    };

    const siteUrl = `https://${req.headers.host}`;
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    const imageUrl = post.featured_image || `${siteUrl}/favicon.png`;
    const description = post.excerpt || getExcerpt(post.content);

    // Read the index.html file
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf-8');

    // Remove the entire commented-out OG and Twitter sections
    html = html.replace(/<!-- Open Graph \/ Facebook -->[\s\S]*?-->/g, '');
    html = html.replace(/<!-- Twitter -->[\s\S]*?-->/g, '');

    // Also remove any uncommented OG/Twitter tags (just in case)
    html = html.replace(/<meta property="og:[^"]*"[^>]*>\s*/g, '');
    html = html.replace(/<meta property="twitter:[^"]*"[^>]*>\s*/g, '');
    html = html.replace(/<meta name="twitter:[^"]*"[^>]*>\s*/g, '');
    html = html.replace(/<meta property="article:[^"]*"[^>]*>\s*/g, '');

    // Inject OG meta tags
    const ogTags = `
    <title>${post.title.replace(/"/g, '&quot;')} | The FastTrack Madrasah Blog</title>
    <meta name="description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${post.title.replace(/"/g, '&quot;')} | The FastTrack Madrasah Blog" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${postUrl}" />
    <meta property="og:site_name" content="The FastTrack Madrasah" />
    <meta property="article:published_time" content="${post.published_at}" />
    <meta property="article:author" content="${post.author_name.replace(/"/g, '&quot;')}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${post.title.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${imageUrl}" />
`;

    // Insert OG tags before </head>
    html = html.replace('</head>', `${ogTags}\n  </head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in blog handler:', error);
    res.status(500).send('Internal server error');
  }
}
