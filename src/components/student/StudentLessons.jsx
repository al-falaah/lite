import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { getYouTubeEmbedUrl } from '../../utils/youtube';
import { PROGRAMS } from '../../config/programs';
import { ChevronLeft, ChevronRight, HelpCircle, BookOpen, Moon, Sun } from 'lucide-react';
import DOMPurify from 'dompurify';

const sanitizeContent = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                   'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'div', 'span',
                   'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'img', 'sup',
                   'style', 'section', 'header', 'footer', 'nav', 'article',
                   'svg', 'defs', 'linearGradient', 'stop', 'rect', 'circle', 'ellipse',
                   'line', 'polygon', 'text', 'tspan', 'path', 'g'],
    ALLOWED_ATTR: ['class', 'href', 'src', 'alt', 'title', 'target', 'rel', 'style', 'id', 'data-footnote',
                   'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
                   'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
                   'width', 'height', 'opacity', 'transform', 'text-anchor', 'font-family',
                   'font-size', 'font-weight', 'font-style', 'letter-spacing', 'points',
                   'offset', 'stop-color', 'stop-opacity', 'd', 'direction']
  });
};

const themeClasses = {
  light: {
    bg: 'bg-white',
    border: 'border-gray-200',
    sidebar: 'bg-gray-50 border-gray-200',
    heading: 'text-gray-900',
    text: 'text-gray-700',
    muted: 'text-gray-500',
    faint: 'text-gray-400',
    hover: 'hover:bg-gray-100',
    active: 'bg-emerald-600 text-white',
    navBg: 'bg-white border-gray-200',
    divider: 'border-gray-200',
    quizBg: 'bg-gray-50',
  },
  sepia: {
    bg: 'bg-[#f5f1e8]',
    border: 'border-[#d4c9b8]',
    sidebar: 'bg-[#ebe4d8] border-[#d4c9b8]',
    heading: 'text-[#3d3229]',
    text: 'text-[#3d3229]',
    muted: 'text-[#5a4a3a]',
    faint: 'text-[#8a7a6a]',
    hover: 'hover:bg-[#dfd6c8]',
    active: 'bg-emerald-600 text-white',
    navBg: 'bg-[#f5f1e8] border-[#d4c9b8]',
    divider: 'border-[#d4c9b8]',
    quizBg: 'bg-[#ebe4d8]',
  },
  dark: {
    bg: 'bg-gray-900',
    border: 'border-gray-700',
    sidebar: 'bg-gray-800 border-gray-700',
    heading: 'text-gray-100',
    text: 'text-gray-300',
    muted: 'text-gray-400',
    faint: 'text-gray-500',
    hover: 'hover:bg-gray-700',
    active: 'bg-emerald-600 text-white',
    navBg: 'bg-gray-900 border-gray-700',
    divider: 'border-gray-700',
    quizBg: 'bg-gray-800/50',
  },
};

const proseTheme = {
  light: 'prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-li:text-gray-700 prose-code:bg-gray-100 prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-gray-300 prose-blockquote:text-gray-600 prose-th:bg-gray-50 prose-th:border-gray-300 prose-td:border-gray-300',
  sepia: 'prose-headings:text-[#3d3229] prose-p:text-[#3d3229] prose-a:text-[#2c5f7f] prose-strong:text-[#3d3229] prose-li:text-[#3d3229] prose-code:bg-[#ebe4d8] prose-pre:bg-[#ebe4d8] prose-pre:border prose-pre:border-[#d4c9b8] prose-blockquote:border-[#8a7a6a] prose-blockquote:text-[#5a4a3a] prose-th:bg-[#ebe4d8] prose-th:border-[#d4c9b8] prose-td:border-[#d4c9b8]',
  dark: 'prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-gray-100 prose-li:text-gray-300 prose-code:bg-gray-900 prose-pre:bg-gray-900 prose-pre:border-gray-700 prose-blockquote:border-gray-600 prose-blockquote:text-gray-400 prose-th:bg-gray-900 prose-th:border-gray-700 prose-td:border-gray-700',
};

