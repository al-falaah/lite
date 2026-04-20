import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { getYouTubeEmbedUrl } from '../../utils/youtube';
import { processContentForRTL } from '../../utils/rtl';
import { PROGRAMS } from '../../config/programs';
import { ChevronLeft, ChevronDown, ChevronRight, HelpCircle, BookOpen, Video } from 'lucide-react';
import DOMPurify from 'dompurify';

const sanitizeContent = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                   'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'div', 'span',
                   'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'img', 'sup',
                   'style', 'section', 'header', 'footer', 'nav', 'article',
                   'svg', 'defs', 'linearGradient', 'stop', 'rect', 'circle', 'ellipse',
                   'line', 'polygon', 'text', 'tspan', 'path', 'g'],
    ALLOWED_ATTR: ['class', 'href', 'src', 'alt', 'title', 'target', 'rel', 'style', 'id', 'dir', 'data-footnote',
                   'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
                   'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
                   'width', 'height', 'opacity', 'transform', 'text-anchor', 'font-family',
                   'font-size', 'font-weight', 'font-style', 'letter-spacing', 'points',
                   'offset', 'stop-color', 'stop-opacity', 'd', 'direction']
  });
};

const themeClasses = {
  light: {
    bg: 'bg-white', border: 'border-gray-200', sidebar: 'bg-gray-50 border-gray-200',
    heading: 'text-gray-900', text: 'text-gray-700', muted: 'text-gray-500', faint: 'text-gray-400',
    hover: 'hover:bg-gray-100', active: 'bg-emerald-600 text-white',
    navBg: 'bg-white border-gray-200', divider: 'border-gray-200', quizBg: 'bg-gray-50',
  },
  sepia: {
    bg: 'bg-[#f5f1e8]', border: 'border-[#d4c9b8]', sidebar: 'bg-[#ebe4d8] border-[#d4c9b8]',
    heading: 'text-[#3d3229]', text: 'text-[#3d3229]', muted: 'text-[#5a4a3a]', faint: 'text-[#8a7a6a]',
    hover: 'hover:bg-[#dfd6c8]', active: 'bg-emerald-600 text-white',
    navBg: 'bg-[#f5f1e8] border-[#d4c9b8]', divider: 'border-[#d4c9b8]', quizBg: 'bg-[#ebe4d8]',
  },
  dark: {
    bg: 'bg-gray-900', border: 'border-gray-700', sidebar: 'bg-gray-800 border-gray-700',
    heading: 'text-gray-100', text: 'text-gray-300', muted: 'text-gray-400', faint: 'text-gray-500',
    hover: 'hover:bg-gray-700', active: 'bg-emerald-600 text-white',
    navBg: 'bg-gray-900 border-gray-700', divider: 'border-gray-700', quizBg: 'bg-gray-800/50',
  },
};

const proseTheme = {
  light: 'prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-li:text-gray-700 prose-code:bg-gray-100 prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-gray-300 prose-blockquote:text-gray-600 prose-th:bg-gray-50 prose-th:border-gray-300 prose-td:border-gray-300',
  sepia: 'prose-headings:text-[#3d3229] prose-p:text-[#3d3229] prose-a:text-[#2c5f7f] prose-strong:text-[#3d3229] prose-li:text-[#3d3229] prose-code:bg-[#ebe4d8] prose-pre:bg-[#ebe4d8] prose-pre:border prose-pre:border-[#d4c9b8] prose-blockquote:border-[#8a7a6a] prose-blockquote:text-[#5a4a3a] prose-th:bg-[#ebe4d8] prose-th:border-[#d4c9b8] prose-td:border-[#d4c9b8]',
  dark: 'prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-gray-100 prose-li:text-gray-300 prose-code:bg-gray-900 prose-pre:bg-gray-900 prose-pre:border-gray-700 prose-blockquote:border-gray-600 prose-blockquote:text-gray-400 prose-th:bg-gray-900 prose-th:border-gray-700 prose-td:border-gray-700',
};

