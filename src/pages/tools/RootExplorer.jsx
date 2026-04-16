import { Helmet } from 'react-helmet-async';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

const SURAH_NAMES = {
  1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: 'Aal-Imran', 4: 'An-Nisa', 5: 'Al-Maidah',
  6: 'Al-An\'am', 7: 'Al-A\'raf', 8: 'Al-Anfal', 9: 'At-Tawbah', 10: 'Yunus',
  11: 'Hud', 12: 'Yusuf', 13: 'Ar-Ra\'d', 14: 'Ibrahim', 15: 'Al-Hijr',
  16: 'An-Nahl', 17: 'Al-Isra', 18: 'Al-Kahf', 19: 'Maryam', 20: 'Ta-Ha',
  21: 'Al-Anbiya', 22: 'Al-Hajj', 23: 'Al-Mu\'minun', 24: 'An-Nur', 25: 'Al-Furqan',
  26: 'Ash-Shu\'ara', 27: 'An-Naml', 28: 'Al-Qasas', 29: 'Al-Ankabut', 30: 'Ar-Rum',
  31: 'Luqman', 32: 'As-Sajdah', 33: 'Al-Ahzab', 34: 'Saba', 35: 'Fatir',
  36: 'Ya-Sin', 37: 'As-Saffat', 38: 'Sad', 39: 'Az-Zumar', 40: 'Ghafir',
  41: 'Fussilat', 42: 'Ash-Shura', 43: 'Az-Zukhruf', 44: 'Ad-Dukhan', 45: 'Al-Jathiyah',
  46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'Al-Fath', 49: 'Al-Hujurat', 50: 'Qaf',
  51: 'Adh-Dhariyat', 52: 'At-Tur', 53: 'An-Najm', 54: 'Al-Qamar', 55: 'Ar-Rahman',
  56: 'Al-Waqi\'ah', 57: 'Al-Hadid', 58: 'Al-Mujadilah', 59: 'Al-Hashr', 60: 'Al-Mumtahanah',
  61: 'As-Saff', 62: 'Al-Jumu\'ah', 63: 'Al-Munafiqun', 64: 'At-Taghabun', 65: 'At-Talaq',
  66: 'At-Tahrim', 67: 'Al-Mulk', 68: 'Al-Qalam', 69: 'Al-Haqqah', 70: 'Al-Ma\'arij',
  71: 'Nuh', 72: 'Al-Jinn', 73: 'Al-Muzzammil', 74: 'Al-Muddaththir', 75: 'Al-Qiyamah',
  76: 'Al-Insan', 77: 'Al-Mursalat', 78: 'An-Naba', 79: 'An-Nazi\'at', 80: '\'Abasa',
  81: 'At-Takwir', 82: 'Al-Infitar', 83: 'Al-Mutaffifin', 84: 'Al-Inshiqaq', 85: 'Al-Buruj',
  86: 'At-Tariq', 87: 'Al-A\'la', 88: 'Al-Ghashiyah', 89: 'Al-Fajr', 90: 'Al-Balad',
  91: 'Ash-Shams', 92: 'Al-Layl', 93: 'Ad-Duha', 94: 'Ash-Sharh', 95: 'At-Tin',
  96: 'Al-Alaq', 97: 'Al-Qadr', 98: 'Al-Bayyinah', 99: 'Az-Zalzalah', 100: 'Al-Adiyat',
  101: 'Al-Qari\'ah', 102: 'At-Takathur', 103: 'Al-Asr', 104: 'Al-Humazah', 105: 'Al-Fil',
  106: 'Quraysh', 107: 'Al-Ma\'un', 108: 'Al-Kawthar', 109: 'Al-Kafirun', 110: 'An-Nasr',
  111: 'Al-Masad', 112: 'Al-Ikhlas', 113: 'Al-Falaq', 114: 'An-Nas',
};

const VERB_FORM_LABELS = {
  '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V',
  '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X', '11': 'XI',
};

const POS_LABELS = { N: 'Noun', V: 'Verb', P: 'Particle' };
const GENDER_LABELS = { M: 'Masculine', F: 'Feminine' };
const NUMBER_LABELS = { S: 'Singular', D: 'Dual', P: 'Plural' };

