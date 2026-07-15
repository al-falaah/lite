import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { getYouTubeEmbedUrl } from '../../utils/youtube';
import { processContentForRTL, textDir } from '../../utils/rtl';
import { PROGRAMS } from '../../config/programs';
import { ChevronLeft, ChevronDown, ChevronRight, HelpCircle, BookOpen, Video, X } from 'lucide-react';
import { BTN_SECONDARY } from '../../design/ui';
import { Spinner, EmptyState } from '../common/DataStates';
import DOMPurify from 'dompurify';

const sanitizeContent = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                   'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'div', 'span',
                   'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'img', 'sup',
                   'figure', 'figcaption',
                   'style', 'section', 'header', 'footer', 'nav', 'article',
                   'svg', 'defs', 'linearGradient', 'stop', 'rect', 'circle', 'ellipse',
                   'line', 'polygon', 'text', 'tspan', 'path', 'g'],
    ALLOWED_ATTR: ['class', 'href', 'src', 'alt', 'title', 'target', 'rel', 'style', 'id', 'dir', 'data-footnote', 'loading',
                   'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
                   'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
                   'width', 'height', 'opacity', 'transform', 'text-anchor', 'font-family',
                   'font-size', 'font-weight', 'font-style', 'letter-spacing', 'points',
                   'offset', 'stop-color', 'stop-opacity', 'd', 'direction']
  });
};

const themeClasses = {
  light: {
    // page = tinted backdrop; surface = raised article/card; sidebar = its own panel
    bg: 'bg-slate-100', surface: 'bg-white', border: 'border-slate-200', sidebar: 'bg-white border-slate-200',
    heading: 'text-slate-900', text: 'text-slate-700', muted: 'text-slate-500', faint: 'text-slate-400',
    hover: 'hover:bg-slate-50',
    // nav-item selected: tinted wash + emerald left-accent (NOT a solid brand fill)
    itemActive: 'bg-emerald-50 text-emerald-900', itemActiveBar: 'bg-emerald-600',
    itemIdle: 'text-slate-600', itemNum: 'bg-slate-100 text-slate-500', itemNumActive: 'bg-emerald-600 text-white',
    navBg: 'bg-white/90 border-slate-200', divider: 'border-slate-200', quizBg: 'bg-slate-50',
    chip: 'bg-slate-100 text-slate-600',
  },
  sepia: {
    bg: 'bg-[#e7ddc9]', surface: 'bg-[#f5f1e8]', border: 'border-[#d4c9b8]', sidebar: 'bg-[#f5f1e8] border-[#d4c9b8]',
    heading: 'text-[#3d3229]', text: 'text-[#3d3229]', muted: 'text-[#5a4a3a]', faint: 'text-[#8a7a6a]',
    hover: 'hover:bg-[#ede5d6]',
    itemActive: 'bg-[#e3d8c2] text-[#3d3229]', itemActiveBar: 'bg-emerald-700',
    itemIdle: 'text-[#5a4a3a]', itemNum: 'bg-[#e3d8c2] text-[#8a7a6a]', itemNumActive: 'bg-emerald-700 text-white',
    navBg: 'bg-[#f5f1e8]/90 border-[#d4c9b8]', divider: 'border-[#d4c9b8]', quizBg: 'bg-[#ebe4d8]',
    chip: 'bg-[#e3d8c2] text-[#5a4a3a]',
  },
  dark: {
    bg: 'bg-slate-950', surface: 'bg-slate-900', border: 'border-slate-800', sidebar: 'bg-slate-900 border-slate-800',
    heading: 'text-slate-100', text: 'text-slate-300', muted: 'text-slate-400', faint: 'text-slate-500',
    hover: 'hover:bg-slate-800',
    itemActive: 'bg-emerald-950/60 text-emerald-100', itemActiveBar: 'bg-emerald-500',
    itemIdle: 'text-slate-400', itemNum: 'bg-slate-800 text-slate-400', itemNumActive: 'bg-emerald-600 text-white',
    navBg: 'bg-slate-900/90 border-slate-800', divider: 'border-slate-800', quizBg: 'bg-slate-800/50',
    chip: 'bg-slate-800 text-slate-300',
  },
};

