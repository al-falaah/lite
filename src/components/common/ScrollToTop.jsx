import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to top on every route change — and to the #hash target when the
 * URL has one. Placed inside <Router> so useLocation() works.
 *
 * Fixes the default react-router behaviour where navigating to a new route
 * keeps the previous page's scroll position.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Wait a tick for the target page to render, then scroll to the anchor.
      // Targets may exist twice (mobile + desktop variants) as data-anchor
      // attributes — scroll to the first visible one; fall back to plain id.
      const id = hash.slice(1);
      requestAnimationFrame(() => {
        const candidates = [
          ...document.querySelectorAll(`[data-anchor="${id}"]`),
          document.getElementById(id),
        ].filter(Boolean);
        const el = candidates.find((c) => c.offsetParent !== null) || candidates[0];
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
        } else {
          window.scrollTo(0, 0);
        }
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