const DIACRITICS_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
function normalise(s) {
  return s
    .replace(DIACRITICS_RE, '')
    .replace(/[ٱإأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[-\s]/g, '')
    .trim();
}

let cachedData = null;
async function loadRootData() {
  if (cachedData) return cachedData;
  const res = await fetch('/content/root_index.json');
  if (!res.ok) throw new Error('Failed to load root index');
  cachedData = await res.json();
  return cachedData;
}

function RootExplorer() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [expandedLemma, setExpandedLemma] = useState(null);
  const [showAllAyahs, setShowAllAyahs] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    loadRootData()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const search = useCallback((q) => {
    if (!data || !q.trim()) { setResult(null); return; }
    const norm = normalise(q);

    // Direct root match
    for (const [root, info] of Object.entries(data.roots)) {
      if (normalise(root) === norm) {
        setResult({ type: 'root', root, ...info });
        setExpandedLemma(null);
        setShowAllAyahs(false);
        return;
      }
    }

    // Word → root lookup
    const rootIds = data.words[norm];
    if (rootIds && rootIds.length > 0) {
      const rootKey = rootIds[0];
      const info = data.roots[rootKey];
      if (info) {
        setResult({ type: 'word', searchedWord: q.trim(), root: rootKey, ...info });
        setExpandedLemma(null);
        setShowAllAyahs(false);
        return;
      }
    }

    // Fuzzy: try all words that start with the normalised query
    const matches = [];
    for (const [word, rootArr] of Object.entries(data.words)) {
      if (word.startsWith(norm) || word.includes(norm)) {
        for (const r of rootArr) {
          if (!matches.find(m => m.root === r)) {
            matches.push({ root: r, ...data.roots[r] });
          }
        }
      }
      if (matches.length >= 10) break;
    }

    if (matches.length === 1) {
      setResult({ type: 'word', searchedWord: q.trim(), root: matches[0].root, ...matches[0] });
      setExpandedLemma(null);
      setShowAllAyahs(false);
    } else if (matches.length > 1) {
      setResult({ type: 'multi', matches });
    } else {
      setResult({ type: 'none' });
    }
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    search(query);
  };

  const handleSelectRoot = (rootKey) => {
    const info = data.roots[rootKey];
    if (info) {
      setResult({ type: 'root', root: rootKey, ...info });
      setExpandedLemma(null);
      setShowAllAyahs(false);
      setQuery(rootKey);
    }
  };

  const sortedLemmas = useMemo(() => {
    if (!result?.lemmas) return [];
    return Object.entries(result.lemmas)
      .sort((a, b) => b[1].count - a[1].count);
  }, [result]);

  const visibleAyahs = useMemo(() => {
    if (!result?.ayahs) return [];
    return showAllAyahs ? result.ayahs : result.ayahs.slice(0, 10);
  }, [result, showAllAyahs]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-gray-500">Loading root data...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Tasreef — Root Word Explorer | The FastTrack Madrasah</title>
        <meta name="description" content="Enter any Arabic word to discover its root, derived forms, verb patterns, and every Qur'anic occurrence. Free morphology tool by The FastTrack Madrasah." />
      </Helmet>
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
            Tasreef
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Root Word Explorer — Enter any Arabic word or root letters to explore its Qur'anic morphology — root, pattern, derived forms, and every occurrence.
          </p>
          {data && (
            <p className="text-xs text-gray-400 mt-2">
              {data.meta.totalRoots.toLocaleString()} roots across {data.meta.totalWords.toLocaleString()} unique words
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Search */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a word (كتاب) or root (ك ت ب)..."
              dir="rtl"
              className="w-full pl-12 pr-4 py-3 text-[16px] sm:text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              style={{ lineHeight: '2.2' }}
            />
            <button
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['كتب', 'علم', 'رحم', 'قول', 'أمن', 'عبد'].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => { setQuery(example); search(example); }}
                className="text-sm px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 active:bg-emerald-50 active:text-emerald-700 sm:hover:bg-emerald-50 sm:hover:text-emerald-700 transition-colors font-arabic"
              >
                {example}
              </button>
            ))}
          </div>
        </form>

        {/* No result */}
        {result?.type === 'none' && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-1">No root found</p>
            <p className="text-sm">Try a different word or root letters</p>
          </div>
        )}

        {/* Multiple matches */}
        {result?.type === 'multi' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 mb-3">Multiple roots found — select one:</p>
            {result.matches.map((m) => (
              <button
                key={m.root}
                onClick={() => handleSelectRoot(m.root)}
                className="w-full text-right bg-white border border-gray-200 rounded-lg p-3 sm:p-4 active:border-emerald-300 sm:hover:border-emerald-300 sm:hover:shadow-sm transition-all"
              >
                <span className="font-arabic text-lg sm:text-xl text-emerald-700 font-semibold">{m.root}</span>
                <span className="text-xs sm:text-sm text-gray-500 mr-3">
                  {m.occurrences} occurrences, {Object.keys(m.lemmas).length} forms
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Root result */}
        {(result?.type === 'root' || result?.type === 'word') && (
          <div className="space-y-6">
            {/* Root header */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
              {result.type === 'word' && (
                <p className="text-sm text-gray-500 mb-2">
                  <span className="font-arabic text-gray-700">{result.searchedWord}</span> comes from the root:
                </p>
              )}
              <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap" dir="rtl">
                <h2 className="font-arabic text-3xl sm:text-5xl text-emerald-700 font-bold tracking-wide">
                  {result.root.split('').join(' ')}
                </h2>
                <span className="font-arabic text-base sm:text-lg text-gray-500">({result.root})</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
                <span className="bg-emerald-50 text-emerald-700 px-2 sm:px-2.5 py-0.5 rounded-full font-medium">
                  {result.occurrences} occurrences
                </span>
                <span className="bg-gray-100 px-2 sm:px-2.5 py-0.5 rounded-full">
                  {Object.keys(result.lemmas).length} derived forms
                </span>
                <span className="bg-gray-100 px-2 sm:px-2.5 py-0.5 rounded-full">
                  {result.ayahs.length} ayahs shown
                </span>
              </div>
            </div>

            {/* Derived forms / lemmas */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Derived Forms</h3>
              <div className="space-y-2">
                {sortedLemmas.map(([lemma, info]) => (
                  <div key={lemma} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedLemma(expandedLemma === lemma ? null : lemma)}
                      className="w-full flex items-center justify-between p-3 active:bg-gray-50 sm:hover:bg-gray-50 transition-colors min-w-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0" dir="rtl">
                        <span className="font-arabic text-base sm:text-lg text-gray-900 shrink-0">{lemma}</span>
                        <div className="flex flex-wrap gap-1">
                          {info.pos && (
                            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                              info.pos === 'V' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {POS_LABELS[info.pos] || info.pos}
                            </span>
                          )}
                          {info.vf && (
                            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                              Form {VERB_FORM_LABELS[info.vf] || info.vf}
                            </span>
                          )}
                          {info.gender && (
                            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {GENDER_LABELS[info.gender]}
                            </span>
                          )}
                          {info.number && (
                            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {NUMBER_LABELS[info.number]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] sm:text-xs text-gray-400">{info.count}x</span>
                        {expandedLemma === lemma ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    {expandedLemma === lemma && (
                      <div className="border-t border-gray-100 p-3 bg-gray-50">
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="text-gray-400">Lemma:</span> <span className="font-arabic">{lemma}</span></p>
                          {info.pos && <p><span className="text-gray-400">Part of speech:</span> {POS_LABELS[info.pos]}</p>}
                          {info.vf && <p><span className="text-gray-400">Verb form:</span> {VERB_FORM_LABELS[info.vf] || info.vf}</p>}
                          {info.gender && <p><span className="text-gray-400">Gender:</span> {GENDER_LABELS[info.gender]}</p>}
                          {info.number && <p><span className="text-gray-400">Number:</span> {NUMBER_LABELS[info.number]}</p>}
                          <p><span className="text-gray-400">Frequency:</span> {info.count} occurrences in the Qur'an</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ayah occurrences */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                Qur'anic Occurrences
              </h3>
              <div className="space-y-2">
                {visibleAyahs.map((ayah, i) => (
                  <div key={`${ayah.s}:${ayah.a}`} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] sm:text-xs text-gray-400 font-medium">
                        {SURAH_NAMES[ayah.s] || `Surah ${ayah.s}`} ({ayah.s}:{ayah.a})
                      </span>
                      <BookOpen className="h-3.5 w-3.5 text-gray-300" />
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2" dir="rtl">
                      {ayah.words.map((w, j) => (
                        <span
                          key={j}
                          className="inline-flex flex-col items-center gap-0.5 px-1.5 sm:px-2 py-1 rounded bg-emerald-50 border border-emerald-100"
                        >
                          <span className="font-arabic text-sm sm:text-lg text-emerald-800">{w.w}</span>
                          <span className="text-[9px] sm:text-[10px] text-emerald-600">
                            {POS_LABELS[w.pos] || w.pos}
                            {w.vf ? ` (${VERB_FORM_LABELS[w.vf]})` : ''}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {result.ayahs.length > 10 && !showAllAyahs && (
                <button
                  onClick={() => setShowAllAyahs(true)}
                  className="w-full mt-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  Show all {result.ayahs.length} ayahs
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-base">Search for any Arabic word to discover its root</p>
            <p className="text-sm mt-1">Covers all 77,000+ words of the Qur'an</p>
          </div>
        )}
      </div>
    </>
  );
}

export default RootExplorer;
