import { useState, useMemo, useCallback, useRef } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import {
  TAJWEED_CATEGORIES,
  NAHW_CATEGORIES,
  buildSearchIndex,
  searchTopics,
} from '../../utils/topicMap';

// Surah names for display
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

// Parse content to highlight Quranic references in curly braces
function parseContent(text) {
  if (!text) return [];
  const parts = [];

  // Split on {curly braces} — these contain Quranic text references
  const regex = /\{([^}]+)\}/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'quran', value: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', value: text }];
}

// Render parsed content with highlights
function ContentRenderer({ content }) {
  const parts = useMemo(() => parseContent(content), [content]);

  return (
    <span className="leading-relaxed">
      {parts.map((part, i) =>
        part.type === 'quran' ? (
          <span
            key={i}
            className="font-arabic text-emerald-700 font-semibold text-base sm:text-lg px-1"
            dir="rtl"
          >
            ﴿{part.value}﴾
          </span>
        ) : (
          <span key={i} className="font-arabic text-gray-700" dir="rtl">
            {part.value}
          </span>
        )
      )}
    </span>
  );
}

// Extract the most relevant clause(s) from content for the searched topic.
// For each match of the target term, we take a window extending back to the
// previous clause boundary (. ، ؛ <br>) and forward to the next boundary or
// next {quranic-ref} — whichever comes first. This isolates the specific rule
// clause within an ayah's analysis, which often mixes many rules together.
function extractRelevantContent(content, topic) {
  if (!content || !topic) return content;

  const searchTerms = topic.search_ar || [];
  if (searchTerms.length === 0) return content;

  const clauses = [];
  const seen = new Set();

  for (const term of searchTerms) {
    let searchFrom = 0;
    while (true) {
      const idx = content.indexOf(term, searchFrom);
      if (idx === -1) break;

      // Extend backward to the last clause boundary
      const before = content.substring(0, idx);
      const boundaryRegex = /[.،؛]|<br\s*\/?>/g;
      let lastBoundary = 0;
      let bm;
      while ((bm = boundaryRegex.exec(before)) !== null) {
        lastBoundary = bm.index + bm[0].length;
      }
      const start = lastBoundary;

      // Extend forward: stop at next boundary OR next { (new clause)
      const after = content.substring(idx + term.length);
      let endRel = after.length;
      const termMatch = after.match(/[.،؛]|<br\s*\/?>/);
      if (termMatch) endRel = termMatch.index + termMatch[0].length;
      const nextBrace = after.indexOf('{');
      if (nextBrace !== -1 && nextBrace < endRel) endRel = nextBrace;

      const clause = content.substring(start, idx + term.length + endRel).trim();
      if (clause && !seen.has(clause)) {
        seen.add(clause);
        clauses.push(clause);
      }

      searchFrom = idx + term.length;
    }
  }

  if (clauses.length > 0) {
    return clauses.join(' ').replace(/<br\s*\/?>/g, ' ').trim();
  }

  return content;
}

