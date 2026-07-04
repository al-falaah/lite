// Uthmani (QCF) → standard Arabic Unicode normalisation.
//
// The `quran_tajweed_aya` table stores the King Fahd Complex (QCF) Uthmani
// encoding of tanwīn using visually-styled codepoints in the U+0656-U+065F
// range. These codepoints are correct per the QCF specification but do NOT
// have glyphs in most freely-available Arabic fonts (including Amiri Quran
// as shipped by Google Fonts). Without normalisation, the marks render as
// nothing (or the wrong glyph) — silently changing the visible grammatical
// case of the word to students / readers.
//
// We map each QCF variant back to its standard Arabic tanwīn while
// PRESERVING the grammatical case (fatḥ / ḍamm / kasr):
//
//   U+0657 ٗ  (Inverted Damma)      → ً  U+064B  tanwīn fatḥ
//                                     (used with alif suffix, e.g. فَرِيقٗا → فَرِيقًا)
//   U+065E ٞ  (Fatha with Two Dots) → ٌ  U+064C  tanwīn ḍamm
//                                     (nominative, e.g. عَلِيمٞ → عَلِيمٌ)
//   U+0656 ٖ  (Subscript Alef)      → ٍ  U+064D  tanwīn kasr
//                                     (genitive, e.g. خَيۡرٖ → خَيۡرٍ)
//
// Only these three QCF marks appear in the corpus (verified across a 200-
// ayah sample). Getting the ḍamm/fatḥ/kasr mapping right matters — a wrong
// mapping would silently change the grammatical case shown to students.

const QCF_MAP = {
  'ٗ': 'ً', // ٗ  →  ً  tanwīn fatḥ
  'ٞ': 'ٌ', // ٞ  →  ٌ  tanwīn ḍamm
  'ٖ': 'ٍ', // ٖ  →  ٍ  tanwīn kasr
};

const QCF_REGEX = /[ٖٗٞ]/g;

/**
 * Normalise QCF Uthmani tanwīn codepoints to standard Arabic tanwīn.
 * Safe on strings that don't contain any QCF marks (no-op).
 *
 * @param {string} s
 * @returns {string}
 */
export function normalizeUthmani(s) {
  if (!s) return s;
  return s.replace(QCF_REGEX, (ch) => QCF_MAP[ch] || ch);
}
