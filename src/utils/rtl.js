// Any Arabic character (for the public hasArabic helper)
const ARABIC_REGEX = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
// Base Arabic letters only — excludes combining diacritics (fatḥah, kasrah,
// ḍammah, sukūn, shaddah, etc.), Qur'ānic annotations, and tatweel. We need
// "letters" not "code points" because a single Arabic word can carry many
// diacritics that inflate a naive character count.
const ARABIC_LETTERS = /[ء-يٱ-ۓۺ-ۿﭐ-﷿ﹰ-ﻼ]/g;
const LATIN_LETTERS = /[A-Za-z]/g;

export const hasArabic = (text) => ARABIC_REGEX.test(text);

/**
 * Decide whether a block's text is Arabic-dominant enough to flip to RTL.
 *
 * An English paragraph that mentions Arabic terms inline (e.g. "The الهَمْزَة
 * is distinguished by الجَهْر and الشِّدَّة") is semantically LTR even if its
 * Arabic letter count is high — those inline Arabic words are rendered by
 * their own dir="rtl" spans and the surrounding English narrative reads
 * left-to-right.
 *
 * We only flip when Arabic letters STRONGLY dominate the block (more than
 * 2× the Latin letter count). This keeps pure Arabic blocks RTL while
 * leaving English-narrative-with-Arabic-terms alone.
 */
const isArabicDominant = (text) => {
  if (!text) return false;
  const arabicCount = (text.match(ARABIC_LETTERS) || []).length;
  const latinCount = (text.match(LATIN_LETTERS) || []).length;
  if (arabicCount < 3) return false;
  return arabicCount > latinCount * 2;
};

/**
 * Process HTML content to auto-detect Arabic text and apply RTL direction
 * only to elements that are predominantly Arabic. Mixed-direction paragraphs
 * (mostly English with inline Arabic spans) are left LTR — the inline spans
 * still render correctly because they carry their own dir="rtl" attribute.
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

      if (isArabicDominant(el.textContent)) {
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
