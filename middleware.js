import { createClient } from '@supabase/supabase-js';

export const config = {
  matcher: '/blog/:slug*',
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const slug = url.pathname.split('/blog/')[1];

  // Only handle blog post pages (not /blog or /blog/admin)
  if (!slug || slug === '' || slug === 'admin') {
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return;
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
      return;
    }

    // Generate excerpt
    const getExcerpt = (content, length = 160) => {
      if (!content) return '';
      const text = content.replace(/<[^>]*>/g, '').trim();
      return text.length > length ? text.substring(0, length) + '...' : text;
    };

    const siteUrl = url.origin;
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    const imageUrl = post.featured_image || `${siteUrl}/favicon.png`;
    const description = post.excerpt || getExcerpt(post.content);

    // Inject OG meta tags into the HTML
    const response = await fetch(`${url.origin}/index.html`);
    let html = await response.text();

    // Replace the default meta tags with blog-specific ones
    const ogTags = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${post.title} | The FastTrack Madrasah Blog" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${postUrl}" />
    <meta property="og:site_name" content="The FastTrack Madrasah" />
    <meta property="article:published_time" content="${post.published_at}" />
    <meta property="article:author" content="${post.author_name}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${post.title}" />
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="description" content="${description.replace(/"/g, '&quot;')}" />
    <title>${post.title} | The FastTrack Madrasah Blog</title>
`;

    // Insert OG tags into <head>
    html = html.replace('</head>', `${ogTags}\n  </head>`);

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    });
  } catch (error) {
    console.error('Middleware error:', error);
    return;
  }
}
