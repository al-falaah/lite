import { Fragment, useMemo } from 'react';

// Arabic script blocks (incl. presentation forms, which hold the ornate
// brackets ﴿ ﴾). A "run" is a stretch of Arabic letters/marks plus the spaces
// and Arabic punctuation inside it.
const ARABIC_RUN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+(?:[\s\u00A0]+[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)*/g;
// What marks a run as QUR'ANIC (vs ordinary vowelled Arabic such as grammar
// examples): it is quoted in ﴿ ﴾ (U+FD3E/FD3F), or written in ʿUthmānī
// orthography — alif waṣla (U+0671), dagger alif (U+0670), the mushaf's
// open/stacked tanwīn (U+0656/0657/065E), or the small high/low Qur'anic
// signs incl. the ʿUthmānī sukūn (U+06D6–06ED). Plain MSA vowelling alone
// (fatḥa, ḍamma, kasra, sukūn, shadda, tanwīn) is NOT enough.
const QURANIC = /[\uFD3E\uFD3F\u0671\u0670\u0656\u0657\u065E\u06D6-\u06ED]/;
// Bidi isolate controls some stored text already carries (RLI…PDI); <bdi>
// replaces them, so they are dropped to avoid double isolation.
const BIDI_CTRL = /[\u2066-\u2069]/g;

/**
 * QuranText — renders mixed English/Arabic text (quiz questions, options,
 * explanations, notes) so Qur'anic text looks like the mushaf.
 *
 *  - Qur'anic runs (﴿…﴾ quotations, or words in ʿUthmānī spelling) → KFGQPC
 *    Hafs (`font-quran`), slightly enlarged so marks are legible inline.
 *  - All other Arabic (grammar examples, labels, terms — vowelled or not) →
 *    the regular Arabic face (`font-arabic`).
 *  - Each Arabic run is wrapped in <bdi dir="rtl"> so it can never reorder
 *    the surrounding English sentence.
 *
 * Props:
 *  - text: the string to render.
 *  - quranClass: extra classes for the Qur'anic runs (size/colour).
 *  - className: classes for the wrapper.
 */
export default function QuranText({ text, quranClass = '', className = '' }) {
  const parts = useMemo(() => {
    const src = String(text ?? '').replace(BIDI_CTRL, '');
    const out = [];
    let last = 0;
    for (const m of src.matchAll(ARABIC_RUN)) {
      if (m.index > last) out.push({ t: 'text', v: src.slice(last, m.index) });
      out.push({ t: QURANIC.test(m[0]) ? 'quran' : 'arabic', v: m[0] });
      last = m.index + m[0].length;
    }
    if (last < src.length) out.push({ t: 'text', v: src.slice(last) });
    return out;
  }, [text]);

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.t === 'text' ? (
          <Fragment key={i}>{p.v}</Fragment>
        ) : (
          <bdi
            key={i}
            dir="rtl"
            lang="ar"
            className={p.t === 'quran' ? `font-quran text-[1.25em] leading-[1.9] ${quranClass}` : 'font-arabic'}
          >
            {p.v}
          </bdi>
        )
      )}
    </span>
  );
}
