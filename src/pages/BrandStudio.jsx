import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, Image as ImageIcon, BookOpen } from 'lucide-react';
import VersePicker from '../components/common/VersePicker';

/*
 * Brand Studio — a lightweight Canva-style branded-image generator for the
 * marketing team. Pick a LAYOUT (quote, āyah, āyah+tafsīr, term, announcement),
 * a PALETTE (colour scheme), and a SIZE, fill in the fields, and download a PNG
 * rendered client-side via html2canvas-pro (same engine the certificates use).
 * Everything stays in the FastTrack Madrasah maroon / cream / gold brand.
 *
 * Two orthogonal axes:
 *   - LAYOUT decides which fields exist and how they're arranged.
 *   - PALETTE decides the colours; any palette works with any layout.
 */

const LOGO = '/tftmadrasah-logo-wine.svg';
const LOGO_WHITE = '/tftmadrasah-logo-white.svg';
// Clean single-colour brand marks used as the tiled watermark texture.
const MARK_WINE = '/brand-mark-wine.svg';
const MARK_WHITE = '/favicon-white.svg';
const SITE = 'WWW.TFTMADRASAH.COM';

const AR = "'Amiri', serif";
const ARQ = "'Amiri Quran', 'Amiri', serif";

// Shared professional field styling — soft border, quiet hover, a calm wine
// focus ring, and 16px text on mobile (denser on ≥sm) so iOS never zooms.
const INPUT =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 sm:py-2 text-base sm:text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors hover:border-gray-400 focus:border-wine-600 focus:ring-2 focus:ring-wine-600/25 outline-none';

