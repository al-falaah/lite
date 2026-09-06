import { Helmet } from 'react-helmet-async';
import { SITE_URL, OG_IMAGE, SITE_NAME, webApplicationLd, breadcrumbLd } from '../../utils/toolsSeo';

/**
 * Full SEO head for a public /tools page: canonical (self-referential — fixes
 * the inherited canonical→/ ), Open Graph, Twitter card, and WebApplication +
 * BreadcrumbList JSON-LD. Mirrors the blog's SEO pattern (BlogPost.jsx).
 *
 *   <ToolSeo path="/tools/roots" title="Tasreef — Root Word Explorer | The FastTrack Madrasah"
 *            name="Tasreef — Root Word Explorer" description="…" />
 *
 * `title` is the full <title>; `name` is the short tool name for OG/JSON-LD.
 */
export default function ToolSeo({ path, title, name, description }) {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_NZ" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
      <meta name="twitter:site" content="@tftmadrasah" />

      {/* Structured data */}
      <script type="application/ld+json">
        {JSON.stringify(webApplicationLd({ name, path, description }))}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Tools', path: '/tools' },
          ...(path === '/tools' ? [] : [{ name, path }]),
        ]))}
      </script>
    </Helmet>
  );
}