// Strip Arabic diacritics and normalize alef/ya/ta-marbuta for matching.
// Handles Uthmani script quirks: superscript alef (ٰ U+0670) is implicit alef
// pronunciation, so we convert the preceding letter-sequence to include an
// alef BEFORE stripping diacritics. Also normalizes alef wasla (ٱ).
function normalizeArabic(text) {
  if (!text) return '';
  return text
    // ى followed by superscript alef = alef sound (Uthmani: مَجْرىٰها → مجراها)
    .replace(/ى\u0670/g, 'ا')
    // Any other letter + superscript alef → letter + alef
    .replace(/(.)\u0670/g, '$1ا')
    // Strip all tashkeel and Quranic recitation marks
    .replace(/[\u064B-\u065F\u06D6-\u06ED]/g, '')
    .replace(/\u0640/g, '') // tatweel
    .replace(/[ٱإأآ]/g, 'ا') // alef wasla + variants
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

// Extract Quranic word references from the relevant content
// For tajweed: inline {curly braces} refs
// For nahw: the format is "الكلمة: grammatical analysis." — the word before
// the first colon in each line/segment is the Quranic word being analyzed.
function extractQuranicRefs(content, subject) {
  if (!content) return [];
  const refs = [];

  if (subject === 'nahw') {
    // Split on newlines, </br>, or period+space (end of analysis for one word)
    // Each segment starts with "word:" or "word :"
    const segments = content
      .split(/<br\s*\/?>|\n|(?<=\.)\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const seg of segments) {
      const colonIdx = seg.indexOf(':');
      if (colonIdx > 0 && colonIdx < 40) {
        const word = seg.substring(0, colonIdx).trim();
        // Only Arabic words — skip the full-ayah {...} reference and numbers
        if (word && /^[\u0600-\u06FF\s]+$/.test(word) && !word.includes('{')) {
          refs.push(word);
        }
      }
    }
  } else {
    // Tajweed: inline {ref} patterns
    const regex = /\{([^}]+)\}/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      refs.push(m[1].trim());
    }
  }

  return refs;
}

// Detect if the content is a warning/disclaimer (rule does NOT apply) rather
// than an actual application of the rule. Common in tajweed where warnings
// like "لا إمالة" (no imalah) appear to caution against applying the rule.
function isDisclaimerClause(clause, searchTerms) {
  if (!clause) return false;
  const negationPatterns = [
    /لا\s+\S{0,15}$/, // "لا [term]"
    /ليس\s/,
    /عدم\s/,
    /حتى\s+لا/, // "so that no..."
    /دون\s/, // "without"
    /بدون\s/,
    /ولا\s/,
    /غير\s/,
  ];
  for (const term of searchTerms) {
    const idx = clause.indexOf(term);
    if (idx === -1) continue;
    // Look in the 25 chars before the term for negation
    const before = clause.substring(Math.max(0, idx - 25), idx);
    if (negationPatterns.some((p) => p.test(before))) return true;
  }
  return false;
}

