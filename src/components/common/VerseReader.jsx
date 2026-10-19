import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Copy, Check, Languages, Loader2, Columns } from 'lucide-react';
import { supabase } from '../../services/supabase';
import HighlightableAyah from './HighlightableAyah';
import { SURAH_NAMES, AYAH_COUNTS } from '../../utils/quran';

// QuranEnc (quranenc.com) — free, keyless, CORS-open. Their terms require the
// content be shown unmodified with the publisher, source and version credited.
const QURANENC = 'https://quranenc.com/api/v1';
const MEANING_KEY = 'english_saheeh';
let meaningVersion = null; // cached per session

async function fetchMeaning(sura, aya) {
  const [ayaRes, listRes] = await Promise.all([
    fetch(`${QURANENC}/translation/aya/${MEANING_KEY}/${sura}/${aya}`),
    meaningVersion ? null : fetch(`${QURANENC}/translations/list/en`),
  ]);
  if (!ayaRes.ok) throw new Error(`QuranEnc ${ayaRes.status}`);
  const { result } = await ayaRes.json();
  if (listRes && listRes.ok) {
    const { translations = [] } = await listRes.json();
    const t = translations.find((x) => x.key === MEANING_KEY);
    if (t) meaningVersion = { version: t.version, title: t.title };
  }
  return { translation: result?.translation || '', footnotes: result?.footnotes || '' };
}

/**
 * VerseReader — a focused reading card for one āyah, opened from any verse
 * reference or search result in the tools. Shows the āyah large in the KFGQPC
 * mushaf font with its end-of-āyah medallion, tap-to-highlight words, the
 * sūrah context, prev/next navigation, copy, and an optional meaning line.
 *
 * Props:
 *  - sura, aya: the starting reference.
 *  - highlight: optional string[] of words/phrases to pre-highlight (only
 *      applied on the starting āyah).
 *  - onClose: called when dismissed (×, backdrop, Esc).
 */
export default function VerseReader({ sura: initialSura, aya: initialAya, highlight, onClose }) {
  const [ref, setRef] = useState({ sura: Number(initialSura), aya: Number(initialAya) });
  const [row, setRow] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [copied, setCopied] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [meaning, setMeaning] = useState({ status: 'idle' });
  const closeBtn = useRef(null);

  const { sura, aya } = ref;
  const lastAya = AYAH_COUNTS[sura] || 1;
  const isStart = sura === Number(initialSura) && aya === Number(initialAya);

  // Load the āyah text.
  useEffect(() => {
    let alive = true;
    setStatus('loading');
    supabase
      .from('quran_tajweed_aya')
      .select('sura_number, sura_name, aya_number, aya_text')
      .eq('sura_number', sura)
      .eq('aya_number', aya)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data) { setStatus('error'); return; }
        setRow(data);
        setStatus('ready');
      });
    return () => { alive = false; };
  }, [sura, aya]);

  // Load the meaning lazily, only once the reader asks for it.
  useEffect(() => {
    if (!showMeaning) return undefined;
    let alive = true;
    setMeaning({ status: 'loading' });
    fetchMeaning(sura, aya)
      .then((m) => alive && setMeaning({ status: 'ready', ...m }))
      .catch(() => alive && setMeaning({ status: 'error' }));
    return () => { alive = false; };
  }, [showMeaning, sura, aya]);

  const go = useCallback((delta) => {
    setRef(({ sura: s, aya: a }) => {
      const next = a + delta;
      if (next < 1 || next > (AYAH_COUNTS[s] || 1)) return { sura: s, aya: a };
      return { sura: s, aya: next };
    });
    setCopied(false);
  }, []);

  // Esc closes; arrow keys match the on-screen buttons (← previous, → next).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  const copy = async () => {
    if (!row) return;
    const text = `${row.aya_text}\n— ${SURAH_NAMES[sura]} ${sura}:${aya}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — no-op */ }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-[#2a1013]/50 sm:p-6"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${SURAH_NAMES[sura]} ${sura}:${aya}`}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col bg-[#fffdf7] rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#eadfce] bg-white">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-gray-900 truncate">
              {SURAH_NAMES[sura]} <span className="text-wine-700">{sura}:{aya}</span>
            </p>
            {row?.sura_name && (
              <p className="font-arabic text-sm text-gray-500 leading-tight text-left"><bdi dir="rtl">سورة {row.sura_name}</bdi></p>
            )}
          </div>
          <button
            ref={closeBtn}
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 rounded-full inline-flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-wine-600/40 outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Āyah */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-7 sm:py-9">
          {status === 'loading' && (
            <div className="flex justify-center py-10 text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
          )}
          {status === 'error' && (
            <p className="text-center text-sm text-red-700 py-8">Couldn&apos;t load this āyah. Check your connection and try again.</p>
          )}
          {status === 'ready' && row && (
            <HighlightableAyah
              key={`${sura}:${aya}`}
              text={row.aya_text}
              matchRefs={isStart ? highlight : undefined}
              ayahNumber={aya}
              size="text-[28px] sm:text-[38px]"
              hint
            />
          )}

          {/* Meaning */}
          {status === 'ready' && showMeaning && (
            <div className="mt-6 rounded-xl border border-[#eadfce] bg-white px-4 py-3.5">
              {meaning.status === 'loading' && <p className="text-sm text-gray-400">Loading meaning…</p>}
              {meaning.status === 'error' && <p className="text-sm text-red-700">Couldn&apos;t load the meaning right now.</p>}
              {meaning.status === 'ready' && (
                <>
                  <p className="text-[15px] leading-relaxed text-gray-800">{meaning.translation}</p>
                  {meaning.footnotes && (
                    <details className="mt-2 group">
                      <summary className="cursor-pointer text-xs font-medium text-wine-700 select-none">Translator&apos;s notes</summary>
                      <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-gray-600">{meaning.footnotes}</p>
                    </details>
                  )}
                  <p className="mt-2.5 text-[11px] text-gray-400">
                    Saheeh International{meaningVersion ? ` (v${meaningVersion.version})` : ''} — via{' '}
                    <a href="https://quranenc.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">QuranEnc.com</a>
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-t border-[#eadfce] bg-white" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => go(-1)}
            disabled={aya <= 1}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-35 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            onClick={() => go(1)}
            disabled={aya >= lastAya}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-35 disabled:hover:bg-transparent"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex-1" />
          <Link
            to={`/tools/lens?s=${sura}&a=${aya}`}
            onClick={onClose}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            title="Compare translations of this āyah"
          >
            <Columns className="h-4 w-4" /> Compare
          </Link>
          <button
            onClick={() => setShowMeaning((v) => !v)}
            aria-pressed={showMeaning}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              showMeaning ? 'bg-wine-50 text-wine-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Languages className="h-4 w-4" /> Meaning
          </button>
          <button
            onClick={copy}
            disabled={!row}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-35"
          >
            {copied ? <Check className="h-4 w-4 text-wine-700" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
