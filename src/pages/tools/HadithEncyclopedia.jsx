import ToolSeo from '../../components/tools/ToolSeo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, ChevronRight, X, Loader2, Languages, Link2, Check, BookOpen } from 'lucide-react';

/**
 * Mawsūʿah — Hadith Encyclopedia. Search and browse the translated Prophetic
 * hadith of HadeethEnc.com (Encyclopedia of Translated Prophetic Hadiths) in
 * any of its ~72 languages, and read each hadith with its grade, source,
 * explanation and benefits alongside the original Arabic.
 *
 * Data: https://hadeethenc.com/api/v1 — free, keyless, CORS-open. Content is
 * shown unmodified and credited to HadeethEnc.com.
 */

const API = 'https://hadeethenc.com/api/v1';
const RTL_LANGS = new Set(['ar', 'ur', 'fa', 'ps', 'ug', 'prs']);
const PER_PAGE = 20;
const LANG_KEY = 'mawsuah-lang';

const dirOf = (lang) => (RTL_LANGS.has(lang) ? 'rtl' : 'ltr');

async function api(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}${path}${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    const err = new Error(`HadeethEnc ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Render the API's search highlights (text with <mark>…</mark>) WITHOUT
// injecting HTML: split on <mark>, strip any other tags, emit React nodes.
function Highlighted({ html }) {
  const parts = String(html || '').split(/<mark>([\s\S]*?)<\/mark>/i);
  const clean = (s) => s.replace(/<[^>]*>/g, '');
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-amber-100 text-inherit rounded px-0.5">{clean(p)}</mark>
    ) : (
      <span key={i}>{clean(p)}</span>
    )
  );
}

// Arabic hadith text: regular Arabic face, but any ﴿…﴾ Qur'anic quotation
// inside it is set in the KFGQPC mushaf font.
function ArabicText({ text, className = '' }) {
  const parts = String(text || '').split(/(﴿[^﴾]*﴾)/);
  return (
    <p dir="rtl" lang="ar" className={`font-arabic ${className}`}>
      {parts.map((p, i) =>
        p.startsWith('﴿') ? <span key={i} className="font-quran text-[1.1em]">{p}</span> : <span key={i}>{p}</span>
      )}
    </p>
  );
}

function pickInitialLang(fromUrl) {
  if (fromUrl) return fromUrl;
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved) return saved;
  } catch { /* storage blocked */ }
  const nav = (typeof navigator !== 'undefined' && navigator.language || 'en').slice(0, 2).toLowerCase();
  return nav || 'en';
}

export default function HadithEncyclopedia() {
  const [params, setParams] = useSearchParams();
  const [languages, setLanguages] = useState([]);
  const [lang, setLang] = useState(() => pickInitialLang(params.get('lang')));
  const [query, setQuery] = useState(params.get('q') || '');
  const [submitted, setSubmitted] = useState(params.get('q') || '');

  const [categories, setCategories] = useState([]);
  const [catStatus, setCatStatus] = useState('idle');
  const [expanded, setExpanded] = useState({});
  const [activeCat, setActiveCat] = useState(params.get('cat') || null);
  const [page, setPage] = useState(1);

  const [list, setList] = useState({ status: 'idle', items: [], lastPage: 1, total: 0 });
  const [openId, setOpenId] = useState(params.get('h') || null);
  const inputRef = useRef(null);

  // Languages — fall back to English if the stored/browser language isn't offered.
  useEffect(() => {
    api('/languages')
      .then((rows) => {
        setLanguages(rows || []);
        if (rows?.length && !rows.some((l) => l.code === lang)) setLang('en');
      })
      .catch(() => setLanguages([{ code: 'en', native: 'English' }, { code: 'ar', native: 'العربية' }]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the language and keep it in the URL (shareable).
  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
  }, [lang]);

  const syncUrl = useCallback((patch) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') next.delete(k); else next.set(k, String(v));
      }
      return next;
    }, { replace: true });
  }, [setParams]);

  useEffect(() => { syncUrl({ lang }); }, [lang, syncUrl]);

  // Categories in the chosen language.
  useEffect(() => {
    let alive = true;
    setCatStatus('loading');
    api('/categories/list/', { language: lang })
      .then((rows) => { if (alive) { setCategories(Array.isArray(rows) ? rows : []); setCatStatus('ready'); } })
      .catch(() => alive && setCatStatus('error'));
    return () => { alive = false; };
  }, [lang]);

  const tree = useMemo(() => {
    const byParent = {};
    for (const c of categories) (byParent[c.parent_id || 'root'] ||= []).push(c);
    return byParent;
  }, [categories]);
  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  // Results: search (if a phrase is submitted) else the active category.
  useEffect(() => {
    let alive = true;
    if (submitted) {
      setList((l) => ({ ...l, status: 'loading' }));
      api('/hadeeths/search/', { phrase: submitted, language: lang })
        .then((j) => {
          if (!alive) return;
          const rows = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
          setList({ status: 'ready', items: rows.filter((r) => r && r.id), lastPage: 1, total: rows.length, mode: 'search' });
        })
        .catch((err) => {
          if (!alive) return;
          // HadeethEnc answers 400 when a phrase can't be searched in that
          // language (e.g. a Latin word in Arabic) — that's "no match", not an outage.
          if (err?.status === 400) setList({ status: 'ready', items: [], lastPage: 1, total: 0, mode: 'search' });
          else setList({ status: 'error', items: [], lastPage: 1, total: 0 });
        });
    } else if (activeCat) {
      setList((l) => ({ ...l, status: 'loading' }));
      api('/hadeeths/list/', { language: lang, category_id: activeCat, page, per_page: PER_PAGE })
        .then((j) => {
          if (!alive) return;
          setList({
            status: 'ready',
            items: j?.data || [],
            lastPage: Number(j?.meta?.last_page) || 1,
            total: Number(j?.meta?.total_items) || 0,
            mode: 'browse',
          });
        })
        .catch(() => alive && setList({ status: 'error', items: [], lastPage: 1, total: 0 }));
    } else {
      setList({ status: 'idle', items: [], lastPage: 1, total: 0 });
    }
    return () => { alive = false; };
  }, [submitted, activeCat, page, lang]);

  const runSearch = (e) => {
    e?.preventDefault();
    const q = query.trim();
    setSubmitted(q);
    setPage(1);
    if (q) setActiveCat(null);
    syncUrl({ q: q || null, cat: q ? null : activeCat });
  };

  const chooseCategory = (id) => {
    setActiveCat(id);
    setSubmitted('');
    setQuery('');
    setPage(1);
    syncUrl({ cat: id, q: null });
  };

  const openHadith = (id) => { setOpenId(id); syncUrl({ h: id }); };
  const closeHadith = () => { setOpenId(null); syncUrl({ h: null }); };

  const dir = dirOf(lang);
  const langName = languages.find((l) => l.code === lang)?.native || lang;
  const activeTitle = activeCat ? catById[activeCat]?.title : null;

  return (
    <>
      <ToolSeo
        path="/tools/hadith"
        title="Mawsūʿah — Hadith Encyclopedia in 70+ languages | The FastTrack Madrasah"
        name="Mawsūʿah — Hadith Encyclopedia"
        description="Search and read authentic Prophetic hadith in over 70 languages — each with its grade, source, explanation and benefits, beside the original Arabic. Data from HadeethEnc.com."
      />

      <div className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-1.5 sm:mb-2 tracking-tight">
            Mawsūʿah <span className="font-arabic text-gray-500" dir="rtl">(موسوعة)</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Hadith Encyclopedia — search and read authentic hadith in your own language, with grade, source,
            explanation and benefits beside the original Arabic.
          </p>

          {/* Language + search */}
          <form onSubmit={runSearch} className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <label className="sm:w-56 shrink-0">
              <span className="sr-only">Language</span>
              <div className="relative">
                <Languages className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={lang}
                  onChange={(e) => { setLang(e.target.value); setPage(1); }}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-9 py-2.5 text-base sm:text-sm text-gray-900 shadow-sm hover:border-gray-400 focus:border-wine-600 focus:ring-2 focus:ring-wine-600/25 outline-none"
                  aria-label="Language"
                >
                  {(languages.length ? languages : [{ code: lang, native: lang }]).map((l) => (
                    <option key={l.code} value={l.code}>{l.native}</option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </label>
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                dir="auto"
                type="search"
                placeholder={`Search hadith in ${langName} — e.g. intention, prayer, parents`}
                className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-base sm:text-sm text-gray-900 placeholder-gray-400 shadow-sm hover:border-gray-400 focus:border-wine-600 focus:ring-2 focus:ring-wine-600/25 outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-wine-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-wine-700 shadow-sm"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
        {/* Categories */}
        <aside className="lg:sticky lg:top-20">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Browse by topic</h2>
          {catStatus === 'loading' && <p className="text-sm text-gray-400">Loading topics…</p>}
          {catStatus === 'error' && <p className="text-sm text-red-700">Couldn&apos;t load topics.</p>}
          {catStatus === 'ready' && (
            <nav dir={dir} className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 max-h-[60vh] lg:max-h-[calc(100vh-8rem)] overflow-y-auto">
              {(tree.root || []).map((root) => (
                <CategoryNode
                  key={root.id}
                  node={root}
                  tree={tree}
                  depth={0}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  activeCat={activeCat}
                  onPick={chooseCategory}
                />
              ))}
            </nav>
          )}
        </aside>

        {/* Results */}
        <section aria-live="polite" className="min-w-0">
          {list.status === 'idle' && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
              <BookOpen className="h-6 w-6 text-wine-600 mx-auto mb-3" />
              <p className="text-sm text-gray-700 font-medium">Search above, or pick a topic to start reading.</p>
              <p className="text-xs text-gray-500 mt-1">Every hadith opens with its grade, source, explanation and the original Arabic.</p>
            </div>
          )}

          {list.status !== 'idle' && (
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-gray-900 truncate" dir={submitted ? 'auto' : dir}>
                {submitted ? <>Results for “{submitted}”</> : activeTitle}
              </h2>
              {list.status === 'ready' && (
                <span className="text-xs text-gray-500 shrink-0">
                  {list.total} {list.total === 1 ? 'hadith' : 'hadiths'}
                </span>
              )}
            </div>
          )}

          {list.status === 'loading' && (
            <div className="flex justify-center py-12 text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
          )}
          {list.status === 'error' && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Couldn&apos;t reach the hadith library. Check your connection and try again.</p>
          )}
          {list.status === 'ready' && list.items.length === 0 && (
            <p className="rounded-lg bg-gray-50 px-4 py-6 text-sm text-gray-600 text-center">
              No hadith matched in {langName}. Try a shorter or different word.
            </p>
          )}

          {list.status === 'ready' && list.items.length > 0 && (
            <ul className="space-y-2.5">
              {list.items.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => openHadith(h.id)}
                    dir={dir}
                    className="w-full text-start rounded-xl border border-gray-200 bg-white px-4 py-3.5 hover:border-wine-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-wine-600/40 outline-none transition"
                  >
                    <p className={`text-[15px] font-medium text-gray-900 leading-snug ${dir === 'rtl' ? 'font-arabic text-base' : ''}`}>
                      {h.title}
                    </p>
                    {h.hadith_text_highlights && (
                      <p className={`mt-1.5 text-sm text-gray-600 line-clamp-2 ${dir === 'rtl' ? 'font-arabic' : ''}`}>
                        <Highlighted html={h.hadith_text_highlights} />
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {list.status === 'ready' && list.mode === 'browse' && list.lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 px-2">Page {page} of {list.lastPage}</span>
              <button
                onClick={() => setPage((p) => Math.min(list.lastPage, p + 1))}
                disabled={page >= list.lastPage}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}

          <p className="mt-8 text-xs text-gray-400">
            Hadith, translations and explanations from{' '}
            <a href="https://hadeethenc.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">HadeethEnc.com</a>{' '}
            — Encyclopedia of Translated Prophetic Hadiths. Shown unmodified.
          </p>
        </section>
      </div>

      {openId && (
        <HadithReader id={openId} lang={lang} languages={languages} onClose={closeHadith} />
      )}
    </>
  );
}

function CategoryNode({ node, tree, depth, expanded, setExpanded, activeCat, onPick }) {
  const kids = tree[node.id] || [];
  const isOpen = !!expanded[node.id];
  const isActive = activeCat === node.id;
  return (
    <div>
      <div className="flex items-stretch" style={{ paddingInlineStart: depth * 14 }}>
        {kids.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => ({ ...e, [node.id]: !e[node.id] }))}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            aria-expanded={isOpen}
            className="px-2 text-gray-400 hover:text-gray-700"
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 rtl:rotate-180" />}
          </button>
        ) : (
          <span className="w-8 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onPick(node.id)}
          className={`flex-1 min-w-0 text-start py-2.5 pe-3 text-sm leading-snug ${
            isActive ? 'text-wine-700 font-semibold' : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <span className="block">{node.title}</span>
          <span className="block text-[11px] text-gray-400 mt-0.5">{node.hadeeths_count}</span>
        </button>
      </div>
      {isOpen && kids.map((k) => (
        <CategoryNode
          key={k.id}
          node={k}
          tree={tree}
          depth={depth + 1}
          expanded={expanded}
          setExpanded={setExpanded}
          activeCat={activeCat}
          onPick={onPick}
        />
      ))}
    </div>
  );
}

function HadithReader({ id, lang: initialLang, languages, onClose }) {
  const [lang, setLang] = useState(initialLang);
  const [state, setState] = useState({ status: 'loading' });
  const [copied, setCopied] = useState(false);
  const closeBtn = useRef(null);

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    api('/hadeeths/one/', { id, language: lang })
      .then((h) => alive && setState({ status: h?.id ? 'ready' : 'error', h }))
      .catch(() => alive && setState({ status: 'error' }));
    return () => { alive = false; };
  }, [id, lang]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const h = state.h;
  const dir = dirOf(lang);
  const rtlFont = dir === 'rtl' ? 'font-arabic' : '';
  const available = useMemo(() => {
    const set = new Set(h?.translations || []);
    return languages.filter((l) => set.has(l.code));
  }, [h, languages]);

  const copyLink = async () => {
    const url = `${window.location.origin}/tools/hadith?lang=${lang}&h=${id}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* blocked */ }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-[#2a1013]/50 sm:p-6" onMouseDown={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={h?.title || 'Hadith'}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full sm:max-w-3xl max-h-[94vh] flex flex-col bg-[#fffdf7] rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-[#eadfce] bg-white">
          <div className="relative">
            <Languages className="h-4 w-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Read in language"
              className="appearance-none rounded-lg border border-gray-300 bg-white pl-8 pr-7 py-1.5 text-sm text-gray-800 hover:border-gray-400 focus:border-wine-600 focus:ring-2 focus:ring-wine-600/25 outline-none max-w-[12rem]"
            >
              {(available.length ? available : languages.filter((l) => l.code === lang)).map((l) => (
                <option key={l.code} value={l.code}>{l.native}</option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {available.length > 0 && <span className="hidden sm:inline text-xs text-gray-400">in {available.length} languages</span>}
          <div className="flex-1" />
          <button onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
            {copied ? <Check className="h-4 w-4 text-wine-700" /> : <Link2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy link'}</span>
          </button>
          <button ref={closeBtn} onClick={onClose} aria-label="Close" className="h-9 w-9 rounded-full inline-flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-wine-600/40 outline-none">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 sm:py-8">
          {state.status === 'loading' && <div className="flex justify-center py-12 text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          {state.status === 'error' && <p className="text-center text-sm text-red-700 py-10">Couldn&apos;t load this hadith in this language.</p>}
          {state.status === 'ready' && h && (
            <article>
              <h2 dir={dir} className={`text-lg sm:text-xl font-semibold text-gray-900 leading-snug ${rtlFont}`}>{h.title}</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {h.grade && <span className="rounded-full bg-wine-50 text-wine-800 border border-wine-100 px-2.5 py-0.5 text-xs font-medium" dir={dir}>{h.grade}</span>}
                {h.attribution && <span className="rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-xs" dir={dir}>{h.attribution}</span>}
              </div>

              <p dir={dir} className={`mt-5 text-[16px] sm:text-[17px] leading-relaxed text-gray-900 whitespace-pre-line ${rtlFont}`}>{h.hadeeth}</p>

              {lang !== 'ar' && h.hadeeth_ar && (
                <div className="mt-6 rounded-xl border border-[#eadfce] bg-white px-4 sm:px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Original Arabic</p>
                  <ArabicText text={h.hadeeth_ar} className="text-xl sm:text-2xl leading-[2] text-gray-900" />
                  {(h.grade_ar || h.attribution_ar) && (
                    <p dir="rtl" className="font-arabic text-sm text-gray-500 mt-2">{[h.grade_ar, h.attribution_ar].filter(Boolean).join(' — ')}</p>
                  )}
                </div>
              )}

              {h.explanation && (
                <section className="mt-7">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Explanation</h3>
                  <p dir={dir} className={`text-[15px] leading-relaxed text-gray-700 whitespace-pre-line ${rtlFont}`}>{h.explanation}</p>
                </section>
              )}

              {Array.isArray(h.hints) && h.hints.length > 0 && (
                <section className="mt-7">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Benefits</h3>
                  <ul dir={dir} className={`space-y-2 ${rtlFont}`}>
                    {h.hints.map((t, i) => (
                      <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-gray-700">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-wine-600 shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="mt-8 text-[11px] text-gray-400">
                Source:{' '}
                <a href={`https://hadeethenc.com/${lang}/browse/hadith/${id}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                  HadeethEnc.com
                </a>{' '}
                — Encyclopedia of Translated Prophetic Hadiths.
              </p>
            </article>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
