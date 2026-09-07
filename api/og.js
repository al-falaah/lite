import fs from 'fs';
import path from 'path';

// Server-rendered per-route meta for social scrapers (WhatsApp, Facebook,
// Twitter/X, LinkedIn, iMessage) that don't run JS. Vercel rewrites the public
// static routes to this handler (?path=/tools/roots …); it injects the right
// title/description/canonical/OG into dist/index.html and serves the full SPA
// (which still hydrates normally). Blog posts have their own handler
// (api/blog/[slug].js) — this covers the static routes.
//
// Copy is kept identical to each page's react-helmet values (single source of
// truth) so server and client agree and there are no conflicting tags.

const SITE = 'https://tftmadrasah.nz';
const OG_IMAGE = `${SITE}/og-image.png`;

const META = {
  '/': {
    title: "Learn to Read & Understand the Qur'an | Islamic School NZ | The FastTrack Madrasah",
    description: "Online Qur'anic education for everyone. QARI program for absolute beginners and new Muslims. Tajweed Mastery for proper recitation. EASI for Arabic grammar and Islamic sciences. Structured, time-bound programs with dedicated mentorship in New Zealand.",
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

export default function handler(req, res) {
  try {
    const raw = (req.query && req.query.path) || req.url || '/';
    const routePath = normalizePath(Array.isArray(raw) ? raw[0] : raw);
    const meta = META[routePath] || META['/'];
    const url = `${SITE}${routePath === '/' ? '/' : routePath}`;

    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf-8');

    // Strip any existing per-route-able tags so ours are the single source.
    html = html.replace(/<title>[\s\S]*?<\/title>/i, '');
    html = html.replace(/<meta\s+name="description"[^>]*>\s*/gi, '');
    html = html.replace(/<meta\s+property="og:(?:title|description|url|type)"[^>]*>\s*/gi, '');
    html = html.replace(/<meta\s+name="twitter:(?:title|description)"[^>]*>\s*/gi, '');
    html = html.replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');

    const tags = `
    <title>${esc(meta.title)}</title>
    <meta name="description" content="${esc(meta.description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(meta.title)}" />
    <meta property="og:description" content="${esc(meta.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="1200" />
    <meta property="og:site_name" content="The FastTrack Madrasah" />
    <meta property="og:locale" content="en_NZ" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(meta.title)}" />
    <meta name="twitter:description" content="${esc(meta.description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
`;
    html = html.replace('</head>', `${tags}  </head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
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