// --- Marketing size presets (px) -----------------------------------------
const SIZES = [
  { id: 'square', label: 'Square', sub: 'Instagram / Feed', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait', sub: 'Instagram / Feed', w: 1080, h: 1350 },
  { id: 'story', label: 'Story', sub: 'IG / WhatsApp Status', w: 1080, h: 1920 },
  { id: 'landscape', label: 'Landscape', sub: 'X / Twitter / LinkedIn', w: 1200, h: 675 },
];

// --- Arabic script options ------------------------------------------------
const ARABIC_FONTS = [
  { id: 'amiri', label: 'Amiri (traditional)', css: AR },
  { id: 'quran', label: 'Amiri Quran', css: ARQ },
];

// --- Palettes (colour schemes) -------------------------------------------
const PALETTES = [
  {
    id: 'cream-gold',
    name: 'Cream & Gold',
    bg: '#faf7f0',
    dark: false,
    watermarkOpacity: 0.022,
    arabic: '#b08d4a',
    ink: '#3a2a2e', // primary body / english
    accent: '#7a2e39', // maroon — attribution, headlines
    muted: '#b08d4a', // gold — source, secondary
    footer: 'rgba(58,42,46,0.55)',
    rule: '#d4a94e',
    frame: 'rgba(122,46,57,0.18)', // āyah frame border
    frameBg: 'rgba(122,46,57,0.04)',
  },
  {
    id: 'maroon-deep',
    name: 'Deep Maroon',
    bg: '#4a1d25',
    dark: true,
    watermarkOpacity: 0.03,
    arabic: '#f4d9a8',
    ink: '#fdf6ec',
    accent: '#f4d9a8',
    muted: '#d4a94e',
    footer: 'rgba(253,246,236,0.55)',
    rule: '#a94b5b',
    frame: 'rgba(244,217,168,0.28)',
    frameBg: 'rgba(244,217,168,0.05)',
  },
  {
    id: 'paper-maroon',
    name: 'Paper & Maroon',
    bg: '#fffdf7',
    dark: false,
    watermarkOpacity: 0.025,
    arabic: '#7a2e39',
    ink: '#2a1e1a',
    accent: '#7a2e39',
    muted: '#a94b5b',
    footer: 'rgba(42,30,26,0.5)',
    rule: '#7a2e39',
    frame: 'rgba(122,46,57,0.2)',
    frameBg: 'rgba(122,46,57,0.03)',
  },
  {
    id: 'gold-on-wine',
    name: 'Gold on Wine',
    bg: '#57202a',
    dark: true,
    watermarkOpacity: 0.035,
    arabic: '#f4d9a8',
    ink: '#f6e5e8',
    accent: '#f4d9a8',
    muted: '#eccace',
    footer: 'rgba(246,229,232,0.5)',
    rule: '#d4a94e',
    frame: 'rgba(244,217,168,0.3)',
    frameBg: 'rgba(244,217,168,0.05)',
  },
];

// --- Field definitions ----------------------------------------------------
// kind: 'text' | 'area'  ·  ar: true renders as RTL Arabic input
// quran: true adds a "Pick from Qurʾān" button that inserts a verified āyah.
const F = {
  arabic: { key: 'arabic', label: 'Arabic quote', kind: 'area', ar: true, rows: 3, quran: true },
  ayah: { key: 'ayah', label: 'Āyah (Arabic)', kind: 'area', ar: true, rows: 3, quran: true },
  english: { key: 'english', label: 'English translation', kind: 'area', rows: 3 },
  meaning: { key: 'meaning', label: 'English meaning', kind: 'area', rows: 3 },
  tafsir: { key: 'tafsir', label: 'Tafsīr excerpt (English)', kind: 'area', rows: 5 },
  attribution: { key: 'attribution', label: 'Attribution', kind: 'text' },
  honorific: { key: 'honorific', label: 'Honorific (Arabic)', kind: 'text', ar: true },
  attributionSuffix: { key: 'attributionSuffix', label: 'Attribution suffix', kind: 'text' },
  source: { key: 'source', label: 'Source / citation', kind: 'text' },
  ayahRef: { key: 'ayahRef', label: 'Sūrah : āyah', kind: 'text' },
  tafsirRef: { key: 'tafsirRef', label: 'Tafsīr source', kind: 'text' },
  term: { key: 'term', label: 'Arabic term', kind: 'text', ar: true },
  translit: { key: 'translit', label: 'Transliteration', kind: 'text' },
  definition: { key: 'definition', label: 'Definition / explanation', kind: 'area', rows: 4 },
  eyebrow: { key: 'eyebrow', label: 'Eyebrow (small label)', kind: 'text' },
  headline: { key: 'headline', label: 'Headline', kind: 'area', rows: 2 },
  body: { key: 'body', label: 'Body text', kind: 'area', rows: 3 },
  cta: { key: 'cta', label: 'Call to action', kind: 'text' },
};

// Auto-scale a font down as text gets longer, so long strings still fit.
function scale(text, base, min, freeChars, rate = 0.06) {
  const len = (text || '').length;
  return Math.max(min, base - Math.max(0, len - freeChars) * rate);
}

// ---- Shared card primitives (all take the render context `c`) ------------
// The brand lockup used on every card: the mark ON TOP, then the two-line
// "The FastTrack / Madrasah" wordmark centred beneath it (Space Grotesk, with
// "Madrasah" letter-spaced to the width of "The FastTrack"). Centred at the top
// of the card. The wordmark ink follows the palette so it stays legible on
// light and dark cards alike.
function Wordmark({ c }) {
  const { pal, w } = c;
  const mark = pal.dark ? LOGO_WHITE : LOGO;
  const markH = w * 0.085;
  const line = w * 0.024;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: w * 0.014 }}>
      <img src={mark} alt="" crossOrigin="anonymous" style={{ height: markH, width: 'auto' }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1.04,
          textAlign: 'center',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          color: pal.ink,
        }}
      >
        <span style={{ fontSize: line, letterSpacing: '0.005em' }}>The FastTrack</span>
        {/* paddingLeft cancels the trailing tracking space so the letter-spaced
           word stays optically centred under "The FastTrack". */}
        <span style={{ fontSize: line, letterSpacing: '0.28em', paddingLeft: '0.28em' }}>Madrasah</span>
      </div>
    </div>
  );
}

