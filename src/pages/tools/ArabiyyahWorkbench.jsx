import { Helmet } from 'react-helmet-async';
import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, X, BookOpen, Layers } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { NAHW_CATEGORIES } from '../../utils/topicMap';
import { normalizeUthmani } from '../../utils/uthmani';

/**
 * Arabiyyah Workbench — pick a grammar (nahw) topic, get Qurʾān verses that
 * demonstrate it, and tap any word to explore its ROOT (and other verses it
 * occurs in) and its QIRĀʾĀT (variant readings). Built on the imported
 * quran_word_root / quran_root_stats / quran_word_qiraat tables, alongside the
 * existing quran_eerab_aya nahw examples.
 *
 * Source: Tafsir Center for Quranic Studies (tafsir.net), CC BY 4.0.
 */

const SURAH_NAMES = {
  1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: 'Aal-Imran', 4: 'An-Nisa', 5: 'Al-Maidah',
  6: "Al-An'am", 7: "Al-A'raf", 8: 'Al-Anfal', 9: 'At-Tawbah', 10: 'Yunus',
  11: 'Hud', 12: 'Yusuf', 13: "Ar-Ra'd", 14: 'Ibrahim', 15: 'Al-Hijr',
  16: 'An-Nahl', 17: 'Al-Isra', 18: 'Al-Kahf', 19: 'Maryam', 20: 'Ta-Ha',
  21: 'Al-Anbiya', 22: 'Al-Hajj', 23: "Al-Mu'minun", 24: 'An-Nur', 25: 'Al-Furqan',
  26: "Ash-Shu'ara", 27: 'An-Naml', 28: 'Al-Qasas', 29: 'Al-Ankabut', 30: 'Ar-Rum',
  31: 'Luqman', 32: 'As-Sajdah', 33: 'Al-Ahzab', 34: 'Saba', 35: 'Fatir',
  36: 'Ya-Sin', 37: 'As-Saffat', 38: 'Sad', 39: 'Az-Zumar', 40: 'Ghafir',
  41: 'Fussilat', 42: 'Ash-Shura', 43: 'Az-Zukhruf', 44: 'Ad-Dukhan', 45: 'Al-Jathiyah',
  46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'Al-Fath', 49: 'Al-Hujurat', 50: 'Qaf',
  51: 'Adh-Dhariyat', 52: 'At-Tur', 53: 'An-Najm', 54: 'Al-Qamar', 55: 'Ar-Rahman',
  56: "Al-Waqi'ah", 57: 'Al-Hadid', 58: 'Al-Mujadilah', 59: 'Al-Hashr', 60: 'Al-Mumtahanah',
  61: 'As-Saff', 62: "Al-Jumu'ah", 63: 'Al-Munafiqun', 64: 'At-Taghabun', 65: 'At-Talaq',
  66: 'At-Tahrim', 67: 'Al-Mulk', 68: 'Al-Qalam', 69: 'Al-Haqqah', 70: "Al-Ma'arij",
  71: 'Nuh', 72: 'Al-Jinn', 73: 'Al-Muzzammil', 74: 'Al-Muddaththir', 75: 'Al-Qiyamah',
  76: 'Al-Insan', 77: 'Al-Mursalat', 78: 'An-Naba', 79: "An-Nazi'at", 80: "'Abasa",
  81: 'At-Takwir', 82: 'Al-Infitar', 83: 'Al-Mutaffifin', 84: 'Al-Inshiqaq', 85: 'Al-Buruj',
  86: 'At-Tariq', 87: "Al-A'la", 88: 'Al-Ghashiyah', 89: 'Al-Fajr', 90: 'Al-Balad',
  91: 'Ash-Shams', 92: 'Al-Layl', 93: 'Ad-Duha', 94: 'Ash-Sharh', 95: 'At-Tin',
  96: 'Al-Alaq', 97: 'Al-Qadr', 98: 'Al-Bayyinah', 99: 'Az-Zalzalah', 100: 'Al-Adiyat',
  101: "Al-Qari'ah", 102: 'At-Takathur', 103: 'Al-Asr', 104: 'Al-Humazah', 105: 'Al-Fil',
  106: 'Quraysh', 107: "Al-Ma'un", 108: 'Al-Kawthar', 109: 'Al-Kafirun', 110: 'An-Nasr',
  111: 'Al-Masad', 112: 'Al-Ikhlas', 113: 'Al-Falaq', 114: 'An-Nas',
};

