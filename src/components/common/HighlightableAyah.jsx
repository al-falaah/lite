import { useMemo, useState } from 'react';
import { normalizeArabic } from '../../utils/uthmani';
import { toArabicDigits } from '../../utils/quran';

/** Which word indices of `words` match any of the reference phrases in `refs`. */
function matchWordIndices(words, refs) {
  const flags = new Set();
  if (!refs || !refs.length) return flags;
  const refNorms = refs.map((r) => normalizeArabic(r)).filter(Boolean);
  for (const refNorm of refNorms) {
    const refWords = refNorm.split(/\s+/).filter(Boolean);
    if (!refWords.length) continue;
    for (let i = 0; i < words.length; i++) {
      let wi = 0, idx = i;
      const matched = [];
      while (idx < words.length && wi < refWords.length) {
        const wNorm = normalizeArabic(words[idx]);
        if (wNorm === refWords[wi] || wNorm.replace(/^[وفبلك]/, '') === refWords[wi]) {
          matched.push(idx); wi++; idx++;
        } else break;
      }
      if (wi === refWords.length) matched.forEach((mi) => flags.add(mi));
    }
  }
  return flags;
}

/**
 * HighlightableAyah — renders a Qur'anic ayah word-by-word in the KFGQPC Hafs
 * mushaf font (`font-quran`), using the corpus text exactly as stored,
 * where each word is tappable to toggle a maroon highlight (the same
 * interaction as the Tajweed Test Runner's present mode).
 *
 * Reusable across the tools so every ayah result reads and behaves the same.
 *
 * Props:
 *  - text: the ayah text (QCF/Uthmani, shown un-normalised — KFGQPC renders
 *      its open/stacked tanween and small Qur'anic marks as in the mushaf).
 *  - matchRefs: optional string[] of reference phrases (e.g. the tajweed
 *      pattern) — the matching words are pre-highlighted in a soft tint,
 *      shown UNDER the user's click highlight. Click highlight always wins.
 *  - size: tailwind text-size classes for the Arabic (default reader size).
 *  - hint: show the "tap to highlight" hint line (default true).
 *  - className: extra classes on the wrapper.
 *  - ayahNumber: optional — appends the mushaf end-of-āyah medallion.
 */
export default function HighlightableAyah({
  text,
  matchRefs,
  size = 'text-2xl sm:text-3xl',
  hint = true,
  className = '',
  ayahNumber,
}) {
  const [picked, setPicked] = useState(() => new Set());

  const words = useMemo(() => {
    if (!text) return [];
    return String(text).trim().split(/\s+/).filter(Boolean);
  }, [text]);

  const autoSet = useMemo(() => matchWordIndices(words, matchRefs), [words, matchRefs]);
  const isAuto = (i) => autoSet.has(i);

  const toggle = (i) =>
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  if (!words.length) return null;

  return (
    <div className={className}>
      <div
        dir="rtl"
        lang="ar"
        className={`font-quran ${size} text-gray-900 text-center select-none`}
        style={{ lineHeight: '2.4' }}
      >
        {words.map((w, i) => {
          const on = picked.has(i);
          const auto = !on && isAuto(i);
          return (
            <span
              key={i}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              onClick={() => toggle(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); }
              }}
              className={`inline-block px-1.5 py-0.5 mx-0.5 rounded cursor-pointer transition-colors ${
                on
                  ? 'bg-wine-200 text-wine-900'
                  : auto
                    ? 'bg-wine-50 text-wine-800 hover:bg-wine-100'
                    : 'hover:bg-wine-50'
              }`}
            >
              {w}
            </span>
          );
        })}
        {ayahNumber ? (
          <span className="inline-block mx-1 text-wine-700" aria-label={`āyah ${ayahNumber}`}>
            {toArabicDigits(ayahNumber)}
          </span>
        ) : null}
      </div>
      {hint && (
        <p className="text-center text-[11px] text-gray-400 mt-3">
          Tap any word to highlight it. Tap again to clear.
        </p>
      )}
    </div>
  );
}
