import ToolSeo from '../../components/tools/ToolSeo';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Search } from 'lucide-react';
import SurahSelect from '../../components/tools/SurahSelect';
import TranslationSelect from '../../components/tools/TranslationSelect';
import { supabase } from '../../services/supabase';
import { getAya, listTranslations, credit } from '../../services/quranenc';
import { getSuraArabic } from '../../services/quranText';
import { SURAH_NAMES, AYAH_COUNTS, toArabicDigits } from '../../utils/quran';

/**
 * Translator's Lens — one āyah, several translations side by side. Words a
 * translator uses that no other translation (in the same language) uses are
 * marked, and each translator's footnotes are shown — so students see that a
 * translation is an interpretation, then go to the Arabic: tap any word for
 * its root and every other place it occurs (Tasreef).
 */

const DEFAULTS = ['english_saheeh', 'english_hilali_khan', 'english_rwwad'];
const MAX = 5;
// Small English function words ignored when marking a translator's choices.
const STOP = new Set('a an the and or of to in on for is are was were be been his her their its it he she they them him who whom which that this those these with by from as at not no nor so but if then than do does did has have had will shall would should may might can could o you your ye thou thee thy we us our i me my all upon unto into allah lord'.split(' '));

const clean = (t) => String(t || '').replace(/\s*\[\d+\]/g, '');
const wordsOf = (t) => (clean(t).toLowerCase().match(/[\p{L}\p{M}'’-]+/gu) || []).map((w) => w.replace(/^['’-]+|['’-]+$/g, ''));

// Render a translation with its distinctive words marked.
function Marked({ text, distinctive }) {
  const parts = clean(text).split(/([\p{L}\p{M}'’-]+)/u);
  return parts.map((p, i) => {
    const w = p.toLowerCase().replace(/^['’-]+|['’-]+$/g, '');
    return distinctive.has(w)
      ? <mark key={i} className="bg-amber-100 text-inherit rounded px-0.5">{p}</mark>
      : <span key={i}>{p}</span>;
  });
}

export default function TranslatorsLens() {
  const [params, setParams] = useSearchParams();
  // Position lives in the URL; moving to another āyah/sūrah or changing the
  // translations PUSHES history (typing an āyah number only replaces).
  const sura = Math.min(114, Math.max(1, Number(params.get('s')) || 1));
  const aya = Number(params.get('a')) || 5;
  const keys = useMemo(() => (params.get('t') ? params.get('t').split(',').filter(Boolean).slice(0, MAX) : DEFAULTS), [params]);
  const nav = (patch, replace = false) => {
    const next = { s: sura, a: aya, t: keys.join(','), ...patch };
    if (Array.isArray(next.t)) next.t = next.t.join(',');
    setParams(next, { replace });
  };
  const setSura = (n) => nav({ s: n, a: 1 });
  const setAya = (n, replace = false) => nav({ a: n }, replace);
  const setKeys = (ks) => nav({ t: ks });
  const [all, setAll] = useState([]);
  const [arabic, setArabic] = useState({ status: 'loading' });
  const [rows, setRows] = useState({}); // key → { status, translation, footnotes }
  const [roots, setRoots] = useState({}); // word_number → root row
  const [activeWord, setActiveWord] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addKey, setAddKey] = useState('french_rashid');

  const last = AYAH_COUNTS[sura] || 1;
  const safeAya = Math.min(Math.max(1, aya), last);

  useEffect(() => { listTranslations().then(setAll).catch(() => setAll([])); }, []);

  // Arabic (verified corpus) + word roots.
  useEffect(() => {
    let alive = true;
    setArabic({ status: 'loading' }); setActiveWord(null); setRoots({});
    getSuraArabic(sura)
      .then((ar) => { if (alive) setArabic({ status: 'ready', text: ar.find((r) => r.aya === safeAya)?.text || '' }); })
      .catch(() => alive && setArabic({ status: 'error' }));
    supabase.from('quran_word_root').select('word_number, word, root').eq('sura_number', sura).eq('aya_number', safeAya).order('word_number')
      .then(({ data }) => { if (alive) setRoots(Object.fromEntries((data || []).map((r) => [r.word_number, r]))); });
    return () => { alive = false; };
  }, [sura, safeAya]);

  // Translations.
  useEffect(() => {
    let alive = true;
    setRows(Object.fromEntries(keys.map((k) => [k, { status: 'loading' }])));
    for (const k of keys) {
      getAya(k, sura, safeAya)
        .then((r) => alive && setRows((m) => ({ ...m, [k]: { status: 'ready', translation: r.translation, footnotes: r.footnotes } })))
        .catch(() => alive && setRows((m) => ({ ...m, [k]: { status: 'error' } })));
    }
    return () => { alive = false; };
  }, [keys, sura, safeAya]);

  const meta = (k) => all.find((t) => t.key === k);

  // Distinctive words: in a translation but in no OTHER translation of the
  // same language. Only meaningful when 2+ share a language.
  const distinctive = useMemo(() => {
    const out = {};
    for (const k of keys) {
      const lang = meta(k)?.language_iso_code;
      const peers = keys.filter((o) => o !== k && meta(o)?.language_iso_code === lang && rows[o]?.status === 'ready');
      if (!peers.length || rows[k]?.status !== 'ready') { out[k] = new Set(); continue; }
      const others = new Set(peers.flatMap((o) => wordsOf(rows[o].translation)));
      out[k] = new Set(wordsOf(rows[k].translation).filter((w) => w.length > 2 && !others.has(w) && !STOP.has(w)));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, rows, all]);

  const go = (d) => {
    let s = sura, a = safeAya + d;
    if (a < 1) { s = Math.max(1, sura - 1); a = s === sura ? 1 : AYAH_COUNTS[s]; }
    if (a > last) { s = Math.min(114, sura + 1); a = s === sura ? last : 1; }
    nav({ s, a });
  };

  const tokens = (arabic.text || '').split(/\s+/).filter(Boolean);
  const word = activeWord != null ? roots[activeWord + 1] : null;

  return (
    <>
      <ToolSeo
        path="/tools/lens"
        title="Translator's Lens — compare Qur'an translations | The FastTrack Madrasah"
        name="Translator's Lens"
        description="See one āyah in several Qur'an translations side by side, with each translator's distinctive word choices and footnotes marked — then tap the Arabic for each word's root."
      />

      <div className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">Translator&apos;s Lens</h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            One āyah, several translations. See where translators choose different words — every translation is an
            interpretation — then go back to the Arabic.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <SurahSelect value={sura} onChange={(n) => setSura(n)} className="sm:w-72" />
            <div className="flex items-center gap-2">
              <button onClick={() => go(-1)} aria-label="Previous āyah" className="h-11 w-11 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"><ChevronLeft className="h-4 w-4" /></button>
              <label className="relative">
                <span className="sr-only">Āyah</span>
                <input type="number" min={1} max={last} value={safeAya} onChange={(e) => setAya(Number(e.target.value) || 1, true)}
                  className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base sm:text-sm text-gray-900 shadow-sm focus:border-wine-600 focus:ring-2 focus:ring-wine-600/25 outline-none" />
              </label>
              <span className="text-sm text-gray-500">of {last}</span>
              <button onClick={() => go(1)} aria-label="Next āyah" className="h-11 w-11 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Arabic — tap a word */}
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffdf7] px-5 sm:px-8 py-6 sm:py-8">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-3">
            {SURAH_NAMES[sura]} {sura}:{safeAya} · tap a word for its root
          </p>
          {arabic.status === 'loading' && <div className="flex justify-center py-6 text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          {arabic.status === 'error' && <p className="text-sm text-red-700">Couldn&apos;t load the āyah.</p>}
          {arabic.status === 'ready' && (
            <p dir="rtl" className="font-quran text-[28px] sm:text-[36px] leading-[2.1] text-gray-900 text-center">
              {tokens.map((t, i) => (
                <span key={i}>
                  <button onClick={() => setActiveWord(activeWord === i ? null : i)}
                    className={`rounded px-1 transition-colors ${activeWord === i ? 'bg-wine-600 text-white' : 'hover:bg-wine-50'}`}>{t}</button>{' '}
                </span>
              ))}
              <span className="text-wine-700 mx-1">{toArabicDigits(safeAya)}</span>
            </p>
          )}
          {activeWord != null && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
              <span className="font-quran text-2xl text-gray-900" dir="rtl">{tokens[activeWord]}</span>
              {word?.root ? (
                <>
                  <span className="text-gray-500">root</span>
                  <span className="font-arabic text-lg text-wine-700" dir="rtl">{word.root.split('').join(' ')}</span>
                  <Link to={`/tools/roots?q=${encodeURIComponent(word.root)}`} className="inline-flex items-center gap-1 font-medium text-wine-700 hover:underline">
                    <Search className="h-3.5 w-3.5" /> every occurrence
                  </Link>
                </>
              ) : (
                <span className="text-gray-500">a particle — no root</span>
              )}
            </div>
          )}
        </div>

        {/* Translations */}
        <div className={`mt-5 grid gap-3 ${keys.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {keys.map((k) => {
            const r = rows[k] || {};
            const t = meta(k);
            return (
              <article key={k} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold text-gray-500 leading-snug">{t ? t.title : k}</p>
                  {keys.length > 1 && (
                    <button onClick={() => setKeys(keys.filter((x) => x !== k))} aria-label="Remove translation" className="text-gray-400 hover:text-gray-700 -mt-0.5"><X className="h-4 w-4" /></button>
                  )}
                </div>
                {r.status === 'loading' && <p className="text-sm text-gray-400">Loading…</p>}
                {r.status === 'error' && <p className="text-sm text-red-700">Couldn&apos;t load this translation.</p>}
                {r.status === 'ready' && (
                  <>
                    <p dir="auto" className="text-[16px] leading-relaxed text-gray-900">
                      <Marked text={r.translation} distinctive={distinctive[k] || new Set()} />
                    </p>
                    {r.footnotes && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-medium text-wine-700 select-none">Translator&apos;s notes</summary>
                        <p dir="auto" className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-gray-600">{r.footnotes}</p>
                      </details>
                    )}
                    <p className="mt-3 text-[11px] text-gray-400">{credit(t)}</p>
                  </>
                )}
              </article>
            );
          })}

          {keys.length < MAX && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 sm:p-5 flex flex-col justify-center">
              {!adding ? (
                <button onClick={() => setAdding(true)} className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-wine-700 hover:text-wine-800 py-3">
                  <Plus className="h-4 w-4" /> Add a translation (any of 76)
                </button>
              ) : (
                <div className="space-y-2">
                  <TranslationSelect value={addKey} onChange={setAddKey} label="Add translation" />
                  <div className="flex gap-2">
                    <button onClick={() => { if (!keys.includes(addKey)) setKeys([...keys, addKey]); setAdding(false); }}
                      className="flex-1 rounded-lg bg-wine-600 py-2 text-sm font-semibold text-white hover:bg-wine-700">Add</button>
                    <button onClick={() => setAdding(false)} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-5 text-xs text-gray-500">
          <mark className="bg-amber-100 rounded px-1">Marked</mark> words are ones a translator uses that the other
          translations in the same language don&apos;t — a quick way to see each translator&apos;s choices.
        </p>
        <p className="mt-2 text-xs text-gray-400">Translations from QuranEnc.com, shown unmodified. Arabic: verified ʿUthmānī text.</p>
      </div>
    </>
  );
}