const PAGE_SIZE = 20;
// The qeraat "no disagreement among the reciters" boilerplate — filtered out so
// only genuine variant readings surface.
const NO_VARIANT = 'لا خلاف';

// Strip diacritics / normalize alef-ya-ta for matching (mirrors ExamplesFinder).
function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/ىٰ/g, 'ا')
    .replace(/(.)ٰ/g, '$1ا')
    .replace(/[ً-ٟۖ-ۭ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[ٱإأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

// Which rendered words of the ayah match the topic's search words (for the
// yellow highlight). Returns a Set of word indices (into the non-space tokens).
function topicHighlightSet(ayahText, refs) {
  const set = new Set();
  if (!refs || !refs.length) return set;
  const tokens = ayahText.split(/\s+/).filter(Boolean);
  const norms = tokens.map(normalizeArabic);
  const refNorms = refs.map(normalizeArabic).filter(Boolean);
  for (const rn of refNorms) {
    const rw = rn.split(/\s+/).filter(Boolean);
    for (let i = 0; i + rw.length <= tokens.length; i++) {
      let ok = true;
      for (let k = 0; k < rw.length; k++) {
        const w = norms[i + k];
        if (w !== rw[k] && w.replace(/^[وفبلك]/, '') !== rw[k]) { ok = false; break; }
      }
      if (ok) for (let k = 0; k < rw.length; k++) set.add(i + k);
    }
  }
  return set;
}

function TopicCard({ topic, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
        active ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 text-gray-700'
      }`}
    >
      <span className="block text-sm font-medium">{topic.name_en}</span>
      <span className={`block text-xs font-arabic ${active ? 'text-emerald-50' : 'text-gray-500'}`} dir="rtl">
        {topic.name_ar}
      </span>
    </button>
  );
}

export default function ArabiyyahWorkbench() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [surahFilter, setSurahFilter] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [mobileBrowseOpen, setMobileBrowseOpen] = useState(false);
  // active word enrichment: { key: 'sura-aya', wordIndex } ; and the fetched cache
  const [activeWord, setActiveWord] = useState(null);
  const [enrichCache, setEnrichCache] = useState({}); // { 'sura-aya': { roots:{wn:row}, qiraat:{wn:[rows]} } }
  const [rootVerses, setRootVerses] = useState(null); // { root, loading, rows }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchExamples = useCallback(async (topic, pageNum = 0, surah = null) => {
    if (!topic) return;
    setLoading(true);
    setActiveWord(null);
    try {
      const searchTerms = topic.search_ar || [];
      const primaries = topic.primary_examples || [];
      let primaryRows = [];
      if (pageNum === 0 && !surah && primaries.length > 0) {
        const orFilter = primaries.map((p) => `and(sura_number.eq.${p.sura},aya_number.eq.${p.aya})`).join(',');
        const { data: pData } = await supabase.from('quran_eerab_aya').select('*').or(orFilter);
        if (pData) {
          primaryRows = primaries
            .map((p) => pData.find((r) => r.sura_number === p.sura && r.aya_number === p.aya))
            .filter(Boolean);
        }
      }
      let q = supabase.from('quran_eerab_aya').select('*', { count: 'exact' });
      if (searchTerms.length === 1) q = q.ilike('content', `%${searchTerms[0]}%`);
      else if (searchTerms.length > 1) q = q.or(searchTerms.map((t) => `content.ilike.%${t}%`).join(','));
      if (surah) q = q.eq('sura_number', surah);
      const adjustedPageSize = PAGE_SIZE - primaryRows.length;
      const rangeStart = pageNum === 0 ? 0 : pageNum * PAGE_SIZE - primaryRows.length;
      const rangeEnd = rangeStart + (pageNum === 0 ? adjustedPageSize : PAGE_SIZE) - 1;
      q = q.order('sura_number', { ascending: true }).order('aya_number', { ascending: true }).range(rangeStart, rangeEnd);
      const { data, error, count } = await q;
      if (error) { console.error(error); return; }
      let finalRows = data || [];
      if (pageNum === 0 && primaryRows.length > 0) {
        const keys = new Set(primaryRows.map((r) => `${r.sura_number}-${r.aya_number}`));
        finalRows = [...primaryRows, ...finalRows.filter((r) => !keys.has(`${r.sura_number}-${r.aya_number}`))];
      }
      setResults(finalRows);
      setTotalCount(count || 0);
      setPage(pageNum);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectTopic = useCallback((topic) => {
    setSelectedTopic(topic);
    setSurahFilter(null);
    setPage(0);
    setMobileBrowseOpen(false);
    fetchExamples(topic, 0, null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchExamples]);

  // Lazy-fetch a verse's root + qiraat rows once, cache by 'sura-aya'.
  const ensureEnrichment = useCallback(async (sura, aya) => {
    const key = `${sura}-${aya}`;
    if (enrichCache[key]) return enrichCache[key];
    const [rootRes, qRes] = await Promise.all([
      supabase.from('quran_word_root').select('word_number,word,root').eq('sura_number', sura).eq('aya_number', aya).order('word_number'),
      supabase.from('quran_word_qiraat').select('word_number,word,content,note').eq('sura_number', sura).eq('aya_number', aya).order('word_number'),
    ]);
    const roots = {};
    (rootRes.data || []).forEach((r) => { roots[r.word_number] = r; });
    const qiraat = {};
    (qRes.data || []).forEach((r) => {
      if (r.content && !r.content.includes(NO_VARIANT)) {
        (qiraat[r.word_number] = qiraat[r.word_number] || []).push(r);
      }
    });
    const entry = { roots, qiraat };
    setEnrichCache((c) => ({ ...c, [key]: entry }));
    return entry;
  }, [enrichCache]);

  const onWordTap = useCallback(async (sura, aya, wordIndex) => {
    const key = `${sura}-${aya}`;
    if (activeWord && activeWord.key === key && activeWord.wordIndex === wordIndex) {
      setActiveWord(null); // toggle off
      return;
    }
    await ensureEnrichment(sura, aya);
    setActiveWord({ key, wordIndex });
    setRootVerses(null);
  }, [activeWord, ensureEnrichment]);

  // "Other verses with this root" — lazy.
  const loadRootVerses = useCallback(async (root) => {
    setRootVerses({ root, loading: true, rows: [] });
    const [occ, stats] = await Promise.all([
      supabase.from('quran_word_root').select('sura_number,aya_number,word').eq('root', root).order('sura_number').order('aya_number').range(0, 49),
      supabase.from('quran_root_stats').select('occurrence_count,ayah_count').eq('root', root).limit(1),
    ]);
    setRootVerses({
      root,
      loading: false,
      rows: occ.data || [],
      total: stats.data?.[0]?.occurrence_count,
      ayahCount: stats.data?.[0]?.ayah_count,
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Helmet><title>Arabiyyah Workbench — Qurʾān examples by grammar topic</title></Helmet>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Arabiyyah Workbench</h1>
        <p className="mt-1 text-gray-600 text-sm sm:text-base">
          Pick a grammar topic to find Qurʾān verses that demonstrate it — then tap any word to explore its root and its qirāʾāt.
        </p>
      </div>

      {/* Mobile: topic toggle */}
      <button
        onClick={() => setMobileBrowseOpen((v) => !v)}
        className="lg:hidden mb-4 w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700"
      >
        <span className="flex items-center gap-2"><Layers className="h-4 w-4" /> {selectedTopic ? selectedTopic.name_en : 'Browse grammar topics'}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${mobileBrowseOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Topic browser */}
        <aside className={`${mobileBrowseOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="lg:sticky lg:top-4 space-y-1 max-h-[80vh] overflow-y-auto pr-1">
            {NAHW_CATEGORIES.map((cat) => {
              const open = expanded[cat.id] !== false;
              return (
                <div key={cat.id}>
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [cat.id]: !open }))}
                    className="w-full flex items-center justify-between px-2 py-2 text-left text-sm font-semibold text-gray-900"
                  >
                    <span>{cat.name_en}</span>
                    {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </button>
                  {open && (
                    <div className="space-y-0.5 pb-2">
                      {cat.topics.map((t) => (
                        <TopicCard
                          key={t.id}
                          topic={t}
                          active={selectedTopic?.id === t.id}
                          onClick={() => selectTopic(t)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Results */}
        <main>
          {!selectedTopic ? (
            <div className="text-center py-20 text-gray-500">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>Choose a grammar topic to see Qurʾān examples.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedTopic.name_en} <span className="font-arabic text-emerald-700" dir="rtl">{selectedTopic.name_ar}</span>
                  </h2>
                  <p className="text-sm text-gray-500">{totalCount} example{totalCount === 1 ? '' : 's'} found</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={surahFilter || ''}
                    onChange={(e) => { const v = e.target.value ? parseInt(e.target.value) : null; setSurahFilter(v); fetchExamples(selectedTopic, 0, v); }}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
                  >
                    <option value="">All sūrahs</option>
                    {Object.entries(SURAH_NAMES).map(([n, name]) => <option key={n} value={n}>{n}. {name}</option>)}
                  </select>
                </div>
              </div>

              {selectedTopic.explanation_en && (
                <div className="mb-4 text-sm text-gray-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
                  {selectedTopic.explanation_en}
                </div>
              )}

              {loading ? (
                <div className="py-16 text-center text-gray-500">Searching…</div>
              ) : results.length === 0 ? (
                <div className="py-16 text-center text-gray-500">No examples found for this topic.</div>
              ) : (
                <div className="space-y-4">
                  {results.map((r) => (
                    <VerseCard
                      key={`${r.sura_number}-${r.aya_number}`}
                      row={r}
                      topic={selectedTopic}
                      activeWord={activeWord}
                      enrichment={enrichCache[`${r.sura_number}-${r.aya_number}`]}
                      onWordTap={onWordTap}
                      rootVerses={rootVerses}
                      onLoadRootVerses={loadRootVerses}
                    />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button disabled={page === 0} onClick={() => fetchExamples(selectedTopic, page - 1, surahFilter)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40">Previous</button>
                  <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
                  <button disabled={page >= totalPages - 1} onClick={() => fetchExamples(selectedTopic, page + 1, surahFilter)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40">Next</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function VerseCard({ row, topic, activeWord, enrichment, onWordTap, rootVerses, onLoadRootVerses }) {
  const sura = row.sura_number, aya = row.aya_number;
  const key = `${sura}-${aya}`;
  const ayahText = normalizeUthmani(row.aya_text || '');
  const tokens = useMemo(() => ayahText.split(/\s+/).filter(Boolean), [ayahText]);
  const highlight = useMemo(
    () => topicHighlightSet(ayahText, extractNahwRefs(row.content, topic?.search_ar)),
    [ayahText, row.content, topic]
  );
  const isActive = activeWord?.key === key;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-emerald-700">
          {SURAH_NAMES[sura]} {sura}:{aya}
        </span>
        <span className="text-xs text-gray-400">tap a word to explore</span>
      </div>

      {/* Tappable ayah */}
      <p className="font-arabic text-xl sm:text-2xl leading-loose text-right" dir="rtl">
        {tokens.map((tok, i) => {
          const wordNumber = i + 1; // 1-based, aligns with word_number
          const on = isActive && activeWord.wordIndex === i;
          const isHi = highlight.has(i);
          const hasVariant = enrichment?.qiraat?.[wordNumber]?.length > 0;
          return (
            <span key={i}>
              <button
                onClick={() => onWordTap(sura, aya, i)}
                className={`inline rounded px-0.5 transition-colors ${
                  on ? 'bg-emerald-600 text-white'
                  : isHi ? 'bg-yellow-200 text-gray-900 hover:bg-yellow-300'
                  : 'hover:bg-gray-100 text-gray-900'
                }`}
              >
                {tok}
                {hasVariant && <sup className="text-[0.5em] text-emerald-600 font-bold">◆</sup>}
              </button>
              {' '}
            </span>
          );
        })}
      </p>

      {/* Enrichment panel for the active word in this verse */}
      {isActive && enrichment && (
        <WordPanel
          word={tokens[activeWord.wordIndex]}
          wordNumber={activeWord.wordIndex + 1}
          enrichment={enrichment}
          rootVerses={rootVerses}
          onLoadRootVerses={onLoadRootVerses}
        />
      )}
    </div>
  );
}

function WordPanel({ word, wordNumber, enrichment, rootVerses, onLoadRootVerses }) {
  const rootRow = enrichment.roots?.[wordNumber];
  const variants = enrichment.qiraat?.[wordNumber] || [];
  const root = rootRow?.root;

  return (
    <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-arabic text-lg text-gray-900" dir="rtl">{word}</span>
      </div>

      {/* Root */}
      <div className="mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Root</span>
        {root ? (
          <div className="flex items-center flex-wrap gap-2 mt-1">
            <span className="font-arabic text-lg text-emerald-700" dir="rtl">{root}</span>
            <button
              onClick={() => onLoadRootVerses(root)}
              className="text-xs text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
            >
              See other verses with this root
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mt-1">No root recorded for this word.</p>
        )}
      </div>

      {/* Qiraat */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Qirāʾāt (variant readings)</span>
        {variants.length > 0 ? (
          <ul className="mt-1 space-y-2">
            {variants.map((v, i) => (
              <li key={i} className="text-sm text-gray-800 font-arabic leading-relaxed" dir="rtl">
                {v.content}
                {v.note && <span className="block text-xs text-gray-500 mt-0.5">{v.note}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 mt-1">No variant reading — agreed among the reciters.</p>
        )}
      </div>

      {/* Other verses with this root (lazy) */}
      {rootVerses && root && rootVerses.root === root && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          {rootVerses.loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2">
                Root <span className="font-arabic" dir="rtl">{root}</span> — {rootVerses.total} occurrences across {rootVerses.ayahCount} āyāt
                {rootVerses.rows.length < (Number(rootVerses.total) || 0) && ' (first 50 shown)'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rootVerses.rows.map((rv, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5">
                    <span className="text-emerald-700">{rv.sura_number}:{rv.aya_number}</span>
                    <span className="font-arabic text-gray-700" dir="rtl">{rv.word}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Extract ONLY the Quranic words whose grammatical analysis actually mentions
// the topic's search term(s) — i.e. the word(s) that demonstrate THIS topic —
// not every parsed word (which would highlight the whole āyah). Content format
// is "الكلمة: تحليل نحوي." per segment.
function extractNahwRefs(content, searchTerms) {
  if (!content) return [];
  const terms = (searchTerms || []).filter(Boolean);
  const refs = [];
  const segments = content.split(/<br\s*\/?>|\n|(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const colonIdx = seg.indexOf(':');
    if (colonIdx <= 0 || colonIdx >= 40) continue;
    const word = seg.substring(0, colonIdx).trim();
    if (!word || !/^[؀-ۿ\s]+$/.test(word) || word.includes('{')) continue;
    const analysis = seg.substring(colonIdx + 1);
    // Keep only segments whose analysis mentions a topic search term.
    if (terms.length === 0 || terms.some((t) => analysis.includes(t))) refs.push(word);
  }
  return refs;
}
