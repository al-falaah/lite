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
// Classify a block by which script dominates its text.
//   'ar'      — Arabic strongly dominant (RTL, right-aligned)
//   'en'      — Latin present and Arabic does not dominate (LTR, left-aligned)
//   'neutral' — not enough of either script to decide (leave as authored)
const classifyDirection = (text) => {
  if (!text) return 'neutral';
  const arabicCount = (text.match(ARABIC_LETTERS) || []).length;
  const latinCount = (text.match(LATIN_LETTERS) || []).length;
  if (arabicCount < 3 && latinCount < 3) return 'neutral';
  // Arabic must STRONGLY dominate (>2× Latin) to read as an Arabic block.
  if (arabicCount >= 3 && arabicCount > latinCount * 2) return 'ar';
  // Otherwise, any meaningful Latin presence reads as an English-led (mixed) line.
  if (latinCount >= 3) return 'en';
  return 'neutral';
};

// Back-compat export (unused internally now).
const isArabicDominant = (text) => classifyDirection(text) === 'ar';

/**
 * Direction for a plain text string (e.g. a chapter title rendered outside the
 * HTML-processing pipeline). 'rtl' only when Arabic strongly dominates; mixed
 * "English — Arabic" titles resolve to 'ltr' so they left-align instead of
 * being pushed right by the browser's bidi auto-detection.
 */
export const textDir = (text) => (classifyDirection(text) === 'ar' ? 'rtl' : 'ltr');

/**
 * Normalise text direction across a lesson's blocks by ACTUAL script balance,
 * overriding whatever `dir` an author happened to type. Per product rule:
 * whichever script dominates a line decides its direction — English-dominant
 * (and mixed "Arabic-term — English-gloss") lines read left-to-right and
 * left-aligned; Arabic-dominant lines read right-to-left and right-aligned.
 *
 * Rationale: a lot of authored content carries dir="rtl" on headings/cells
 * that are actually English-led (e.g. «المُثَنَّى — The Dual…»), which wrongly
 * right-aligns the whole line. We correct those at render time so the
 * dominant script wins; authors keep control by writing content that is
 * actually Arabic- or English-dominant. Elements the author explicitly styles
 * with a class are left untouched (verse/tip/etc. own their direction).
 *
 * Inline Arabic terms inside an English line still render correctly: they sit
 * in the browser's bidi algorithm and, where authored, their own dir="rtl"
 * spans are preserved.
 */
export const processContentForRTL = (htmlContent) => {
  if (!htmlContent) return htmlContent;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    // Table cells are deliberately excluded: many carry author-tuned
    // text-align/dir that a blanket override would wrongly clobber (verified
    // against real content — far more intentional cell alignment than
    // mis-aligned cells). The reported problem is headings/paragraphs.
    const elements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, div:not(.verse):not(.tip):not(.references)');

    elements.forEach((el) => {
      // Author explicitly styled this element with a class — leave it alone.
      if (el.classList.length > 0) return;

      const dir = classifyDirection(el.textContent);
      if (dir === 'neutral') return;

      // The author's explicit alignment (e.g. from the editor's align buttons)
      // ALWAYS wins over script-based auto-detection. We only fill alignment in
      // when they didn't choose one — auto-detect sets direction, not the
      // author's deliberate layout.
      const authoredAlign = el.style.textAlign;

      if (dir === 'ar') {
        el.setAttribute('dir', 'rtl');
        el.style.direction = 'rtl';
        if (!authoredAlign) el.style.textAlign = 'right';
        el.style.unicodeBidi = 'embed';
        el.style.fontFamily = "'Amiri Quran', 'Traditional Arabic', 'Arabic Typesetting', serif";
        el.style.fontSize = '1.25rem';
        el.style.lineHeight = '2';
      } else {
        // English-led / mixed: correct any authored RTL back to LTR. Only
        // force left-alignment when the author didn't set one deliberately
        // (a centered/right heading keeps its chosen alignment).
        el.setAttribute('dir', 'ltr');
        el.style.direction = 'ltr';
        el.style.unicodeBidi = 'isolate';
        // Only default to left when the author set no explicit alignment. An
        // explicit align (left/center/right from the editor) is respected —
        // the old wrong right-alignment came from dir="rtl" with NO text-align,
        // which this branch now neutralizes by switching dir to ltr.
        if (!authoredAlign) {
          el.style.textAlign = 'left';
        }
      }
    });

    return doc.body.innerHTML;
  } catch {
    return htmlContent;
  }
};
