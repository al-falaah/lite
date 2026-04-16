import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Globe, Languages } from 'lucide-react';

const TOTAL_PAGES = 604;

const JUZ_STARTS = [
  1,22,42,62,82,102,121,142,162,182,
  201,222,242,262,282,302,322,332,354,372,
  392,412,432,452,472,492,512,532,554,572
];

function getJuz(page) {
  for (let i = JUZ_STARTS.length - 1; i >= 0; i--) {
    if (page >= JUZ_STARTS[i]) return i + 1;
  }
  return 1;
}

function PageInsights() {
  const [pages, setPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('both');
  const inputRef = useRef(null);
  const touchStartX = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    fetch('/content/fawaed_pages.json')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load page insights data');
        return r.json();
      })
      .then((data) => {
        const map = {};
        for (const p of data) {
          map[p.page_number] = p.insights || p.content;
        }
        setPages(map);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const goTo = useCallback((n) => {
    const clamped = Math.max(1, Math.min(TOTAL_PAGES, n));
    setCurrentPage(clamped);
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(inputRef.current?.value, 10);
    if (!isNaN(val)) goTo(val);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diff) < 60) return;
    if (diff > 0) goTo(currentPage + 1);
    else goTo(currentPage - 1);
  };

  const rawData = pages?.[currentPage];
  const isBilingual = rawData && Array.isArray(rawData) && rawData.length > 0 && typeof rawData[0] === 'object' && rawData[0].ar;

  const insights = isBilingual
    ? rawData
    : rawData
      ? (Array.isArray(rawData) ? rawData : [rawData])
          .flatMap((s) => (typeof s === 'string' ? s.split('\n') : []))
          .map((l) => ({ ar: l.replace(/^[•\-–]\s*/, '').trim(), en: '' }))
          .filter((b) => b.ar)
      : [];

  const juzNumber = getJuz(currentPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const hasEnglish = isBilingual && insights.some((b) => b.en);

  return (
    <>
      <Helmet>
        <title>Safha — Qur'an Page Insights | The FastTrack Madrasah</title>
        <meta name="description" content="Browse scholar-curated benefits and lessons from every page of the Qur'an (604 pages) with English translation. Free tool by The FastTrack Madrasah." />
      </Helmet>
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-1.5 sm:mb-2 tracking-tight">
            Safha
          </h1>
          <p className="text-xs sm:text-base text-gray-600">
            Qur'an Page Insights — Scholar-curated benefits and lessons from every page of the Qur'an (604 pages).
          </p>
        </div>
      </div>

      <div
        className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8"
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2.5 sm:p-2 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center">
            <form onSubmit={handleInputSubmit} className="flex items-center gap-1.5 sm:gap-2">
              <label className="text-xs sm:text-sm text-gray-500">Page</label>
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                min={1}
                max={TOTAL_PAGES}
                defaultValue={currentPage}
                key={currentPage}
                onBlur={handleInputSubmit}
                className="w-14 sm:w-16 text-center text-sm font-medium border border-gray-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-[16px]"
              />
              <span className="text-xs sm:text-sm text-gray-400">/ {TOTAL_PAGES}</span>
            </form>
          </div>

          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= TOTAL_PAGES}
            className="p-2.5 sm:p-2 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Page info badges + language toggle */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-5 sm:mb-6 flex-wrap">
          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium">
            Juz {juzNumber}
          </span>
          <span className="bg-gray-100 px-2.5 py-1 rounded-full text-[11px] sm:text-xs text-gray-500">
            {insights.length} insight{insights.length !== 1 ? 's' : ''}
          </span>
          {hasEnglish && (
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : lang === 'en' ? 'both' : 'ar')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'Arabic' : lang === 'en' ? 'English' : 'Both'}
            </button>
          )}
        </div>

        {/* Swipe hint on mobile */}
        <p className="text-center text-[10px] text-gray-400 mb-4 sm:hidden">
          Swipe left/right to navigate pages
        </p>

        {/* Insights content */}
        {insights.length > 0 ? (
          <div className={`space-y-3 sm:space-y-4 ${lang === 'en' ? '' : ''}`}>
            {insights.map((item, i) => (
              <div
                key={`${currentPage}-${i}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Arabic */}
                {(lang === 'ar' || lang === 'both') && (
                  <div className="flex gap-2.5 sm:gap-3 p-3 sm:p-4" dir="rtl">
                    <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold flex items-center justify-center mt-1">
                      {i + 1}
                    </span>
                    <p className="text-sm sm:text-base font-arabic text-gray-800" style={{ lineHeight: '2.2' }}>
                      {item.ar}
                    </p>
                  </div>
                )}
                {/* English */}
                {(lang === 'en' || lang === 'both') && item.en && (
                  <div className={`flex gap-2.5 sm:gap-3 p-3 sm:p-4 ${lang === 'both' ? 'border-t border-gray-50 bg-gray-50/50' : ''}`}>
                    {lang === 'en' && (
                      <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                    )}
                    <p className={`text-sm text-gray-700 leading-relaxed ${lang === 'both' ? 'pr-7 sm:pr-9' : ''}`}>
                      {item.en}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No insights available for this page.</p>
          </div>
        )}

        {/* Translation disclaimer */}
        {hasEnglish && lang !== 'ar' && (
          <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-[11px] sm:text-xs text-amber-700 text-center leading-relaxed">
              English translations are AI-generated and may not fully capture the scholarly nuance of the original Arabic.
              For authoritative understanding, please refer to the Arabic text or consult a qualified scholar.
            </p>
          </div>
        )}

        {/* Quick jump by Juz */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-3">Jump to Juz</p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
              <button
                key={j}
                onClick={() => goTo(JUZ_STARTS[j - 1])}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs font-medium transition-colors ${
                  juzNumber === j
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                {j}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default PageInsights;
