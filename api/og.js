import fs from 'fs';
import path from 'path';

// Server-rendered per-route meta for social scrapers (WhatsApp, Facebook,
// Twitter/X, LinkedIn, iMessage) that don't run JS. Vercel rewrites the public
// static routes AND blog posts to this handler (?path=/tools/roots,
// ?path=/blog/<slug> …); it injects the right title/description/canonical/OG
// into dist/index.html and serves the full SPA (which still hydrates normally).
//
// Blog posts use the post's own featured image as og:image, fetched from
// Supabase's REST API with the public anon key (published posts are publicly
// readable — the same request the BlogPost page makes in the browser).
//
// Static-route copy is kept identical to each page's react-helmet values
// (single source of truth) so server and client agree.

const SITE = 'https://www.tftmadrasah.nz';
const OG_IMAGE = `${SITE}/og-image.png`;

const META = {
  '/': {
    title: "Join our dedicated student body and master Qur'an, Tajwīd, Arabic, & Islamic sciences from anywhere in the world.",
    description: "A structured online madrasah that feels like a real physical class — live and self-paced classes, real teachers, and graded assessment. Based in New Zealand, open worldwide.",
  },
  '/programs': {
    title: 'Programs | The FastTrack Madrasah',
    description: "QARI (Qur'an reading from zero), Tajweed Mastery, and EASI (Arabic grammar & Islamic sciences) — structured, graded online programs with real teachers.",
  },
  '/apply': {
    title: 'Apply for the next intake | The FastTrack Madrasah',
    description: 'Submit an application to The FastTrack Madrasah and we will match you to the right program — QARI, Tajweed Mastery, or EASI.',
  },
  '/faqs': {
    title: 'FAQs | The FastTrack Madrasah',
    description: 'Answers on programs, admission, fees, and how classes run at The FastTrack Madrasah.',
  },
  '/mission': {
    title: 'Our Mission | The FastTrack Madrasah',
    description: 'Making traditional-madrasah subjects — Qur’an literacy, tajwīd, Arabic, and Islamic studies — genuinely engaging and easy to digest, online.',
  },
  '/store': {
    title: 'Store | The FastTrack Madrasah',
    description: 'Islamic learning materials and textbooks from The FastTrack Madrasah.',
  },
  '/vacancies': {
    title: 'Careers | The FastTrack Madrasah',
    description: 'Join the team at The FastTrack Madrasah — an online Islamic school based in Aotearoa New Zealand.',
  },
  '/tools': {
    title: "Free Qur'anic Learning Tools | The FastTrack Madrasah",
    description: "Free tools for studying tajweed, Arabic grammar, and Qur'anic morphology — Shawaahid (examples finder), Tasreef (root explorer), Arabiyyah Workbench, and Safha (page insights).",
  },
  '/tools/examples': {
    title: "Shawaahid — Qur'anic Examples Finder | The FastTrack Madrasah",
    description: "Search for any tajweed or Arabic grammar topic and see real Qur'anic examples with scholar-annotated references. Free tool by The FastTrack Madrasah.",
  },
  '/tools/roots': {
    title: 'Tasreef — Root Word Explorer | The FastTrack Madrasah',
    description: "Enter any Arabic word to discover its root, derived forms, verb patterns, and every Qur'anic occurrence. Free morphology tool by The FastTrack Madrasah.",
  },
  '/tools/arabiyyah': {
    title: "Arabiyyah Workbench — Qur'an examples by grammar topic | The FastTrack Madrasah",
    description: "Pick an Arabic grammar topic and find Qur'anic verses that demonstrate it, then tap any word to explore its root and its qirāʾāt (variant readings). Free tool by The FastTrack Madrasah.",
  },
  '/tools/pages': {
    title: "Safha — Qur'an Page Insights | The FastTrack Madrasah",
    description: "Browse scholar-curated benefits and lessons from every page of the Qur'an (604 pages) with English translation. Free tool by The FastTrack Madrasah.",
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function normalizePath(p) {
  if (!p) return '/';
  try { p = decodeURIComponent(p); } catch { /* keep as-is */ }
  p = p.split('?')[0].split('#')[0];
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

// Plain-text excerpt from HTML content, for descriptions.
function excerpt(html, length = 160) {
  const text = String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

// Fetch one published post by slug. Returns null if missing or on any error,
// so a lookup failure degrades to the default share card, never a broken page.
async function fetchPost(slug) {
  const base = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!base || !key || !slug) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const q = `slug=eq.${encodeURIComponent(slug)}&status=eq.published`
      + '&select=title,slug,excerpt,content,featured_image,published_at,author_name&limit=1';
    const r = await fetch(`${base}/rest/v1/blog_posts?${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Only absolute http(s) URLs work as og:image for scrapers.
const isAbsoluteUrl = (u) => /^https?:\/\//i.test(String(u || ''));

export default async function handler(req, res) {
  try {
    const raw = (req.query && req.query.path) || req.url || '/';
    const routePath = normalizePath(Array.isArray(raw) ? raw[0] : raw);
    const url = `${SITE}${routePath === '/' ? '/' : routePath}`;

    // Default (static route) meta.
    let title = (META[routePath] || META['/']).title;
    let description = (META[routePath] || META['/']).description;
    let image = OG_IMAGE;
    let imageIsDefault = true;
    let ogType = 'website';
    let articleTags = '';

    // Blog post: use the post's own title, excerpt and featured image.
    const blog = routePath.match(/^\/blog\/([^/]+)$/);
    if (blog) {
      const post = await fetchPost(blog[1]);
      if (post) {
        title = `${post.title} | The FastTrack Madrasah`;
        description = post.excerpt || excerpt(post.content) || description;
        ogType = 'article';
        if (isAbsoluteUrl(post.featured_image)) {
          image = post.featured_image;
          imageIsDefault = false;
        }
        if (post.published_at) articleTags += `    <meta property="article:published_time" content="${esc(post.published_at)}" />\n`;
        if (post.author_name) articleTags += `    <meta property="article:author" content="${esc(post.author_name)}" />\n`;
      }
    }

    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf-8');

    // Strip every existing per-route tag — including ALL og:/twitter:/article:
    // meta — so ours are the single source. (Leaving index.html's default
    // og:image in place would make scrapers like WhatsApp pick it first.)
    html = html.replace(/<title>[\s\S]*?<\/title>/i, '');
    html = html.replace(/<meta\s+name="description"[^>]*>\s*/gi, '');
    html = html.replace(/<meta\s+property="(?:og|article):[^"]*"[^>]*>\s*/gi, '');
    html = html.replace(/<meta\s+(?:name|property)="twitter:[^"]*"[^>]*>\s*/gi, '');
    html = html.replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');

    // The default share image is a known 1200×1200; a post's image size is
    // unknown, so its dimensions are omitted rather than misreported.
    const imageDims = imageIsDefault
      ? '    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="1200" />\n'
      : '';

    const tags = `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:secure_url" content="${esc(image)}" />
${imageDims}    <meta property="og:image:alt" content="${esc(title)}" />
    <meta property="og:site_name" content="The FastTrack Madrasah" />
    <meta property="og:locale" content="en_NZ" />
${articleTags}    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(image)}" />
`;
    html = html.replace('</head>', `${tags}  </head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch (err) {
    console.error('og handler error:', err);
    // Fall back to the plain SPA shell if anything goes wrong.
    try {
      const html = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(html);
    } catch {
      res.status(500).send('Internal server error');
    }
  }
}