const proseTheme = {
  light: 'prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-li:text-gray-700 prose-code:bg-gray-100 prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-gray-300 prose-blockquote:text-gray-600 prose-th:bg-gray-50 prose-th:border prose-th:border-gray-300 prose-td:border prose-td:border-gray-300 [&_.verse]:bg-emerald-600/5 [&_.verse]:text-gray-900',
  sepia: 'prose-headings:text-[#3d3229] prose-p:text-[#3d3229] prose-a:text-[#2c5f7f] prose-strong:text-[#3d3229] prose-li:text-[#3d3229] prose-li:marker:text-[#8a7a6a] prose-hr:border-[#d4c9b8] prose-code:bg-[#ebe4d8] prose-pre:bg-[#ebe4d8] prose-pre:border prose-pre:border-[#d4c9b8] prose-blockquote:border-[#8a7a6a] prose-blockquote:text-[#5a4a3a] prose-th:bg-[#ebe4d8] prose-th:border prose-th:border-[#d4c9b8] prose-td:border prose-td:border-[#d4c9b8] [&_.verse]:bg-[#ebe4d8] [&_.verse]:text-[#3d3229]',
  dark: 'prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-gray-100 prose-li:text-gray-300 prose-code:bg-gray-800 prose-pre:bg-gray-800 prose-pre:border-gray-700 prose-blockquote:border-gray-600 prose-blockquote:text-gray-400 prose-th:bg-gray-800 prose-th:border prose-th:border-gray-700 prose-td:border prose-td:border-gray-700 [&_.verse]:bg-emerald-500/10 [&_.verse]:text-gray-100',
};