function Logo({ c, corner = true }) {
  if (corner) {
    // Top-centre. The block reserves the lockup's full height plus a gap so the
    // content below can never ride up into it.
    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          minHeight: c.w * 0.165,
        }}
      >
        {c.showLogo && <Wordmark c={c} />}
      </div>
    );
  }
  return <Wordmark c={c} />;
}

function Watermark({ c }) {
  // Tiled brand mark at very low opacity — a subtle repeating texture that
  // sits behind the text without competing with it for readability.
  const tile = c.w * 0.16; // mark size within each repeated cell
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${c.pal.dark ? MARK_WHITE : MARK_WINE})`,
        backgroundRepeat: 'repeat',
        backgroundSize: `${tile}px ${tile}px`,
        backgroundPosition: `${tile * 0.25}px ${tile * 0.25}px`,
        opacity: c.pal.watermarkOpacity,
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    />
  );
}

function Footer({ c }) {
  if (!c.showFooter) return null;
  return (
    <div style={{ position: 'relative', textAlign: 'center' }}>
      <div
        style={{
          width: c.w * 0.14,
          height: 2,
          background: c.pal.rule,
          opacity: 0.4,
          margin: `0 auto ${c.w * 0.02}px`,
        }}
      />
      <div style={{ fontSize: c.w * 0.018, letterSpacing: '0.32em', color: c.pal.footer, fontWeight: 600 }}>
        {SITE}
      </div>
    </div>
  );
}

function AttributionLine({ c }) {
  const { f, pal, w, arFont } = c;
  if (!f.attribution) return null;
  return (
    <div style={{ fontSize: w * 0.026, color: pal.accent, textAlign: 'center', fontWeight: 700 }}>
      {f.attribution}
      {f.honorific && (
        <span style={{ fontFamily: arFont, fontWeight: 400 }} dir="rtl" lang="ar">
          {' '}
          {f.honorific}
        </span>
      )}
      {f.attributionSuffix && <span style={{ fontWeight: 700 }}> {f.attributionSuffix}</span>}
    </div>
  );
}

function ArabicBlock({ c, text, framed = false }) {
  const { pal, w, arFont } = c;
  const size = scale(text, w * 0.052, w * 0.03, 90);
  const el = (
    <div
      dir="rtl"
      lang="ar"
      style={{
        fontFamily: arFont,
        fontSize: size,
        color: pal.arabic,
        lineHeight: 1.9,
        textAlign: 'center',
        fontWeight: 400,
      }}
    >
      {text}
    </div>
  );
  if (!framed) return el;
  return (
    <div
      style={{
        border: `2px solid ${pal.frame}`,
        background: pal.frameBg,
        borderRadius: w * 0.03,
        padding: `${w * 0.05}px ${w * 0.045}px`,
      }}
    >
      {el}
    </div>
  );
}

// ---- Layouts -------------------------------------------------------------
// Each layout: fields it exposes + a render(c) returning the card body
// (everything between the top logo and the footer).
const LAYOUTS = [
  {
    id: 'quote',
    name: 'Quote card',
    desc: 'Arabic quote, translation, attribution, source',
    fields: ['arabic', 'attribution', 'honorific', 'attributionSuffix', 'english', 'source'],
    sample: {
      arabic:
        'مَنْ صَدَقَ فِي تَرْكِ شَهْوَةٍ كُفِيَ مُؤْنَتَهَا، وَكَانَ اللَّهُ أَكْرَمَ مِنْ أَنْ يُعَذِّبَ قَلْبًا بِشَهْوَةٍ تُرِكَتْ لَهُ',
      english:
        'Whoever is sincere in giving up a desire will be spared the burden of it, and Allah is too Generous to torment a heart with a desire that was given up for His sake',
      attribution: 'Abu Sulaymān ad-Dārānī',
      honorific: 'رحمه الله',
      attributionSuffix: 'said:',
      source: 'Ḥilyah al-Awliyāʾ 9/256',
    },
    render: (c) => {
      const { f, pal, w } = c;
      const enSize = scale(f.english, w * 0.05, w * 0.028, 120);
      return (
        <Center gap={w * 0.035}>
          {f.arabic && <ArabicBlock c={c} text={f.arabic} />}
          <AttributionLine c={c} />
          {f.english && (
            <div
              style={{
                fontSize: enSize,
                color: pal.ink,
                lineHeight: 1.35,
                textAlign: 'center',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                maxWidth: '92%',
                margin: '0 auto',
              }}
            >
              {f.english}
            </div>
          )}
          {f.source && <Source c={c} text={`(${f.source})`} />}
        </Center>
      );
    },
  },
  {
    id: 'ayah',
    name: 'Āyah (verse card)',
    desc: 'Framed āyah, translation, reference',
    fields: ['ayah', 'meaning', 'ayahRef'],
    sample: {
      ayah: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
      meaning: 'And whoever fears Allah — He will make for him a way out',
      ayahRef: 'Sūrat aṭ-Ṭalāq 65:2',
    },
    render: (c) => {
      const { f, pal, w } = c;
      const mSize = scale(f.meaning, w * 0.046, w * 0.03, 90);
      return (
        <Center gap={w * 0.045}>
          {f.ayah && <ArabicBlock c={c} text={f.ayah} framed />}
          {f.meaning && (
            <div
              style={{
                fontSize: mSize,
                color: pal.ink,
                lineHeight: 1.4,
                textAlign: 'center',
                fontWeight: 600,
                maxWidth: '90%',
                margin: '0 auto',
                fontStyle: 'italic',
              }}
            >
              “{f.meaning}”
            </div>
          )}
          {f.ayahRef && <Source c={c} text={f.ayahRef} />}
        </Center>
      );
    },
  },
  {
    id: 'ayah-tafsir',
    name: 'Āyah + Tafsīr',
    desc: 'Āyah, translation, tafsīr excerpt, two references',
    fields: ['ayah', 'meaning', 'tafsir', 'ayahRef', 'tafsirRef'],
    sample: {
      ayah: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
      meaning: 'You alone we worship, and You alone we ask for help',
      tafsir:
        'Worship is not complete without seeking help, and seeking help is worthless without worship. The servant places both between his hands: none is worshipped but Allah, and none is relied upon but Him.',
      ayahRef: 'Sūrat al-Fātiḥah 1:5',
      tafsirRef: 'Tafsīr as-Saʿdī',
    },
    render: (c) => {
      const { f, pal, w } = c;
      const ayahSize = scale(f.ayah, w * 0.05, w * 0.032, 60);
      const tSize = scale(f.tafsir, w * 0.03, w * 0.021, 200, 0.02);
      return (
        <Center gap={w * 0.03} justify="flex-start" pad={w * 0.02}>
          {f.ayah && (
            <div
              dir="rtl"
              lang="ar"
              style={{
                fontFamily: c.arFont,
                fontSize: ayahSize,
                color: pal.arabic,
                lineHeight: 1.85,
                textAlign: 'center',
                borderBottom: `2px solid ${pal.frame}`,
                paddingBottom: w * 0.03,
                width: '100%',
              }}
            >
              {f.ayah}
            </div>
          )}
          {f.meaning && (
            <div
              style={{
                fontSize: w * 0.032,
                color: pal.ink,
                lineHeight: 1.35,
                textAlign: 'center',
                fontWeight: 700,
                maxWidth: '92%',
                margin: '0 auto',
              }}
            >
              {f.meaning}
            </div>
          )}
          {f.ayahRef && <Source c={c} text={f.ayahRef} small />}
          {f.tafsir && (
            <div
              style={{
                fontSize: tSize,
                color: pal.ink,
                opacity: 0.9,
                lineHeight: 1.55,
                textAlign: 'center',
                maxWidth: '94%',
                margin: `${w * 0.01}px auto 0`,
                fontWeight: 400,
              }}
            >
              {f.tafsir}
            </div>
          )}
          {f.tafsirRef && (
            <div style={{ fontSize: w * 0.022, color: pal.muted, textAlign: 'center', fontWeight: 600 }}>
              — {f.tafsirRef}
            </div>
          )}
        </Center>
      );
    },
  },
  {
    id: 'term',
    name: 'Term / concept',
    desc: 'Arabic term, transliteration, definition',
    fields: ['term', 'translit', 'definition'],
    sample: {
      term: 'اَلتَّقْوَىٰ',
      translit: 'at-taqwā',
      definition:
        'God-consciousness: to place a barrier between oneself and what Allah has forbidden, by acting on what He commands and avoiding what He prohibits.',
    },
    render: (c) => {
      const { f, pal, w } = c;
      const termSize = scale(f.term, w * 0.1, w * 0.06, 10);
      const dSize = scale(f.definition, w * 0.034, w * 0.024, 120, 0.03);
      return (
        <Center gap={w * 0.025}>
          {f.term && (
            <div dir="rtl" lang="ar" style={{ fontFamily: c.arFont, fontSize: termSize, color: pal.arabic, lineHeight: 1.4, textAlign: 'center' }}>
              {f.term}
            </div>
          )}
          {f.translit && (
            <div style={{ fontSize: w * 0.03, color: pal.accent, textAlign: 'center', fontWeight: 700, fontStyle: 'italic', letterSpacing: '0.02em' }}>
              {f.translit}
            </div>
          )}
          <div style={{ width: w * 0.1, height: 2, background: pal.rule, opacity: 0.5, margin: `${w * 0.01}px auto` }} />
          {f.definition && (
            <div style={{ fontSize: dSize, color: pal.ink, lineHeight: 1.5, textAlign: 'center', maxWidth: '90%', margin: '0 auto', fontWeight: 400 }}>
              {f.definition}
            </div>
          )}
        </Center>
      );
    },
  },
  {
    id: 'announcement',
    name: 'Announcement',
    desc: 'Eyebrow, headline, body, call-to-action',
    fields: ['eyebrow', 'headline', 'body', 'cta'],
    sample: {
      eyebrow: 'NOW ENROLLING',
      headline: 'Learn to read the Qurʾān — and understand it',
      body: 'Structured Arabic & Islamic studies, from the alphabet to fluency. Live and self-paced tracks.',
      cta: 'Apply at tftmadrasah.com',
    },
    render: (c) => {
      const { f, pal, w } = c;
      const hSize = scale(f.headline, w * 0.062, w * 0.04, 40);
      return (
        <Center gap={w * 0.03}>
          {f.eyebrow && (
            <div style={{ fontSize: w * 0.024, letterSpacing: '0.28em', color: pal.muted, textAlign: 'center', fontWeight: 700 }}>
              {f.eyebrow}
            </div>
          )}
          {f.headline && (
            <div style={{ fontSize: hSize, color: pal.accent, lineHeight: 1.15, textAlign: 'center', fontWeight: 700, letterSpacing: '-0.015em', maxWidth: '94%', margin: '0 auto' }}>
              {f.headline}
            </div>
          )}
          {f.body && (
            <div style={{ fontSize: w * 0.03, color: pal.ink, lineHeight: 1.45, textAlign: 'center', maxWidth: '86%', margin: '0 auto', fontWeight: 400 }}>
              {f.body}
            </div>
          )}
          {f.cta && (
            <div style={{ marginTop: w * 0.02, display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  background: pal.dark ? pal.accent : pal.accent,
                  color: pal.dark ? '#4a1d25' : '#fffdf7',
                  fontWeight: 700,
                  fontSize: w * 0.028,
                  padding: `${w * 0.022}px ${w * 0.05}px`,
                  borderRadius: 999,
                }}
              >
                {f.cta}
              </div>
            </div>
          )}
        </Center>
      );
    },
  },
];

// Small helpers used by layouts
function Center({ children, gap = 0, justify = 'center', pad = 0 }) {
  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: justify,
        gap,
        paddingTop: pad,
      }}
    >
      {children}
    </div>
  );
}

function Source({ c, text, small = false }) {
  return (
    <div style={{ fontSize: c.w * (small ? 0.024 : 0.028), color: c.pal.muted, textAlign: 'center', fontWeight: 600 }}>
      {text}
    </div>
  );
}

// Track an element's rendered width so the preview scales fluidly to whatever
// space it has — never wider than its container, so the page never gains a
// horizontal scrollbar on a phone.
function useMeasuredWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

export default function BrandStudio() {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [layout, setLayout] = useState(LAYOUTS[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [pal, setPal] = useState(PALETTES[0]);
  const [arabicFont, setArabicFont] = useState(ARABIC_FONTS[0]);
  const [showLogo, setShowLogo] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  // On mobile the control groups live behind a tab bar so you edit one thing
  // at a time under the sticky preview, instead of scrolling five stacked
  // sections. On desktop every group shows at once (see `showTab`).
  const [tab, setTab] = useState('text');
  const [busy, setBusy] = useState(false);
  // Which Arabic field the Qurʾān verse picker is filling (null = closed).
  const [pickerField, setPickerField] = useState(null);

  // Field values are keyed per-layout so switching layouts doesn't lose text.
  const [values, setValues] = useState(() => {
    const init = {};
    LAYOUTS.forEach((l) => { init[l.id] = { ...l.sample }; });
    return init;
  });
  const f = values[layout.id] || {};
  const set = (k) => (e) =>
    setValues((v) => ({ ...v, [layout.id]: { ...v[layout.id], [k]: e.target.value } }));
  const setField = (k, val) =>
    setValues((v) => ({ ...v, [layout.id]: { ...v[layout.id], [k]: val } }));

  // Insert a verified āyah into the target Arabic field, and — for layouts that
  // carry a reference/source field — fill the citation too, so quoting a verse
  // is one action. The reference is only auto-filled when it's currently empty
  // or was the sample, so it never clobbers something the user typed.
  const insertAyah = (targetKey) => ({ sura, aya, suraName, text }) => {
    setField(targetKey, text);
    const cite = `Sūrat ${suraName} ${sura}:${aya}`;
    const refKey = layout.fields.includes('ayahRef') ? 'ayahRef' : layout.fields.includes('source') ? 'source' : null;
    if (refKey) {
      const current = (f[refKey] || '').trim();
      const isSample = current === (layout.sample[refKey] || '').trim();
      if (!current || isSample) setField(refKey, cite);
    }
    setPickerField(null);
  };

  // The preview is a FIXED AREA the card is fitted inside (contain), so the
  // WHOLE card is always visible whatever its aspect ratio — a square, a tall
  // story and a wide landscape all show completely, centered, never clipped.
  const [previewBoxRef, previewBoxWidth] = useMeasuredWidth();
  const [viewportH, setViewportH] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const on = () => { setIsNarrow(mq.matches); setViewportH(window.innerHeight); };
    on();
    mq.addEventListener('change', on);
    window.addEventListener('resize', on);
    return () => { mq.removeEventListener('change', on); window.removeEventListener('resize', on); };
  }, []);
  // Available area for the preview: full column width (capped), and a height
  // budget — a slice of the viewport on mobile (leave room for controls), a
  // comfortable fixed height on desktop.
  const areaW = Math.min(previewBoxWidth || 320, 460);
  const areaH = isNarrow ? Math.round(viewportH * 0.4) : 560;
  // Contain: one scale that fits both dimensions; the card keeps its shape.
  const previewScale = Math.min(areaW / size.w, areaH / size.h);
  const previewW = size.w * previewScale;
  const previewH = size.h * previewScale;

  // Render context passed to layout renderers and primitives.
  // Layouts size their type and spacing off a single UNIT `u`, not the raw
  // width. For square/portrait/story `u` is the width (unchanged). For a short,
  // wide canvas (landscape) `u` shrinks so the same content fits the reduced
  // height instead of overflowing the frame. The card's real pixel dimensions
  // stay size.w × size.h.
  const aspect = size.h / size.w;
  const u = size.w * Math.min(1, aspect / 0.85);
  const c = useMemo(
    () => ({ f, pal, w: u, h: size.h, cw: size.w, arFont: arabicFont.css, showLogo, showFooter }),
    [f, pal, u, size.h, size.w, arabicFont.css, showLogo, showFooter]
  );

  const download = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      // Capture the OFF-SCREEN true-size node (not the scaled preview) so the
      // flex layout is laid out at real pixels.
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: pal.bg,
      });
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      link.download = `ftm-${layout.id}-${pal.id}-${size.id}-${stamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Image export failed', err);
      alert('Could not generate the image. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const renderCard = (captureRef) => (
    <div
      ref={captureRef}
      style={{
        width: size.w,
        height: size.h,
        background: pal.bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Figtree', 'Inter', sans-serif",
        boxSizing: 'border-box',
        // Vertical padding tracks the unit (shrinks for landscape); horizontal
        // stays a share of the true width so wide cards keep side margins.
        padding: `${u * 0.075}px ${size.w * 0.075}px`,
      }}
    >
      <Watermark c={c} />
      <Logo c={c} corner />
      {layout.render(c)}
      <Footer c={c} />
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Brand Studio | The FastTrack Madrasah</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/academic-dean')}
                  className="inline-flex items-center gap-1.5 text-sm text-wine-600 hover:text-wine-700 font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-wine-600" />
                  Brand Studio
                </h1>
              </div>
              <button
                onClick={download}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-wine-600 px-4 py-2 text-sm font-semibold text-white hover:bg-wine-700 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download PNG
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 lg:py-8 grid lg:grid-cols-[1fr_400px] lg:gap-8 items-start">
          {/* ---- Preview ----
             On a phone the preview sticks below the header so changes to the
             controls (which scroll beneath it) are visible live. On desktop it
             sits in its own column beside the controls. */}
          <div className="sticky top-14 z-[5] -mx-4 sm:-mx-6 lg:mx-0 lg:top-8 bg-gray-50 px-4 sm:px-6 lg:px-0 pt-2 pb-3 lg:py-0 border-b border-gray-200 lg:border-0 min-w-0">
            {/* This wrapper is what we measure — it's a plain block so it takes
               exactly the available column width. The preview box below is then
               sized to previewW (measured, capped) so the scaled 1080px card can
               never push the column wider than the viewport. */}
            <div ref={previewBoxRef} className="flex flex-col items-center min-w-0">
              {/* Fixed-height stage centers the fitted card, so switching between
                 square / story / landscape never shifts the controls below and
                 the whole card always shows. */}
              <div className="flex w-full items-center justify-center" style={{ height: areaH }}>
                <div
                  className="rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden bg-white"
                  style={{ width: previewW, height: previewH }}
                >
                  <div style={{ width: size.w, height: size.h, transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
                    {renderCard(null)}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 text-center">
                {layout.name} · {size.label} · {size.w}×{size.h}px
              </p>
            </div>
          </div>

          {/* Off-screen true-size capture target for html2canvas */}
          <div aria-hidden style={{ position: 'fixed', top: 0, left: -99999, pointerEvents: 'none', opacity: 0 }}>
            {renderCard(cardRef)}
          </div>

          {/* ---- Controls ---- */}
          <div className="pt-3 lg:pt-0 min-w-0">
            {/* Mobile tab bar — one control group at a time, so the whole panel
               fits under the sticky preview without a long scroll. Hidden on
               desktop, where all groups show stacked in the side column. */}
            <div className="lg:hidden sticky top-14 z-[4] -mx-4 sm:-mx-6 px-4 sm:px-6 bg-gray-50 pb-2">
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1">
                {[
                  { id: 'format', label: 'Format' },
                  { id: 'text', label: 'Text' },
                  { id: 'style', label: 'Style' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`rounded-md py-2 text-sm font-medium transition ${
                      tab === t.id ? 'bg-white text-wine-700 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6 pt-4 lg:pt-0">
            {/* Layout */}
            <section className={tab === 'format' ? '' : 'hidden lg:block'}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Layout</h2>
              <div className="space-y-2">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayout(l)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      layout.id === l.id ? 'border-wine-600 ring-1 ring-wine-600 bg-wine-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800">{l.name}</div>
                    <div className="text-[11px] text-gray-400">{l.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Palette */}
            <section className={tab === 'style' ? '' : 'hidden lg:block'}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Palette</h2>
              <div className="grid grid-cols-2 gap-2">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPal(p)}
                    className={`rounded-lg border p-2 text-left transition ${
                      pal.id === p.id ? 'border-wine-600 ring-1 ring-wine-600' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="h-10 rounded mb-1.5 flex items-center justify-center text-[13px]"
                      style={{ background: p.bg, color: p.arabic, fontFamily: AR }}
                    >
                      نص
                    </div>
                    <span className="text-xs font-medium text-gray-700">{p.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Size */}
            <section className={tab === 'format' ? '' : 'hidden lg:block'}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Size</h2>
              <div className="grid grid-cols-2 gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSize(s)}
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      size.id === s.id ? 'border-wine-600 ring-1 ring-wine-600 bg-wine-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800">{s.label}</div>
                    <div className="text-[11px] text-gray-400">{s.sub}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Content — fields driven by the active layout */}
            <section className={tab === 'text' ? '' : 'hidden lg:block'}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Content</h2>
              <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                {layout.fields.map((key) => {
                  const def = F[key];
                  if (!def) return null;
                  const action = def.quran ? (
                    <button
                      type="button"
                      onClick={() => setPickerField(key)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-wine-700 hover:bg-wine-50"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Pick from Qurʾān
                    </button>
                  ) : null;
                  return (
                    <Field key={key} label={def.label} action={action}>
                      {def.kind === 'area' ? (
                        <textarea
                          rows={def.rows || 3}
                          dir={def.ar ? 'rtl' : undefined}
                          lang={def.ar ? 'ar' : undefined}
                          value={f[key] || ''}
                          onChange={set(key)}
                          className={`${INPUT} resize-y ${def.ar ? 'text-lg leading-relaxed' : ''}`}
                          style={def.ar ? { fontFamily: AR } : undefined}
                        />
                      ) : (
                        <input
                          dir={def.ar ? 'rtl' : undefined}
                          value={f[key] || ''}
                          onChange={set(key)}
                          className={INPUT}
                          style={def.ar ? { fontFamily: AR } : undefined}
                        />
                      )}
                    </Field>
                  );
                })}
              </div>
            </section>

            {/* Style */}
            <section className={tab === 'style' ? '' : 'hidden lg:block'}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Style</h2>
              <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <Field label="Arabic font">
                  <select
                    value={arabicFont.id}
                    onChange={(e) => setArabicFont(ARABIC_FONTS.find((x) => x.id === e.target.value))}
                    className={`${INPUT} cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%239ca3af%22><path d=%22M5.25 7.5 10 12.25 14.75 7.5z%22/></svg>')] bg-[length:20px_20px] bg-[right_0.6rem_center] bg-no-repeat pr-10`}
                  >
                    {ARABIC_FONTS.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="flex items-center gap-6 border-t border-gray-100 pt-3.5">
                  <Toggle checked={showLogo} onChange={setShowLogo} label="Logo" />
                  <Toggle checked={showFooter} onChange={setShowFooter} label="Website footer" />
                </div>
              </div>
            </section>
            </div>
          </div>
        </div>
      </div>

      {pickerField && (
        <VersePicker
          onInsert={insertAyah(pickerField)}
          onClose={() => setPickerField(null)}
        />
      )}
    </>
  );
}

function Field({ label, children, action }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex min-h-[26px] items-center justify-between">
        <span className="text-[13px] font-medium text-gray-700">{label}</span>
        {action}
      </span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }) {
  // On-brand switch (wine when on) — a designed control, not the default
  // browser checkbox.
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex cursor-pointer select-none items-center gap-2.5"
    >
      <span
        className={`relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors duration-200 group-focus-visible:ring-2 group-focus-visible:ring-wine-600/40 ${
          checked ? 'bg-wine-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
          }`}
        />
      </span>
      <span className="text-sm text-gray-700">{label}</span>
    </button>
  );
}