// Render ayah text with specified references highlighted in yellow.
// Matches are done after normalizing diacritics so the highlighted span
// preserves the original (with tashkeel) text.
function AyahWithHighlights({ ayahText, refs }) {
  const segments = useMemo(() => {
    if (!refs || refs.length === 0) return [{ type: 'plain', text: ayahText }];

    // Build normalized ayah + original chars map (char-by-char, same length after regex replace)
    const words = ayahText.split(/(\s+)/); // keep whitespace as separate segments
    const refNorms = refs.map((r) => normalizeArabic(r)).filter(Boolean);

    // Build a list of word-sequences that form each ref
    // For each ref (which may be multi-word), we'll find a matching window in words
    const highlightFlags = new Array(words.length).fill(false);

    for (const refNorm of refNorms) {
      const refWords = refNorm.split(/\s+/).filter(Boolean);
      if (refWords.length === 0) continue;

      for (let i = 0; i < words.length; i++) {
        if (!words[i].trim()) continue;
        // Try matching refWords starting at position i (skipping whitespace)
        let wi = 0;
        let matched = [];
        let idx = i;
        while (idx < words.length && wi < refWords.length) {
          const w = words[idx];
          if (!w.trim()) {
            matched.push(idx);
            idx++;
            continue;
          }
          const wNorm = normalizeArabic(w);
          if (wNorm === refWords[wi] || wNorm.replace(/^[وفبلك]/, '') === refWords[wi]) {
            matched.push(idx);
            wi++;
            idx++;
          } else {
            break;
          }
        }
        if (wi === refWords.length) {
          matched.forEach((mi) => { highlightFlags[mi] = true; });
        }
      }
    }

    // Merge consecutive highlighted words into a single span
    const result = [];
    let buffer = '';
    let bufferHighlight = null;
    for (let i = 0; i < words.length; i++) {
      const flag = highlightFlags[i];
      if (bufferHighlight === null) {
        bufferHighlight = flag;
        buffer = words[i];
      } else if (bufferHighlight === flag) {
        buffer += words[i];
      } else {
        result.push({ type: bufferHighlight ? 'highlight' : 'plain', text: buffer });
        buffer = words[i];
        bufferHighlight = flag;
      }
    }
    if (buffer) {
      result.push({ type: bufferHighlight ? 'highlight' : 'plain', text: buffer });
    }
    return result;
  }, [ayahText, refs]);

  return (
    <p className="font-arabic text-lg sm:text-xl text-gray-900 leading-loose text-right" dir="rtl">
      {segments.map((seg, i) =>
        seg.type === 'highlight' ? (
          <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  );
}

// Single result card
function ResultCard({ result, topic, isPrimary }) {
  const surahName = SURAH_NAMES[result.sura_number] || `Surah ${result.sura_number}`;
  const displayContent = useMemo(
    () => extractRelevantContent(result.content, topic),
    [result.content, topic]
  );
  const quranicRefs = useMemo(
    () => extractQuranicRefs(displayContent, topic?.subject),
    [displayContent, topic]
  );
  const isDisclaimer = useMemo(
    () => !isPrimary && isDisclaimerClause(displayContent, topic?.search_ar || []),
    [displayContent, topic, isPrimary]
  );

  const borderClass = isPrimary
    ? 'border-emerald-300 ring-1 ring-emerald-200'
    : isDisclaimer
    ? 'border-amber-200'
    : 'border-gray-200';

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${borderClass}`}>
      {/* Ayah header */}
      <div className={`px-4 py-2 border-b border-gray-200 flex items-center gap-2 flex-wrap ${isPrimary ? 'bg-emerald-50' : 'bg-gray-50'}`}>
        <span className="text-sm font-medium text-gray-900">
          {result.sura_number}:{result.aya_number}
        </span>
        <span className="text-sm text-gray-500">{surahName}</span>
        <span className="text-sm text-gray-400 font-arabic" dir="rtl">
          {result.sura_name}
        </span>
        {isPrimary && (
          <span className="ml-auto text-xs px-2 py-0.5 bg-emerald-600 text-white rounded-full font-medium">
            ★ Key example
          </span>
        )}
        {!isPrimary && isDisclaimer && (
          <span className="ml-auto text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium">
            Not applied here (warning)
          </span>
        )}
      </div>

      {/* Ayah text with highlighted matches */}
      <div className="px-4 py-3 border-b border-gray-100">
        <AyahWithHighlights ayahText={result.aya_text} refs={quranicRefs} />
      </div>

      {/* Analysis content */}
      <div className="px-4 py-3" dir="rtl">
        <ContentRenderer content={displayContent} />
      </div>
    </div>
  );
}

// Topic browse card
function TopicCard({ topic, onClick, isActive }) {
  return (
    <button
      onClick={() => onClick(topic)}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
        isActive
          ? 'bg-emerald-100 text-emerald-800 font-medium'
          : 'hover:bg-gray-100 text-gray-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <span>{topic.name_en}</span>
        <span className="font-arabic text-xs text-gray-500" dir="rtl">
          {topic.name_ar}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{topic.description}</p>
    </button>
  );
}

function ExamplesFinder() {
  const [query, setQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [subject, setSubject] = useState('tajweed'); // 'tajweed' or 'nahw'
  const [expandedCategories, setExpandedCategories] = useState({});
  const [surahFilter, setSurahFilter] = useState(null);
  const [mobileBrowseOpen, setMobileBrowseOpen] = useState(false);
  const searchRef = useRef(null);

  const PAGE_SIZE = 20;
  const searchIndex = useMemo(() => buildSearchIndex(), []);
  const categories = subject === 'tajweed' ? TAJWEED_CATEGORIES : NAHW_CATEGORIES;

  // Search suggestions from topic map
  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    return searchTopics(query, searchIndex).slice(0, 8);
  }, [query, searchIndex]);

  // Fetch examples from Supabase
  const fetchExamples = useCallback(
    async (topic, pageNum = 0, surah = null) => {
      if (!topic) return;
      setLoading(true);

      try {
        const searchTerms = topic.search_ar;
        const primaries = topic.primary_examples || [];

        // On page 0 with no surah filter, fetch primary examples first
        let primaryRows = [];
        if (pageNum === 0 && !surah && primaries.length > 0) {
          const orFilter = primaries
            .map((p) => `and(sura_number.eq.${p.sura},aya_number.eq.${p.aya})`)
            .join(',');
          const { data: pData } = await supabase
            .from(topic.table)
            .select('*')
            .or(orFilter);
          if (pData) {
            // Preserve the order defined in primary_examples
            primaryRows = primaries
              .map((p) =>
                pData.find((r) => r.sura_number === p.sura && r.aya_number === p.aya)
              )
              .filter(Boolean);
          }
        }

        let q = supabase.from(topic.table).select('*', { count: 'exact' });

        if (searchTerms.length === 1) {
          q = q.ilike('content', `%${searchTerms[0]}%`);
        } else {
          q = q.or(searchTerms.map((t) => `content.ilike.%${t}%`).join(','));
        }

        if (surah) {
          q = q.eq('sura_number', surah);
        }

        const adjustedPageSize = PAGE_SIZE - primaryRows.length;
        const rangeStart = pageNum === 0 ? 0 : pageNum * PAGE_SIZE - primaryRows.length;
        const rangeEnd = rangeStart + (pageNum === 0 ? adjustedPageSize : PAGE_SIZE) - 1;

        q = q
          .order('sura_number', { ascending: true })
          .order('aya_number', { ascending: true })
          .range(rangeStart, rangeEnd);

        const { data, error, count } = await q;

        if (error) {
          console.error('Supabase error:', error);
          return;
        }

        // On page 0, prepend primary rows and dedupe
        let finalRows = data || [];
        if (pageNum === 0 && primaryRows.length > 0) {
          const primaryKeys = new Set(
            primaryRows.map((r) => `${r.sura_number}-${r.aya_number}`)
          );
          finalRows = [
            ...primaryRows,
            ...finalRows.filter(
              (r) => !primaryKeys.has(`${r.sura_number}-${r.aya_number}`)
            ),
          ];
        }

        setResults(finalRows);
        setTotalCount(count || 0);
        setPage(pageNum);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Handle topic selection
  const selectTopic = useCallback(
    (topic) => {
      setSelectedTopic(topic);
      setQuery('');
      setSurahFilter(null);
      setPage(0);
      setMobileBrowseOpen(false);
      fetchExamples(topic, 0, null);
      // Scroll to results on mobile
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchExamples]
  );

  // Handle suggestion click
  const selectSuggestion = useCallback(
    (suggestion) => {
      setSubject(suggestion.subject);
      selectTopic(suggestion);
    },
    [selectTopic]
  );

  // Handle surah filter change
  const handleSurahFilter = useCallback(
    (e) => {
      const val = e.target.value ? parseInt(e.target.value) : null;
      setSurahFilter(val);
      if (selectedTopic) {
        fetchExamples(selectedTopic, 0, val);
      }
    },
    [selectedTopic, fetchExamples]
  );

  // Pagination
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const goToPage = useCallback(
    (p) => {
      if (selectedTopic) {
        fetchExamples(selectedTopic, p, surahFilter);
      }
    },
    [selectedTopic, fetchExamples, surahFilter]
  );

  // Toggle category expand
  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTopic(null);
    setResults([]);
    setTotalCount(0);
    setPage(0);
    setSurahFilter(null);
  };

  return (
    <>
      {/* Page header — matches Blog pattern */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
            Qur'anic Examples Finder
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Search for a tajweed or grammar topic to find real examples from the Qur'an.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Search bar */}
      <div className="relative mb-6">
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in English or Arabic — e.g. 'idgham', 'إخفاء', 'past tense', 'مبتدأ'..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
          dir="auto"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={`${s.subject}-${s.id}`}
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{s.name_en}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {s.subject === 'tajweed' ? 'Tajweed' : 'Nahw'} &middot; {s.category}
                    </span>
                  </div>
                  <span className="font-arabic text-sm text-gray-500" dir="rtl">
                    {s.name_ar}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile browse toggle — only shown on mobile */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileBrowseOpen(!mobileBrowseOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
        >
          <span>Browse topics{selectedTopic ? ` — ${selectedTopic.name_en}` : ''}</span>
          {mobileBrowseOpen ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar: Topic browser — hidden on mobile unless toggled */}
        <div className={`lg:w-72 flex-shrink-0 ${mobileBrowseOpen ? 'block' : 'hidden lg:block'}`}>
          {/* Subject tabs */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4">
            <button
              onClick={() => { setSubject('tajweed'); clearSelection(); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                subject === 'tajweed'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tajweed
            </button>
            <button
              onClick={() => { setSubject('nahw'); clearSelection(); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                subject === 'nahw'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Nahw (Grammar)
            </button>
          </div>

          {/* Category accordion */}
          <div className="space-y-1">
            {categories.map((cat) => {
              const isExpanded = expandedCategories[cat.id] !== false; // default open
              return (
                <div key={cat.id}>
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-lg"
                  >
                    <div>
                      <span>{cat.name_en}</span>
                      <span className="font-arabic text-xs text-gray-400 ml-2" dir="rtl">
                        {cat.name_ar}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-2 space-y-0.5">
                      {cat.topics.map((topic) => (
                        <TopicCard
                          key={topic.id}
                          topic={{
                            ...topic,
                            table:
                              subject === 'tajweed'
                                ? 'quran_tajweed_aya'
                                : 'quran_eerab_aya',
                            subject,
                          }}
                          onClick={selectTopic}
                          isActive={selectedTopic?.id === topic.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main content: Results */}
        <div className="flex-1 min-w-0">
          {selectedTopic ? (
            <>
              {/* Active topic header */}
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                      {selectedTopic.name_en}
                      <span className="font-arabic text-sm sm:text-base text-gray-400 ml-2" dir="rtl">
                        {selectedTopic.name_ar}
                      </span>
                    </h2>
                    <p className="text-sm text-gray-500">
                      {totalCount.toLocaleString()} examples found
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <select
                      value={surahFilter || ''}
                      onChange={handleSurahFilter}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-0"
                    >
                      <option value="">All Surahs</option>
                      {Array.from({ length: 114 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}. {SURAH_NAMES[n]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-gray-400 hover:text-gray-600 px-2 whitespace-nowrap"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {/* English explanation banner */}
                {selectedTopic.explanation_en && (
                  <div className="mt-3 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      {selectedTopic.explanation_en}
                    </p>
                  </div>
                )}
              </div>

              {/* Results */}
              {loading ? (
                <div className="text-center py-20 text-sm text-gray-500">
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {results.map((r) => {
                      const isPrimary = page === 0 && (selectedTopic.primary_examples || []).some(
                        (p) => p.sura === r.sura_number && p.aya === r.aya_number
                      );
                      return (
                        <ResultCard
                          key={`${r.sura_number}-${r.aya_number}`}
                          result={r}
                          topic={selectedTopic}
                          isPrimary={isPrimary}
                        />
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 0}
                        className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-500">
                        Page {page + 1} of {totalPages}
                      </span>
                      <button
                        onClick={() => goToPage(page + 1)}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center py-20 text-sm text-gray-500">
                  No examples found for this topic in the selected surah.
                </p>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="text-center py-20">
              <p className="text-gray-500">
                Search for a topic above or browse the categories to see examples from the Qur'an.
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}

export default ExamplesFinder;