export default function StudentLessons({ enrollments }) {
  const programs = enrollments
    .filter(e => e.status === 'active')
    .map(e => e.program);
  const uniquePrograms = [...new Set(programs)];

  const [selectedProgram, setSelectedProgram] = useState(uniquePrograms[0] || null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterHasQuiz, setChapterHasQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('lessonTheme') || 'light');
  const contentRef = useRef(null);

  useEffect(() => { localStorage.setItem('lessonTheme', theme); }, [theme]);

  // Fetch courses for selected program
  useEffect(() => {
    if (!selectedProgram) { setLoading(false); return; }
    const fetchCourses = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('lesson_courses')
        .select('*')
        .eq('program_id', selectedProgram)
        .order('display_order');
      setCourses(data || []);
      setSelectedCourse(null);
      setChapters([]);
      setSelectedChapter(null);
      setLoading(false);
    };
    fetchCourses();
  }, [selectedProgram]);

  // Fetch chapters for selected course
  useEffect(() => {
    if (!selectedCourse) return;
    const fetchChapters = async () => {
      const { data } = await supabase
        .from('lesson_chapters')
        .select('*')
        .eq('course_id', selectedCourse.id)
        .eq('is_published', true)
        .order('chapter_number');
      setChapters(data || []);
      if (data?.length > 0) setSelectedChapter(data[0]);
      else setSelectedChapter(null);
    };
    fetchChapters();
  }, [selectedCourse]);

  // Default sepia for full HTML
  useEffect(() => {
    const isFullHtml = selectedChapter?.content_type === 'full_html' ||
      selectedChapter?.content?.trim().startsWith('<!DOCTYPE') ||
      selectedChapter?.content?.trim().startsWith('<html');
    if (isFullHtml) setTheme('sepia');
  }, [selectedChapter]);

  // Check quiz
  useEffect(() => {
    if (!selectedChapter) { setChapterHasQuiz(false); return; }
    supabase
      .from('lesson_quizzes')
      .select('id')
      .eq('chapter_id', selectedChapter.id)
      .eq('is_published', true)
      .single()
      .then(({ data }) => setChapterHasQuiz(!!data));
  }, [selectedChapter]);

  // Scroll to top on chapter change
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [selectedChapter]);

  const cycleTheme = () => setTheme(t => t === 'light' ? 'sepia' : t === 'sepia' ? 'dark' : 'light');

  const t = themeClasses[theme];
  const currentIndex = chapters.findIndex(ch => ch.id === selectedChapter?.id);

  const navigateChapter = (dir) => {
    const next = dir === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (next >= 0 && next < chapters.length) {
      setSelectedChapter(chapters[next]);
      setShowSidebar(false);
    }
  };

  const isFullHtml = selectedChapter?.content_type === 'full_html' ||
    selectedChapter?.content?.trim().startsWith('<!DOCTYPE') ||
    selectedChapter?.content?.trim().startsWith('<html');

  const videoUrl = getYouTubeEmbedUrl(selectedChapter?.video_url);

  if (!uniquePrograms.length) {
    return (
      <div className="text-center py-16">
        <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No active enrollments</p>
      </div>
    );
  }

  // Course list view
  if (!selectedCourse) {
    return (
      <div className="space-y-4">
        {uniquePrograms.length > 1 && (
          <div className="flex gap-2">
            {uniquePrograms.map(p => (
              <button
                key={p}
                onClick={() => setSelectedProgram(p)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedProgram === p
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {PROGRAMS[p]?.shortName || p}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No lessons available yet for {PROGRAMS[selectedProgram]?.shortName || selectedProgram}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {uniquePrograms.length <= 1 && (
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {PROGRAMS[selectedProgram]?.shortName || selectedProgram} Lessons
              </h2>
            )}
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <h3 className="font-medium text-gray-900">{course.title}</h3>
                {course.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Lesson reader view
  return (
    <div className={`-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 sm:-mt-8 -mb-24 sm:-mb-8 min-h-screen ${t.bg} transition-colors`}>
      {/* Top bar */}
      <div className={`sticky top-0 z-40 border-b ${t.navBg} transition-colors`}>
        <div className="flex items-center justify-between h-12 px-3 sm:px-4">
          <button
            onClick={() => { setSelectedCourse(null); setSelectedChapter(null); setChapters([]); }}
            className={`flex items-center gap-1 text-sm ${t.muted}`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span className={`text-sm font-medium truncate max-w-[50%] ${t.heading}`}>
            {selectedCourse.title}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleTheme}
              className={`px-2 py-1 text-xs rounded border ${t.border} ${t.muted}`}
            >
              {theme === 'light' ? 'Light' : theme === 'sepia' ? 'Sepia' : 'Dark'}
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`px-2 py-1 text-xs rounded border lg:hidden ${t.border} ${t.muted}`}
            >
              Ch. {selectedChapter?.chapter_number || '–'}/{chapters.length}
            </button>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Sidebar — always visible on desktop, slide-over on mobile */}
        <aside className={`
          fixed lg:sticky lg:top-12 inset-y-0 left-0 z-30
          w-64 overflow-y-auto border-r ${t.sidebar}
          transition-transform lg:transition-none lg:translate-x-0
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          ${/* height for sticky */ ''}
          lg:h-[calc(100vh-3rem)] lg:shrink-0
        `}>
          {/* Mobile overlay dismiss */}
          {showSidebar && (
            <div className="fixed inset-0 bg-black/20 z-[-1] lg:hidden" onClick={() => setShowSidebar(false)} />
          )}
          <nav className="p-3 space-y-0.5">
            {chapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => { setSelectedChapter(ch); setShowSidebar(false); }}
                className={`w-full text-left px-2.5 py-2 text-sm rounded transition-colors ${
                  selectedChapter?.id === ch.id ? t.active : `${t.text} ${t.hover}`
                }`}
              >
                <span className={`text-xs mr-2 ${selectedChapter?.id === ch.id ? 'opacity-70' : t.faint}`}>
                  {ch.chapter_number}
                </span>
                {ch.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main ref={contentRef} className="flex-1 min-w-0 overflow-y-auto">
          {selectedChapter ? (
            <div>
              {/* Chapter header */}
              <div className={`px-4 sm:px-8 pt-6 pb-4 border-b ${t.divider}`}>
                <h1 className={`text-xl sm:text-2xl font-normal ${t.heading}`}>
                  {selectedChapter.chapter_number}. {selectedChapter.title}
                </h1>
              </div>

              {/* Video embed */}
              {videoUrl && (
                <div className="px-4 sm:px-8 pt-4">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={videoUrl}
                      title={selectedChapter.title}
                      className="absolute inset-0 w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className={`lesson-content-protected ${isFullHtml ? 'p-0' : 'px-4 sm:px-8 py-4'}`}>
                {isFullHtml ? (
                  <iframe
                    srcDoc={selectedChapter.content}
                    title={selectedChapter.title}
                    className="w-full border-0 block"
                    style={{ minHeight: '80vh' }}
                    sandbox="allow-same-origin"
                    onLoad={(e) => {
                      const doc = e.target.contentDocument;
                      if (doc) {
                        e.target.style.height = doc.documentElement.scrollHeight + 'px';
                        const observer = new ResizeObserver(() => {
                          e.target.style.height = doc.documentElement.scrollHeight + 'px';
                        });
                        observer.observe(doc.documentElement);
                      }
                    }}
                  />
                ) : selectedChapter.content ? (
                  <div
                    className={`prose max-w-none ${proseTheme[theme]} prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-a:no-underline prose-ul:my-4 prose-li:my-1 prose-ol:my-4 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-[''] prose-table:border-collapse prose-table:w-full prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-sm prose-td:px-3 prose-td:py-2 prose-td:text-sm`}
                    dangerouslySetInnerHTML={{ __html: sanitizeContent(selectedChapter.content) }}
                  />
                ) : !videoUrl ? (
                  <div className="text-center py-12">
                    <p className={`text-sm ${t.muted}`}>No content available yet</p>
                  </div>
                ) : null}
              </div>

              {/* Chapter navigation */}
              <div className={`border-t px-4 sm:px-8 py-3 ${t.divider}`}>
                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => navigateChapter('prev')}
                    disabled={currentIndex <= 0}
                    className={currentIndex > 0 ? 'text-emerald-600' : `${t.faint} cursor-not-allowed`}
                  >
                    ← Previous
                  </button>
                  <span className={t.muted}>
                    {selectedChapter.chapter_number} / {chapters.length}
                  </span>
                  <button
                    onClick={() => navigateChapter('next')}
                    disabled={currentIndex >= chapters.length - 1}
                    className={currentIndex < chapters.length - 1 ? 'text-emerald-600' : `${t.faint} cursor-not-allowed`}
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* Quiz link */}
              {chapterHasQuiz && (
                <div className={`border-t px-4 sm:px-8 py-4 text-center ${t.divider} ${t.quizBg}`}>
                  <button
                    onClick={() => {
                      // Open quiz in a new route context (we'll use window.open for now since we're inside a tab)
                      window.open(`/student/quiz/${selectedCourse.slug}/${selectedChapter.slug}`, '_blank');
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Test Your Understanding
                  </button>
                </div>
              )}

              {/* Copyright */}
              <div className={`border-t px-4 sm:px-8 py-3 text-center ${t.divider} ${t.quizBg}`}>
                <p className={`text-xs ${t.muted}`}>
                  &copy; {new Date().getFullYear()} The FastTrack Madrasah. All rights reserved.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className={`h-10 w-10 mx-auto mb-3 ${t.faint}`} />
              <p className={`text-sm ${t.muted}`}>Select a chapter</p>
            </div>
          )}
        </main>
      </div>

      {/* Screen capture protection styles */}
      <style>{`
        @media print { body { display: none !important; } }
        .lesson-content-protected * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        .lesson-content-protected *::selection { background: transparent !important; }
      `}</style>
    </div>
  );
}
