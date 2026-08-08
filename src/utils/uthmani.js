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

// --- Arabic skeleton for reference verification --------------------------
//
// To confirm a pasted āyah against the corpus we compare *skeletons*: the
// bare letter sequence with every combining mark, tanwīn, and orthographic
// nicety removed, so the fully-vowelled ʿUthmānī form and the diacritic-free
// imlāʾī form collapse to the same string. This is what lets an author paste
// a vowelled āyah and have it match `quran_ayah_ref.ayah_imlai`.
//
// IMPORTANT: the mark set is built as an EXPLICIT codepoint Set (looped over
// exact ranges), NOT a regex character class. Character-class ranges like
// /[ؐ-ٟ]/ have repeatedly mis-matched base letters here and returned empty
// skeletons — the explicit Set is the version that works.

const MARKSET = (() => {
  const s = new Set();
  const add = (from, to) => { for (let c = from; c <= (to ?? from); c++) s.add(c); };
  add(0x0610, 0x061a); // Arabic sign / honorific marks
  add(0x064b, 0x065f); // fatḥatān…kasratān, sukūn, shadda, QCF tanwīn variants
  add(0x06d6, 0x06ed); // small high/low Qurʾānic annotation marks
  add(0x0640);          // taṭwīl (kashīda)
  add(0x06e5, 0x06e6); // small waw / small yaa
  // NOTE: U+0670 (dagger alif) is deliberately NOT stripped here — it stands
  // in for an omitted alif in ʿUthmānī spelling (e.g. عَٰبِدُونَ), whereas the
  // imlāʾī form writes a full ا (عابدون). It is folded to ا in LETTER_FOLD so
  // the two skeletons match.
  return s;
})();

// Letters whose orthographic variants must be folded so skeletons match
// regardless of hamza seat, alif form, or final-yaa/hamza/taa spelling.
const LETTER_FOLD = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', // hamza/madda/wasla alifs → bare alif
  'ٰ': 'ا', // U+0670 dagger alif → full alif (ʿUthmānī omits the alif; imlāʾī writes it)
  'ؤ': 'و',
  'ئ': 'ي', 'ى': 'ي', // alif maqṣūra → yaa
  'ة': 'ه', // taa marbūṭa → haa
  'ﷲ': 'الله',
};

/**
 * Reduce Arabic text to a comparable skeleton: strip all combining marks,
 * fold orthographic letter variants, drop tatweel/space runs. Used only for
 * equality checks in reference verification — never for display.
 *
 * @param {string} s
 * @returns {string}
 */
export function skeletonArabic(s) {
  if (!s) return '';
  let out = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (MARKSET.has(cp)) continue;
    if (ch === ' ' || ch === ' ') { out += ' '; continue; }
    out += LETTER_FOLD[ch] || ch;
  }
  // collapse whitespace runs and trim
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Strip diacritics/marks only — no letter folding. Keeps exact letter forms
 * (hamza seats, alif variants), so it can be used as a SQL `ilike` probe that
 * matches raw imlāʾī text verbatim. (skeletonArabic folds letters, which makes
 * a probe like "اقرا" fail to ilike-match the stored "اقرأ".)
 * @param {string} s
 * @returns {string}
 */
export function stripDiacritics(s) {
  if (!s) return '';
  let out = '';
  for (const ch of s) {
    if (MARKSET.has(ch.codePointAt(0))) continue;
    if (ch === ' ' || ch === ' ') { out += ' '; continue; }
    out += ch;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * True if a diacritic-stripped word contains no letter that skeletonArabic
 * would fold (no hamza seats, alif-madda/wasla, alif-maqṣūra, taa-marbūṭa,
 * dagger-alif). Such words are spelled identically across orthographies, so
 * they make safe ilike probes.
 * @param {string} word — already diacritic-stripped
 */
export function isFoldStable(word) {
  return skeletonArabic(word) === word;
}
