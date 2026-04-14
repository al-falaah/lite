const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export const hasArabic = (text) => ARABIC_REGEX.test(text);

/**
 * Process HTML content to auto-detect Arabic text and apply RTL direction.
 * Works on paragraph-level elements — if the text content contains Arabic,
 * it gets dir="rtl", right-alignment, and Amiri font.
 */
export const processContentForRTL = (htmlContent) => {
  if (!htmlContent) return htmlContent;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const elements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, div:not(.verse):not(.tip):not(.references)');

    elements.forEach((el) => {
      // Skip elements that already have explicit direction set
      if (el.getAttribute('dir')) return;
      // Skip elements with class (likely intentionally styled)
      if (el.classList.length > 0) return;

      if (hasArabic(el.textContent)) {
        el.setAttribute('dir', 'rtl');
        el.style.direction = 'rtl';
        el.style.textAlign = 'right';
        el.style.unicodeBidi = 'embed';
        el.style.fontFamily = "'Amiri Quran', 'Traditional Arabic', 'Arabic Typesetting', serif";
        el.style.fontSize = '1.25rem';
        el.style.lineHeight = '2';
      }
    });

    return doc.body.innerHTML;
  } catch {
    return htmlContent;
  }
};
