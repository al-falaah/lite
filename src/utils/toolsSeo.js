// SEO helpers for the public /tools pages. Data-only: pages render the tags
// (via react-helmet). Keeps canonical/OG/JSON-LD consistent across tools
// instead of copy-pasting per page.

export const SITE_URL = 'https://tftmadrasah.nz';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const SITE_NAME = 'The FastTrack Madrasah';

const PUBLISHER = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: OG_IMAGE,
};

// A free, browser-based educational tool.
export function webApplicationLd({ name, path, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url: `${SITE_URL}${path}`,
    description,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any (web browser)',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'NZD' },
    inLanguage: ['en', 'ar'],
    publisher: PUBLISHER,
  };
}

// Home › Tools › <Tool>. `trail` is [{ name, path }, …] in order.
export function breadcrumbLd(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