export default function StudentLessons({ enrollments, programs: programsProp, currentWeekByProgram }) {
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
  const [chapterQuizId, setChapterQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // bump to retry after a fetch error
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('lessonTheme') || 'light');
  const [viewMode, setViewMode] = useState('milestones'); // 'milestones' | 'courses'
  const contentRef = useRef(null);

  // Lightbox: clicking any <img> in the lesson body opens it full-size.
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [lightboxAlt, setLightboxAlt] = useState('');
  useEffect(() => {
    if (!lightboxSrc) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightboxSrc(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxSrc]);

  useEffect(() => { localStorage.setItem('lessonTheme', theme); }, [theme]);

  const milestones = PROGRAMS[selectedProgram]?.milestones || [];

  // Fetch courses + all chapters for selected program
  useEffect(() => {
    if (!selectedProgram) { setLoading(false); return; }
    const fetchAll = async () => {
      setLoading(true);
      setFetchError(false);
      const { data: coursesData, error: coursesError } = await supabase
        .from('lesson_courses')
        .select('*')
        .eq('program_id', selectedProgram)
        .order('display_order');
      if (coursesError) {
        console.error('Error fetching lesson courses:', coursesError);
        setFetchError(true);
        setLoading(false);
        return;
      }
      setCourses(coursesData || []);

      if (coursesData?.length) {
        const courseIds = coursesData.map(c => c.id);
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('lesson_chapters')
          .select('*')
          .in('course_id', courseIds)
          .eq('is_published', true)
          .order('week_number', { ascending: true, nullsFirst: false });
        if (chaptersError) {
          console.error('Error fetching lesson chapters:', chaptersError);
          setFetchError(true);
          setLoading(false);
          return;
        }
        setAllChapters(chaptersData || []);
      } else {
        setAllChapters([]);
      }

      setSelectedChapter(null);
      setSelectedCourse(null);
      setLoading(false);
    };
    fetchAll();
  }, [selectedProgram, reloadKey]);

  // Auto-expand the milestone the student is currently in (falls back to the
  // first milestone when no week is known, e.g. teacher view). Re-runs when the
  // parent's schedule data arrives, since currentWeekByProgram loads async.
  const currentWeek = currentWeekByProgram?.[selectedProgram];
  useEffect(() => {
    const programMilestones = PROGRAMS[selectedProgram]?.milestones || [];
    if (!programMilestones.length) return;
    const target = currentWeek
      ? programMilestones.find(m => currentWeek >= m.weekStart && currentWeek <= m.weekEnd)
        || programMilestones[programMilestones.length - 1] // past the end = program finished
      : programMilestones[0];
    setExpandedMilestones({ [target.id]: true });
  }, [selectedProgram, currentWeek]);

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
    if (!selectedChapter) { setChapterHasQuiz(false); setChapterQuizId(null); return; }
    supabase
      .from('lesson_quizzes').select('id')
      .eq('chapter_id', selectedChapter.id).eq('is_published', true).single()
      .then(({ data }) => {
        setChapterHasQuiz(!!data);
        setChapterQuizId(data?.id || null);
      });
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

  // Milestone-grouped structure for the reader sidebar (course-player layout).
  // Uses the same grouping as the browse view so the sidebar mirrors it.
  const readerSections = useMemo(() => {
    const sections = [];
    if (viewMode === 'milestones') {
      milestones.forEach(m => {
        const chaps = milestoneGroups.groups[m.id] || [];
        if (chaps.length) sections.push({ id: `m-${m.id}`, label: m.name || `Milestone ${m.id}`, chapters: chaps });
      });
      if (milestoneGroups.ungrouped.length) {
        sections.push({ id: 'general', label: 'General', chapters: milestoneGroups.ungrouped });
      }
    } else {
      courses.forEach(c => {
        const chaps = courseGroups[c.id] || [];
        if (chaps.length) sections.push({ id: `c-${c.id}`, label: c.title, chapters: chaps });
      });
    }
    return sections;
  }, [viewMode, milestones, milestoneGroups, courses, courseGroups]);
  const navigateChapter = (dir) => {
    const next = dir === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (next >= 0 && next < flatChapters.length) {
      openChapter(flatChapters[next]);
      setShowSidebar(false);
    }
  };

  const contentStartsAsFullDoc = selectedChapter?.content?.trim().startsWith('<!DOCTYPE') ||
    selectedChapter?.content?.trim().startsWith('<html');
  const isFullHtml = selectedChapter?.content_type === 'full_html' || contentStartsAsFullDoc;
  // rich_text tables render in the themed prose path (prose-table styles below);
  // only full HTML documents need the iframe.
  const useIframe = isFullHtml;
  const videoUrl = getYouTubeEmbedUrl(selectedChapter?.video_url);

  if (!uniquePrograms.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title={programsProp ? 'No programs assigned' : 'No active enrollments'}
      />
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
              {ch.week_number && <span className="text-xs text-gray-600 dark:text-gray-400">Week {ch.week_number}</span>}
              {courses.length > 1 && course && (
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{course.title}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {ch.video_url && <Video className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />}
            {ch.content_type === 'full_html' && <span className="text-[10px] text-gray-500 dark:text-gray-400">HTML</span>}
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
          <div className="flex justify-center py-12">
            <Spinner size="sm" />
          </div>
        ) : fetchError ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-700 dark:text-gray-300">Couldn't load your lessons.</p>
            <button onClick={() => setReloadKey(k => k + 1)} className={`${BTN_SECONDARY} mt-3`}>
              Try again
            </button>
          </div>
        ) : allChapters.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No lessons available yet"
            description="Published chapter notes for this program will appear here."
          />
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
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Weeks {m.weekStart}–{m.weekEnd}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {chaps.length > 0 ? (
                            <span className="text-xs text-gray-600 dark:text-gray-400">{chaps.length}</span>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-500">Coming soon</span>
                          )}
                          <ChevronDown className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                        <span className="text-xs text-gray-600 dark:text-gray-400">{milestoneGroups.ungrouped.length}</span>
                        <ChevronDown className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform ${expandedMilestones['general'] ? 'rotate-180' : ''}`} />
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
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">{course.description}</p>
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
  const readerFlatIdx = flatChapters.findIndex(ch => ch.id === selectedChapter?.id);
  const nextChapter = readerFlatIdx >= 0 && readerFlatIdx < flatChapters.length - 1
    ? flatChapters[readerFlatIdx + 1] : null;

  return (
    <div className={`-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 sm:-mt-8 -mb-24 sm:-mb-8 min-h-screen ${t.bg} transition-colors`}>
      {/* Top bar */}
      <div className={`sticky top-0 z-40 border-b backdrop-blur ${t.navBg} transition-colors`}>
        <div className="flex items-center justify-between h-14 px-3 sm:px-5">
          <button
            onClick={() => { setSelectedChapter(null); setSelectedCourse(null); }}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-md ${t.muted} ${t.hover} transition-colors`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">All lessons</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`hidden sm:inline text-sm font-medium truncate max-w-[40vw] ${t.muted}`}>
              {selectedCourse?.title || (PROGRAMS[selectedProgram]?.shortName || '')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cycleTheme}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border ${t.border} ${t.muted} ${t.hover} transition-colors`}>
              {theme === 'light' ? 'Light' : theme === 'sepia' ? 'Sepia' : 'Dark'}
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border lg:hidden ${t.border} ${t.muted}`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              {readerFlatIdx + 1}/{flatChapters.length}
            </button>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky lg:top-14 inset-y-0 left-0 z-30
          w-72 overflow-y-auto border-r ${t.sidebar}
          transition-transform lg:transition-none lg:translate-x-0
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          lg:h-[calc(100vh-3.5rem)] lg:shrink-0
        `}>
          {showSidebar && (
            <div className="fixed inset-0 bg-black/30 z-[-1] lg:hidden" onClick={() => setShowSidebar(false)} />
          )}
          <nav className="p-3 space-y-5">
            {readerSections.map((section, si) => {
              const activeInSection = section.chapters.some(c => c.id === selectedChapter?.id);
              return (
                <div key={section.id}>
                  <div className="flex items-baseline justify-between px-2 mb-1.5">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${activeInSection ? t.heading : t.faint}`}>
                      {section.label}
                    </p>
                    <span className={`text-[10px] font-medium ${t.faint}`}>{section.chapters.length}</span>
                  </div>
                  <div className="space-y-0.5">
                    {section.chapters.map((ch, ci) => {
                      const isActive = selectedChapter?.id === ch.id;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => { openChapter(ch); setShowSidebar(false); }}
                          className={`group relative w-full text-left rounded-lg pl-3 pr-2.5 py-2 flex items-start gap-2.5 transition-colors ${
                            isActive ? t.itemActive : `${t.itemIdle} ${t.hover}`
                          }`}
                        >
                          {isActive && <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full ${t.itemActiveBar}`} />}
                          <span className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-md text-[11px] font-semibold flex items-center justify-center ${
                            isActive ? t.itemNumActive : t.itemNum
                          }`}>
                            {ci + 1}
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-sm leading-snug ${isActive ? 'font-semibold' : 'font-medium'}`}>{ch.title}</span>
                            {ch.week_number && (
                              <span className={`block text-xs mt-0.5 ${t.faint}`}>Week {ch.week_number}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {si < readerSections.length - 1 && <div className={`mt-4 border-t ${t.divider}`} />}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main content — article on a raised surface floating over the tinted page */}
        <main ref={contentRef} className="flex-1 min-w-0 overflow-y-auto">
          <div className="px-0 sm:px-6 lg:px-10 py-0 sm:py-8">
            <div className={`mx-auto max-w-3xl ${t.surface} sm:rounded-2xl sm:border ${t.border} sm:shadow-sm overflow-hidden transition-colors`}>
            {/* Chapter header */}
            <div className={`px-5 sm:px-10 pt-8 sm:pt-12 pb-6 border-b ${t.divider}`}>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {selectedChapter.week_number && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${t.chip}`}>
                    Week {selectedChapter.week_number}
                  </span>
                )}
                {selectedCourse?.title && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${t.chip}`}>
                    {selectedCourse.title}
                  </span>
                )}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${t.chip}`}>
                  Lesson {readerFlatIdx + 1} of {flatChapters.length}
                </span>
              </div>
              <h1
                dir={textDir(selectedChapter.title)}
                className={`text-3xl sm:text-4xl font-bold tracking-tight leading-tight ${textDir(selectedChapter.title) === 'rtl' ? 'text-right' : 'text-left'} ${t.heading}`}
              >
                {selectedChapter.title}
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
            <div className={`lesson-content-protected ${useIframe ? 'p-0' : 'px-4 sm:px-8 py-4 overflow-x-auto'}`}>
              {useIframe ? (
                <iframe
                  srcDoc={isFullHtml ? selectedChapter.content : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;padding:24px;color:#111;line-height:1.7}.tip{background:#eff6ff;border-left:3px solid #60a5fa;padding:12px 16px;margin:16px 0;border-radius:6px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d1d5db;padding:8px 12px;font-size:0.875rem}th{background:#f9fafb;text-align:left;font-weight:600}</style></head><body>${selectedChapter.content}</body></html>`}
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
                  className={`lesson-callouts lesson-theme-${theme} prose max-w-[72ch] mx-auto sm:prose-lg ${proseTheme[theme]} prose-p:leading-[1.75] prose-headings:font-semibold prose-headings:tracking-tight prose-hr:my-10 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-2 prose-a:font-medium prose-a:underline prose-a:underline-offset-2 prose-strong:font-semibold prose-ul:my-4 prose-li:my-1.5 prose-ol:my-4 prose-blockquote:not-italic prose-blockquote:font-normal prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-code:before:content-[''] prose-code:after:content-[''] prose-table:border-collapse prose-table:w-full prose-table:text-sm prose-th:px-3 prose-th:py-2.5 prose-th:text-left prose-th:font-semibold prose-th:text-sm prose-td:px-3 prose-td:py-2.5 prose-td:text-sm prose-img:cursor-zoom-in prose-img:rounded-lg prose-img:my-4 prose-img:mx-auto`}
                  onClick={(e) => {
                    if (e.target.tagName === 'IMG' && e.target.src) {
                      setLightboxSrc(e.target.src);
                      setLightboxAlt(e.target.alt || '');
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeContent(processContentForRTL(selectedChapter.content)) }}
                />
              ) : !videoUrl ? (
                <div className="text-center py-12">
                  <p className={`text-sm ${t.muted}`}>No content available yet</p>
                </div>
              ) : null}
            </div>

            {/* Drill link — gamified replacement for "Test Your Understanding" */}
            {chapterHasQuiz && chapterQuizId && (
              <div className={`border-t px-5 sm:px-10 py-6 text-center ${t.divider} ${t.quizBg}`}>
                <button
                  onClick={() => window.open(`/student/drill/${chapterQuizId}`, '_blank')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  Let's Go and Drill
                </button>
              </div>
            )}

            {/* Course-player chapter navigation */}
            <div className={`border-t px-5 sm:px-10 py-5 ${t.divider}`}>
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => navigateChapter('prev')}
                  disabled={readerFlatIdx <= 0}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    readerFlatIdx > 0 ? `${t.muted} ${t.hover}` : `${t.faint} cursor-not-allowed`
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                {nextChapter ? (
                  <button
                    onClick={() => navigateChapter('next')}
                    className="group inline-flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-left max-w-[70%]"
                  >
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wider text-emerald-100">Next lesson</span>
                      <span className="block text-sm font-semibold truncate">{nextChapter.title}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <span className={`text-sm ${t.faint}`}>End of section</span>
                )}
              </div>
            </div>
            </div>

            {/* Copyright — outside the article surface */}
            <div className="max-w-3xl mx-auto px-5 sm:px-10 py-6 text-center">
              <p className={`text-xs ${t.faint}`}>
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
          padding: 16px 20px;
          margin: 20px 0;
          border-radius: 8px;
          /* background + text color are theme-aware, set via proseTheme [&_.verse] classes */
        }
        .arabic-prose {
          font-family: 'Amiri Quran', 'Traditional Arabic', 'Arabic Typesetting', serif !important;
          font-size: 1.25rem !important;
          line-height: 2 !important;
          direction: rtl;
          text-align: right;
        }

        /* ── Typed callouts ───────────────────────────────────────────
           Default .tip = Note (emerald). Add a modifier class for other
           types: .tip-key (Key terms, slate) · .tip-warning (Caution, amber).
           Structure is shared; colour comes from per-theme CSS variables. */
        .lesson-callouts .tip {
          --c-accent: #059669;
          --c-tint: rgba(5, 150, 105, 0.05);
          --c-label: #047857;
          --c-icon: '💡';
          --c-name: 'Note';
          position: relative;
          margin: 1.5rem 0;
          padding: 1rem 1.25rem 1.1rem 1.25rem;
          border: 1px solid color-mix(in srgb, var(--c-accent) 14%, transparent);
          border-radius: 12px;
          background: var(--c-tint);
        }
        .lesson-callouts .tip.tip-key {
          --c-accent: #475569; --c-tint: rgba(71, 85, 105, 0.06); --c-label: #334155;
          --c-icon: '🔑'; --c-name: 'Key terms';
        }
        .lesson-callouts .tip.tip-warning {
          --c-accent: #d97706; --c-tint: rgba(217, 119, 6, 0.07); --c-label: #b45309;
          --c-icon: '⚠️'; --c-name: 'Caution';
        }
        .lesson-callouts .tip::before {
          content: var(--c-icon) '\\00a0\\00a0' var(--c-name);
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--c-label);
          background: color-mix(in srgb, var(--c-accent) 12%, transparent);
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          margin-bottom: 0.7rem;
        }
        /* Tighten the block's own paragraph/list spacing so the label sits close */
        .lesson-callouts .tip > :first-of-type { margin-top: 0; }
        .lesson-callouts .tip > :last-child { margin-bottom: 0; }

        /* Sepia: warm the tints/labels to sit on the cream page */
        .lesson-theme-sepia .tip { --c-tint: rgba(93, 74, 58, 0.08); }
        .lesson-theme-sepia .tip { --c-accent: #8a7a6a; --c-label: #5a4a3a; }
        .lesson-theme-sepia .tip.tip-key { --c-accent: #6b5d4f; --c-label: #4a3d30; }
        .lesson-theme-sepia .tip.tip-warning { --c-accent: #b45309; --c-label: #92400e; }

        /* Dark: lift tints so the block reads on the near-black surface */
        .lesson-theme-dark .tip { --c-tint: rgba(16, 185, 129, 0.10); --c-accent: #34d399; --c-label: #6ee7b7; }
        .lesson-theme-dark .tip.tip-key { --c-tint: rgba(148, 163, 184, 0.12); --c-accent: #94a3b8; --c-label: #cbd5e1; }
        .lesson-theme-dark .tip.tip-warning { --c-tint: rgba(245, 158, 11, 0.12); --c-accent: #fbbf24; --c-label: #fcd34d; }
      `}</style>

      {/* Image lightbox: any <img> inside the prose body opens here on tap. */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-[100] p-4"
          onClick={() => setLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightboxAlt || 'Image'}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxSrc(null); }}
            className="absolute top-4 right-4 inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxSrc}
            alt={lightboxAlt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
          {lightboxAlt && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-md max-w-[90vw] text-center">
              {lightboxAlt}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