export default function StudentLessons({ enrollments, programs: programsProp }) {
  // Accept either a direct programs array (teacher use) or derive from enrollments (student use)
  const derivedPrograms = programsProp
    ? programsProp
    : (enrollments || []).filter(e => e.status === 'active').map(e => e.program);
  const uniquePrograms = [...new Set(derivedPrograms.filter(Boolean))];

  const [selectedProgram, setSelectedProgram] = useState(uniquePrograms[0] || null);
  const [courses, setCourses] = useState([]);
  const [allChapters, setAllChapters] = useState([]); // all chapters across all courses for this program
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null); // course of the selected chapter
  const [chapterHasQuiz, setChapterHasQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('lessonTheme') || 'light');
  const [viewMode, setViewMode] = useState('milestones'); // 'milestones' | 'courses'
  const contentRef = useRef(null);

  useEffect(() => { localStorage.setItem('lessonTheme', theme); }, [theme]);

  const milestones = PROGRAMS[selectedProgram]?.milestones || [];

  // Fetch courses + all chapters for selected program
  useEffect(() => {
    if (!selectedProgram) { setLoading(false); return; }
    const fetchAll = async () => {
      setLoading(true);
      const { data: coursesData } = await supabase
        .from('lesson_courses')
        .select('*')
        .eq('program_id', selectedProgram)
        .order('display_order');
      setCourses(coursesData || []);

      if (coursesData?.length) {
        const courseIds = coursesData.map(c => c.id);
        const { data: chaptersData } = await supabase
          .from('lesson_chapters')
          .select('*')
          .in('course_id', courseIds)
          .eq('is_published', true)
          .order('week_number', { ascending: true, nullsFirst: false });
        setAllChapters(chaptersData || []);
      } else {
        setAllChapters([]);
      }

      setSelectedChapter(null);
      setSelectedCourse(null);
      setLoading(false);

      // Auto-expand first milestone that has content
      if (milestones.length) {
        setExpandedMilestones({ [milestones[0].id]: true });
      }
    };
    fetchAll();
  }, [selectedProgram]);

  // Build course lookup
  const courseMap = useMemo(() => {
    const map = {};
    courses.forEach(c => { map[c.id] = c; });
    return map;
  }, [courses]);

  // Group chapters by milestone
  const milestoneGroups = useMemo(() => {
    const groups = {};
    const ungrouped = [];

    allChapters.forEach(ch => {
      if (ch.milestone_index) {
        if (!groups[ch.milestone_index]) groups[ch.milestone_index] = [];
        groups[ch.milestone_index].push(ch);
      } else {
        ungrouped.push(ch);
      }
    });

    // Sort within each group by week_number then chapter_number
    Object.values(groups).forEach(arr => {
      arr.sort((a, b) => (a.week_number || 999) - (b.week_number || 999) || a.chapter_number - b.chapter_number);
    });
    ungrouped.sort((a, b) => a.chapter_number - b.chapter_number);

    return { groups, ungrouped };
  }, [allChapters]);

  // Group chapters by course (for course view)
  const courseGroups = useMemo(() => {
    const groups = {};
    allChapters.forEach(ch => {
      if (!groups[ch.course_id]) groups[ch.course_id] = [];
      groups[ch.course_id].push(ch);
    });
    Object.values(groups).forEach(arr => {
      arr.sort((a, b) => a.chapter_number - b.chapter_number);
    });
    return groups;
  }, [allChapters]);

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
      .from('lesson_quizzes').select('id')
      .eq('chapter_id', selectedChapter.id).eq('is_published', true).single()
      .then(({ data }) => setChapterHasQuiz(!!data));
  }, [selectedChapter]);

  useEffect(() => { contentRef.current?.scrollTo(0, 0); }, [selectedChapter]);

  const cycleTheme = () => setTheme(t => t === 'light' ? 'sepia' : t === 'sepia' ? 'dark' : 'light');
  const t = themeClasses[theme];

  const toggleMilestone = (id) => {
    setExpandedMilestones(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openChapter = (ch) => {
    setSelectedChapter(ch);
    setSelectedCourse(courseMap[ch.course_id] || null);
  };

  // Reader sidebar: scope to the currently-open chapter's course so lessons from
  // different courses don't mix in the list. Also used for prev/next navigation.
  const flatChapters = useMemo(() => {
    if (selectedChapter) {
      return (courseGroups[selectedChapter.course_id] || []);
    }
    if (viewMode === 'milestones') {
      const flat = [];
      milestones.forEach(m => {
        (milestoneGroups.groups[m.id] || []).forEach(ch => flat.push(ch));
      });
      milestoneGroups.ungrouped.forEach(ch => flat.push(ch));
      return flat;
    }
    const flat = [];
    courses.forEach(c => {
      (courseGroups[c.id] || []).forEach(ch => flat.push(ch));
    });
    return flat;
  }, [selectedChapter, viewMode, milestoneGroups, courseGroups, milestones, courses]);

  const currentIndex = flatChapters.findIndex(ch => ch.id === selectedChapter?.id);
  const navigateChapter = (dir) => {
    const next = dir === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (next >= 0 && next < flatChapters.length) {
      openChapter(flatChapters[next]);
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
        <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {programsProp ? 'No programs assigned' : 'No active enrollments'}
        </p>
      </div>
    );
  }

  // Chapter item renderer (shared between milestone and course views)
  const ChapterItem = ({ ch }) => {
    const course = courseMap[ch.course_id];
    return (
      <button
        onClick={() => openChapter(ch)}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{ch.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {ch.week_number && <span className="text-xs text-gray-400 dark:text-gray-500">Week {ch.week_number}</span>}
              {courses.length > 1 && course && (
                <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{course.title}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {ch.video_url && <Video className="h-3.5 w-3.5 text-gray-300 dark:text-gray-500" />}
            {ch.content_type === 'full_html' && <span className="text-[10px] text-gray-300 dark:text-gray-500">HTML</span>}
          </div>
        </div>
      </button>
    );
  };

  // Browse view (milestone accordion or course list)
  if (!selectedChapter) {
    return (
      <div className="space-y-4">
        {/* Program selector */}
        {uniquePrograms.length > 1 && (
          <div className="flex gap-2">
            {uniquePrograms.map(p => (
              <button key={p} onClick={() => setSelectedProgram(p)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedProgram === p ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
        ) : allChapters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No lessons available yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* View toggle */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {PROGRAMS[selectedProgram]?.shortName || selectedProgram} Lessons
              </h2>
              {milestones.length > 0 && (
                <div className="flex text-xs border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('milestones')}
                    className={`px-3 py-1.5 transition-colors ${viewMode === 'milestones' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    By Milestone
                  </button>
                  <button
                    onClick={() => setViewMode('courses')}
                    className={`px-3 py-1.5 transition-colors ${viewMode === 'courses' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    By Course
                  </button>
                </div>
              )}
            </div>

            {/* Milestone accordion view */}
            {viewMode === 'milestones' && milestones.length > 0 ? (
              <div className="space-y-2">
                {milestones.map(m => {
                  const chaps = milestoneGroups.groups[m.id] || [];
                  const isOpen = expandedMilestones[m.id];
                  return (
                    <div key={m.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleMilestone(m.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {m.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Weeks {m.weekStart}–{m.weekEnd}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {chaps.length > 0 ? (
                            <span className="text-xs text-gray-400 dark:text-gray-500">{chaps.length}</span>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600">Coming soon</span>
                          )}
                          <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {isOpen && chaps.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700">
                          {courses
                            .filter(c => chaps.some(ch => ch.course_id === c.id))
                            .map(c => {
                              const courseChaps = chaps
                                .filter(ch => ch.course_id === c.id)
                                .sort((a, b) => a.chapter_number - b.chapter_number);
                              return (
                                <div key={c.id}>
                                  {courses.length > 1 && (
                                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{c.title}</p>
                                    </div>
                                  )}
                                  {courseChaps.map(ch => <ChapterItem key={ch.id} ch={ch} />)}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Ungrouped chapters */}
                {milestoneGroups.ungrouped.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleMilestone('general')}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">General</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{milestoneGroups.ungrouped.length}</span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${expandedMilestones['general'] ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {expandedMilestones['general'] && (
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        {milestoneGroups.ungrouped.map(ch => <ChapterItem key={ch.id} ch={ch} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Course list view */
              <div className="space-y-3">
                {courses.map(course => {
                  const chaps = courseGroups[course.id] || [];
                  if (chaps.length === 0) return null;
                  return (
                    <div key={course.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{course.title}</p>
                        {course.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{course.description}</p>
                        )}
                      </div>
                      <div>
                        {chaps.map(ch => <ChapterItem key={ch.id} ch={ch} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Reader view
  return (
    <div className={`-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 sm:-mt-8 -mb-24 sm:-mb-8 min-h-screen ${t.bg} transition-colors`}>
      {/* Top bar */}
      <div className={`sticky top-0 z-40 border-b ${t.navBg} transition-colors`}>
        <div className="flex items-center justify-between h-12 px-3 sm:px-4">
          <button
            onClick={() => { setSelectedChapter(null); setSelectedCourse(null); }}
            className={`flex items-center gap-1 text-sm ${t.muted}`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span className={`text-sm font-medium truncate max-w-[50%] ${t.heading}`}>
            {selectedCourse?.title || ''}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={cycleTheme} className={`px-2 py-1 text-xs rounded border ${t.border} ${t.muted}`}>
              {theme === 'light' ? 'Light' : theme === 'sepia' ? 'Sepia' : 'Dark'}
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`px-2 py-1 text-xs rounded border lg:hidden ${t.border} ${t.muted}`}
            >
              {currentIndex + 1}/{flatChapters.length}
            </button>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky lg:top-12 inset-y-0 left-0 z-30
          w-64 overflow-y-auto border-r ${t.sidebar}
          transition-transform lg:transition-none lg:translate-x-0
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          lg:h-[calc(100vh-3rem)] lg:shrink-0
        `}>
          {showSidebar && (
            <div className="fixed inset-0 bg-black/20 z-[-1] lg:hidden" onClick={() => setShowSidebar(false)} />
          )}
          <nav className="p-3 space-y-0.5">
            {flatChapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => { openChapter(ch); setShowSidebar(false); }}
                className={`w-full text-left px-2.5 py-2 text-sm rounded transition-colors ${
                  selectedChapter?.id === ch.id ? t.active : `${t.text} ${t.hover}`
                }`}
              >
                <span className="leading-snug">{ch.title}</span>
                {ch.week_number && (
                  <span className={`block text-xs mt-0.5 ${selectedChapter?.id === ch.id ? 'opacity-70' : t.faint}`}>
                    Week {ch.week_number}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main ref={contentRef} className="flex-1 min-w-0 overflow-y-auto">
          <div>
            {/* Chapter header */}
            <div className={`px-4 sm:px-8 pt-6 pb-4 border-b ${t.divider}`}>
              <h1 className={`text-xl sm:text-2xl font-normal ${t.heading}`}>
                {selectedChapter.title}
              </h1>
              {selectedChapter.week_number && (
                <p className={`text-xs mt-1 ${t.faint}`}>
                  Week {selectedChapter.week_number}
                  {selectedCourse ? ` · ${selectedCourse.title}` : ''}
                </p>
              )}
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
                  dangerouslySetInnerHTML={{ __html: sanitizeContent(processContentForRTL(selectedChapter.content)) }}
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
                <span className={t.muted}>{currentIndex + 1} / {flatChapters.length}</span>
                <button
                  onClick={() => navigateChapter('next')}
                  disabled={currentIndex >= flatChapters.length - 1}
                  className={currentIndex < flatChapters.length - 1 ? 'text-emerald-600' : `${t.faint} cursor-not-allowed`}
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Quiz link */}
            {chapterHasQuiz && selectedCourse && (
              <div className={`border-t px-4 sm:px-8 py-4 text-center ${t.divider} ${t.quizBg}`}>
                <button
                  onClick={() => window.open(`/student/quiz/${selectedCourse.slug}/${selectedChapter.slug}`, '_blank')}
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
        </main>
      </div>

      {/* Screen capture protection + Arabic text styles */}
      <style>{`
        @media print { body { display: none !important; } }
        .lesson-content-protected * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        .lesson-content-protected *::selection { background: transparent !important; }
        .verse {
          font-family: 'Amiri Quran', 'Traditional Arabic', 'Arabic Typesetting', serif !important;
          font-size: 28px !important;
          line-height: 2 !important;
          text-align: center;
          direction: rtl;
        }
        .arabic-prose {
          font-family: 'Amiri Quran', 'Traditional Arabic', 'Arabic Typesetting', serif !important;
          font-size: 1.25rem !important;
          line-height: 2 !important;
          direction: rtl;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
