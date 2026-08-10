import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { getYouTubeEmbedUrl } from '../../utils/youtube';
import { processContentForRTL, textDir } from '../../utils/rtl';
import { PROGRAMS } from '../../config/programs';
import { ChevronLeft, ChevronDown, ChevronRight, HelpCircle, BookOpen, Video, X, CheckCircle, Circle } from 'lucide-react';
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
    // A clean paper reading mode. Self-contained ink values (NOT the dark-tuned
    // --mq-* chalk vars, which are pale on white) — near-black text so the
    // sidebar and captions stay crisp on the white sheet.
    // page = warm off-white backdrop; surface = white article; sidebar = its own panel
    bg: 'bg-[#f4f2ee]', surface: 'bg-white', border: 'border-[#e4e0d8]', sidebar: 'bg-white border-[#e4e0d8]',
    heading: 'text-[#1a1a1a]', text: 'text-[#26262a]', muted: 'text-[#57575e]', faint: 'text-[#6f6f77]',
    hover: 'hover:bg-[#f2f0ec]',
    // nav-item selected: tinted green wash + brand left-accent (NOT a solid fill)
    itemActive: 'bg-[var(--mq-accent-deep)]/10 text-[var(--mq-accent-deeper)]', itemActiveBar: 'bg-[var(--mq-accent-deep)]',
    itemIdle: 'text-[#33333a]', itemNum: 'bg-[#eceae4] text-[#57575e]', itemNumActive: 'bg-[var(--mq-accent-deep)] text-white',
    navBg: 'bg-white/90 border-[#e4e0d8]', divider: 'border-[#e4e0d8]', quizBg: 'bg-[#f4f2ee]',
    chip: 'bg-[#eceae4] text-[#33333a]',
  },
  sepia: {
    bg: 'bg-[#e5dac2]', surface: 'bg-[#f6f1e5]', border: 'border-[#d8ccb4]', sidebar: 'bg-[#f6f1e5] border-[#d8ccb4]',
    heading: 'text-[#332a1e]', text: 'text-[#3a3025]', muted: 'text-[#5c4c38]', faint: 'text-[#7a6850]',
    hover: 'hover:bg-[#efe7d6]',
    itemActive: 'bg-[#e6d9bd] text-[#2f2415]', itemActiveBar: 'bg-[var(--mq-accent-deeper)]',
    itemIdle: 'text-[#4a3c2a]', itemNum: 'bg-[#e6d9bd] text-[#5c4c38]', itemNumActive: 'bg-[var(--mq-accent-deeper)] text-white',
    navBg: 'bg-[#f6f1e5]/90 border-[#d8ccb4]', divider: 'border-[#d8ccb4]', quizBg: 'bg-[#ece2ce]',
    chip: 'bg-[#e6d9bd] text-[#4a3c2a]',
  },
  dark: {
    // The on-world default: chalk on the black glass. Surface is a barely-lifted
    // panel so the article reads as a sheet on the board.
    bg: 'bg-[var(--mq-paper)]', surface: 'bg-[var(--mq-paper-raised)]', border: 'border-[var(--mq-rule)]', sidebar: 'bg-[var(--mq-paper)] border-[var(--mq-rule)]',
    heading: 'text-[var(--mq-ink)]', text: 'text-[var(--mq-ink-soft)]', muted: 'text-[var(--mq-ink-faint)]', faint: 'text-[var(--mq-ink-faint)]',
    hover: 'hover:bg-[var(--mq-paper-tint)]',
    itemActive: 'bg-[var(--mq-accent)]/12 text-[var(--mq-accent)]', itemActiveBar: 'bg-[var(--mq-accent)]',
    itemIdle: 'text-[var(--mq-ink-faint)]', itemNum: 'bg-[var(--mq-paper-tint)] text-[var(--mq-ink-faint)]', itemNumActive: 'bg-[var(--mq-accent)] text-[var(--mq-on-accent)]',
    navBg: 'bg-[var(--mq-paper)]/90 border-[var(--mq-rule)]', divider: 'border-[var(--mq-rule)]', quizBg: 'bg-[var(--mq-paper-raised)]/50',
    chip: 'bg-[var(--mq-paper-raised)] text-[var(--mq-ink-soft)]',
  },
};

const proseTheme = {
  // NOTE on table headers: authored lessons give <th> an inline emerald
  // background + white text, but the reader forces prose-th:bg-* per theme,
  // which wins over the inline background — leaving white-on-pale (invisible)
  // in light/sepia. The [&_th]:text-* below overrides the header text colour
  // to stay legible on whatever background the theme actually renders.
  light: 'prose-headings:text-[#161616] prose-p:text-[#26262a] prose-a:text-[var(--mq-accent-deeper)] prose-strong:text-[#0f0f0f] prose-li:text-[#26262a] prose-li:marker:text-[#8a8a90] prose-hr:border-[#e4e0d8] prose-code:bg-[#f0eee9] prose-code:text-[#26262a] prose-pre:bg-[#f7f5f1] prose-pre:border prose-pre:border-[#e4e0d8] prose-blockquote:border-[var(--mq-accent-deep)] prose-blockquote:text-[#3a3a40] prose-th:bg-[#f0eee9] [&_th]:!text-[#161616] prose-th:border prose-th:border-[#dcd8d0] prose-td:border prose-td:border-[#e4e0d8] [&_.verse]:bg-[var(--mq-accent-deep)]/[0.06] [&_.verse]:text-[#161616]',
  sepia: 'prose-headings:text-[#2f2415] prose-p:text-[#3a3025] prose-a:text-[#8a5a1a] prose-strong:text-[#241b0f] prose-li:text-[#3a3025] prose-li:marker:text-[#7a6850] prose-hr:border-[#d8ccb4] prose-code:bg-[#ece2ce] prose-code:text-[#3a3025] prose-pre:bg-[#ece2ce] prose-pre:border prose-pre:border-[#d8ccb4] prose-blockquote:border-[#a8895a] prose-blockquote:text-[#5c4c38] prose-th:bg-[#ece2ce] [&_th]:!text-[#2f2415] prose-th:border prose-th:border-[#d8ccb4] prose-td:border prose-td:border-[#d8ccb4] [&_.verse]:bg-[#ece2ce] [&_.verse]:text-[#2f2415]',
  dark: 'prose-invert prose-headings:text-[var(--mq-ink)] prose-p:text-[var(--mq-ink-soft)] prose-a:text-[var(--mq-accent)] prose-strong:text-[var(--mq-ink)] prose-li:text-[var(--mq-ink-soft)] prose-code:bg-[var(--mq-paper-sunk)] prose-pre:bg-[var(--mq-paper-sunk)] prose-pre:border prose-pre:border-[var(--mq-rule)] prose-blockquote:border-[var(--mq-accent)] prose-blockquote:text-[var(--mq-ink-soft)] prose-th:bg-[var(--mq-paper-sunk)] [&_th]:!text-[var(--mq-ink)] prose-th:border prose-th:border-[var(--mq-rule)] prose-td:border prose-td:border-[var(--mq-rule)] [&_.verse]:bg-[var(--mq-accent)]/[0.08] [&_.verse]:text-[var(--mq-ink)]',
};

export default function StudentLessons({
  enrollments,
  programs: programsProp,
  currentWeekByProgram,
  // Course-player extras (student portal only; teacher portal passes none):
  autoResume = false,       // student mode: record read-state + show Lessons progress bar
  resumeSignal = 0,         // bump to jump to the student's resume point (Home → Continue)
  onReaderChange,           // (isOpen: bool) => void — portal hides its chrome while reading
  classProgressByProgram,   // { [program]: { completed, total, pct } } — teacher-marked class progress
  onOpenResults,            // () => void — jump to the Results tab from the reader footer
}) {
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
  // Per-chapter drill state: which chapters have a published quiz, and the
  // signed-in user's last attempt per quiz (real completion signal).
  const [quizByChapter, setQuizByChapter] = useState({});   // { chapterId: quizId }
  const [myAttempts, setMyAttempts] = useState({});         // { quizId: { score, total } }
  const [readChapters, setReadChapters] = useState(new Set()); // chapterIds visited (lesson_progress)
  const [reloadKey, setReloadKey] = useState(0); // bump to retry after a fetch error
  const [expandedMilestones, setExpandedMilestones] = useState({});
  // Reader rail: which sections are open, keyed `${program}:${sectionId}` so
  // milestone ids shared across programs can't leak expansion state. Default
  // (no entry) = open only if the section holds the active chapter; explicit
  // user toggles are stored and always win.
  const [expandedSections, setExpandedSections] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  // Default to 'dark' so the reader arrives coherent with the (dark) portal;
  // light/sepia stay available as opt-in reading-comfort modes. A previously
  // saved explicit choice is still honoured.
  const [theme, setTheme] = useState(() => localStorage.getItem('lessonTheme') || 'dark');
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
      const fetchedChapterIds = new Set(); // filled below; used to preserve a valid open chapter
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
        (chaptersData || []).forEach(c => fetchedChapterIds.add(c.id));

        // Drill completion signals (non-blocking — rail works without them).
        // 1. Which chapters have a published quiz; 2. my attempts on those.
        try {
          const chapterIds = (chaptersData || []).map(c => c.id);
          if (chapterIds.length) {
            const { data: quizzes } = await supabase
              .from('lesson_quizzes')
              .select('id, chapter_id')
              .in('chapter_id', chapterIds)
              .eq('is_published', true);
            const qbc = {};
            (quizzes || []).forEach(q => { qbc[q.chapter_id] = q.id; });
            setQuizByChapter(qbc);

            const quizIds = Object.values(qbc);
            const { data: { user } } = await supabase.auth.getUser();
            if (quizIds.length && user) {
              const { data: attempts } = await supabase
                .from('quiz_drill_attempts')
                .select('quiz_id, score, total_questions')
                .eq('student_id', user.id)
                .in('quiz_id', quizIds);
              const att = {};
              (attempts || []).forEach(a => { att[a.quiz_id] = { score: a.score, total: a.total_questions }; });
              setMyAttempts(att);
            } else {
              setMyAttempts({});
            }
            // Read-state (lesson_progress): which chapters this user has opened
            if (user) {
              const { data: readRows } = await supabase
                .from('lesson_progress')
                .select('chapter_id')
                .eq('student_id', user.id)
                .in('chapter_id', chapterIds);
              setReadChapters(new Set((readRows || []).map(r => r.chapter_id)));
            } else {
              setReadChapters(new Set());
            }
          } else {
            setQuizByChapter({});
            setMyAttempts({});
            setReadChapters(new Set());
          }
        } catch (e) {
          console.error('Drill-state fetch failed (non-fatal):', e);
        }
      } else {
        setAllChapters([]);
        setQuizByChapter({});
        setMyAttempts({});
        setReadChapters(new Set());
      }

      // Reset the open chapter ONLY if it doesn't belong to the fetched set
      // (i.e. a real program switch). A blind null here clobbered the chapter
      // auto-resume had just opened when effects double-fire (StrictMode dev)
      // — the reader silently fell back to the browse list on reload.
      setSelectedChapter(prev => (prev && fetchedChapterIds.has(prev.id)) ? prev : null);
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

  // Tell the host when the reader opens/closes (the portal hides its chrome
  // for an immersive, single-bar course-player view while reading).
  useEffect(() => {
    onReaderChange?.(!!selectedChapter);
    return () => onReaderChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapter]);

  // When navigation moves the active chapter into a section (prev/next,
  // auto-resume), make sure that section is open. Never re-collapses sections
  // the user opened — only adds.
  useEffect(() => {
    if (!selectedChapter) return;
    const sec = readerSections.find(s => s.chapters.some(c => c.id === selectedChapter.id));
    if (sec) setExpandedSections(prev => ({ ...prev, [`${selectedProgram}:${sec.id}`]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapter, selectedProgram]);

  // Resume-on-request: the Lessons tab is browse-first (reader opens only when
  // a lesson is clicked). The host's "Continue learning" bumps resumeSignal to
  // jump straight to the student's resume point. Waits for chapters to load;
  // each signal value is honoured exactly once.
  const handledResumeRef = useRef(0);
  useEffect(() => {
    if (!resumeSignal || resumeSignal === handledResumeRef.current) return;
    if (loading || !allChapters.length) return; // re-runs when data arrives
    handledResumeRef.current = resumeSignal;

    const byId = (id) => allChapters.find(ch => ch.id === id);
    let target = null;
    // 1. Last chapter the student had open (persisted by openChapter)
    try { target = byId(localStorage.getItem(`lessonResume:${selectedProgram}`)); } catch { /* ignore */ }
    // 2. The chapter matching the student's current week
    const week = currentWeekByProgram?.[selectedProgram];
    if (!target && week) target = allChapters.find(ch => ch.week_number === week);
    // 3. First chapter of the current milestone
    if (!target && week) {
      const m = milestones.find(x => week >= x.weekStart && week <= x.weekEnd);
      if (m) target = (milestoneGroups.groups[m.id] || [])[0];
    }
    // 4. Anything at all
    if (!target) target = allChapters[0];
    if (target) openChapter(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeSignal, loading, allChapters, selectedProgram]);

  // Drill status for a chapter: null = no quiz; {done:false} = quiz not yet
  // played; {done:true, score, total} = played (last attempt counts).
  const drillState = (chapterId) => {
    const quizId = quizByChapter[chapterId];
    if (!quizId) return null;
    const a = myAttempts[quizId];
    return a ? { done: true, score: a.score, total: a.total } : { done: false };
  };

  // Single source of "is this chapter done": drill played (quiz chapters) or
  // visited (quiz-less chapters). Used by the rail, browse list, and counts.
  const isChapterDone = (ch) => {
    const d = drillState(ch.id);
    return d ? d.done : readChapters.has(ch.id);
  };

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
      // maybeSingle: chapters without a quiz are normal, not 406 errors
      .eq('chapter_id', selectedChapter.id).eq('is_published', true).maybeSingle()
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
    // Remember where the student is so the portal can resume here next visit.
    try { localStorage.setItem(`lessonResume:${selectedProgram}`, ch.id); } catch { /* ignore */ }
    window.scrollTo(0, 0);
    // Record read-state (student portal only) — powers the rail checkmarks for
    // chapters without drills. Fire-and-forget; unique(student,chapter) in DB.
    if (autoResume && !readChapters.has(ch.id)) {
      setReadChapters(prev => new Set(prev).add(ch.id));
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('lesson_progress').upsert(
              { student_id: user.id, chapter_id: ch.id },
              { onConflict: 'student_id,chapter_id', ignoreDuplicates: true }
            );
          }
        } catch (e) { console.error('lesson_progress write failed (non-fatal):', e); }
      })();
    }
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
    const drill = drillState(ch.id);
    const done = isChapterDone(ch);
    return (
      <button
        onClick={() => openChapter(ch)}
        className="w-full text-left px-4 py-3 hover:bg-[var(--mq-paper-sunk)] transition-colors border-b border-[var(--mq-rule-soft)] last:border-0"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            {done ? (
              <CheckCircle className="h-4 w-4 mt-0.5 text-[var(--mq-accent)] flex-shrink-0" />
            ) : drill ? (
              <Circle className="h-4 w-4 mt-0.5 text-[var(--mq-ink-soft)] flex-shrink-0" />
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--mq-ink)] truncate">{ch.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {ch.week_number && <span className="text-xs text-[var(--mq-ink-soft)]">Week {ch.week_number}</span>}
                {drill?.done && (
                  <span className="text-xs text-[var(--mq-accent)] font-medium">Drill {drill.score}/{drill.total}</span>
                )}
                {courses.length > 1 && course && (
                  <span className="text-xs text-[var(--mq-ink-soft)] truncate">{course.title}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {ch.video_url && <Video className="h-3.5 w-3.5 text-[var(--mq-ink-faint)]" />}
            {drill && !drill.done && <HelpCircle className="h-3.5 w-3.5 text-[var(--mq-ink-faint)]" />}
            {ch.content_type === 'full_html' && <span className="text-[10px] text-[var(--mq-ink-faint)]">HTML</span>}
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
                  selectedProgram === p ? 'bg-[var(--mq-accent)] text-white' : 'bg-[var(--mq-paper-tint)] text-[var(--mq-ink-soft)] hover:bg-[var(--mq-rule)]'
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
            <p className="text-sm text-[var(--mq-ink-soft)]">Couldn't load your lessons.</p>
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
              <h2 className="text-lg font-semibold text-[var(--mq-ink)] dark:text-white">
                {PROGRAMS[selectedProgram]?.shortName || selectedProgram} Lessons
              </h2>
              {milestones.length > 0 && (
                <div className="inline-flex items-stretch rounded-[3px] border border-[var(--mq-rule-strong)] overflow-hidden" role="tablist" aria-label="Group lessons">
                  <button
                    role="tab" aria-selected={viewMode === 'milestones'}
                    onClick={() => setViewMode('milestones')}
                    className={`px-3 py-1.5 font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.1em] transition-colors mashq-focus ${viewMode === 'milestones' ? 'bg-[var(--mq-accent)] text-[var(--mq-on-accent)]' : 'text-[var(--mq-ink-faint)] hover:bg-[var(--mq-paper-tint)] hover:text-[var(--mq-ink)]'}`}
                  >
                    By Milestone
                  </button>
                  <button
                    role="tab" aria-selected={viewMode === 'courses'}
                    onClick={() => setViewMode('courses')}
                    className={`px-3 py-1.5 border-l border-[var(--mq-rule-strong)] font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.1em] transition-colors mashq-focus ${viewMode === 'courses' ? 'bg-[var(--mq-accent)] text-[var(--mq-on-accent)]' : 'text-[var(--mq-ink-faint)] hover:bg-[var(--mq-paper-tint)] hover:text-[var(--mq-ink)]'}`}
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
                    <div key={m.id} className="border border-[var(--mq-rule)] rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleMilestone(m.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--mq-paper-sunk)] transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-[var(--mq-ink)]">
                            {m.name}
                          </p>
                          <p className="text-xs text-[var(--mq-ink-soft)] mt-0.5">
                            Weeks {m.weekStart}–{m.weekEnd}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {chaps.length > 0 ? (
                            <span className="text-xs text-[var(--mq-ink-soft)]">{chaps.length}</span>
                          ) : (
                            <span className="text-xs text-[var(--mq-ink-faint)]">Coming soon</span>
                          )}
                          <ChevronDown className={`h-4 w-4 text-[var(--mq-ink-soft)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {isOpen && chaps.length > 0 && (
                        <div className="border-t border-[var(--mq-rule-soft)]">
                          {courses
                            .filter(c => chaps.some(ch => ch.course_id === c.id))
                            .map(c => {
                              const courseChaps = chaps
                                .filter(ch => ch.course_id === c.id)
                                .sort((a, b) => a.chapter_number - b.chapter_number);
                              return (
                                <div key={c.id}>
                                  {courses.length > 1 && (
                                    <div className="px-4 py-2 bg-[var(--mq-paper-sunk)] border-b border-[var(--mq-rule-soft)]">
                                      <p className="text-xs font-medium text-[var(--mq-ink-faint)] uppercase tracking-wide">{c.title}</p>
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
                  <div className="border border-[var(--mq-rule)] rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleMilestone('general')}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--mq-paper-sunk)] transition-colors"
                    >
                      <p className="text-sm font-medium text-[var(--mq-ink)]">General</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--mq-ink-soft)]">{milestoneGroups.ungrouped.length}</span>
                        <ChevronDown className={`h-4 w-4 text-[var(--mq-ink-soft)] transition-transform ${expandedMilestones['general'] ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {expandedMilestones['general'] && (
                      <div className="border-t border-[var(--mq-rule-soft)]">
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
                    <div key={course.id} className="border border-[var(--mq-rule)] rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-[var(--mq-paper-sunk)] border-b border-[var(--mq-rule-soft)]">
                        <p className="text-sm font-medium text-[var(--mq-ink)]">{course.title}</p>
                        {course.description && (
                          <p className="text-xs text-[var(--mq-ink-soft)] mt-0.5 line-clamp-1">{course.description}</p>
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
          <div className="flex items-center gap-1.5 min-w-0">
            <img
              src={theme === 'dark' ? '/favicon-white.svg' : '/favicon.svg'}
              alt="The FastTrack Madrasah"
              className="h-5 w-5 flex-shrink-0"
            />
            <button
              onClick={() => { setSelectedChapter(null); setSelectedCourse(null); }}
              className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-md ${t.muted} ${t.hover} transition-colors`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">All lessons</span>
            </button>
          </div>
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
          w-72 flex flex-col border-r ${t.sidebar}
          transition-transform lg:transition-none lg:translate-x-0
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          lg:h-[calc(100vh-3.5rem)] lg:shrink-0
        `}>
          {showSidebar && (
            <div className="fixed inset-0 bg-black/30 z-[-1] lg:hidden" onClick={() => setShowSidebar(false)} />
          )}
          <nav className="flex-1 overflow-y-auto p-3 space-y-2">
            {readerSections.map((section) => {
              const activeInSection = section.chapters.some(c => c.id === selectedChapter?.id);
              const sectionKey = `${selectedProgram}:${section.id}`;
              const isOpen = expandedSections[sectionKey] ?? activeInSection;
              const doneInSection = section.chapters.filter(isChapterDone).length;
              return (
                <div key={section.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpandedSections(prev => ({ ...prev, [sectionKey]: !isOpen }))}
                    className={`w-full flex items-center justify-between gap-2 px-3 min-h-[44px] rounded-lg border text-left transition-colors ${t.border} ${activeInSection ? t.itemActive : t.hover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50`}
                  >
                    <span className={`text-sm font-semibold leading-snug ${activeInSection ? '' : t.text}`}>
                      {section.label}
                    </span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium tabular-nums ${doneInSection === section.chapters.length && section.chapters.length > 0 ? 'text-[var(--mq-accent)]' : t.faint}`}>
                        {doneInSection}/{section.chapters.length}
                      </span>
                      <ChevronDown className={`h-4 w-4 ${t.faint} transition-transform motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {isOpen && (
                  <div className="space-y-0.5 mt-1.5 mb-2 pl-1">
                    {section.chapters.map((ch, ci) => {
                      const isActive = selectedChapter?.id === ch.id;
                      const drill = drillState(ch.id);
                      const done = isChapterDone(ch);
                      return (
                        <button
                          key={ch.id}
                          onClick={() => { openChapter(ch); setShowSidebar(false); }}
                          className={`group relative w-full text-left rounded-lg pl-3 pr-2.5 py-2 flex items-start gap-2.5 transition-colors ${
                            isActive ? t.itemActive : `${t.itemIdle} ${t.hover}`
                          }`}
                        >
                          {isActive && <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full ${t.itemActiveBar}`} />}
                          {done ? (
                            <CheckCircle className="mt-0.5 flex-shrink-0 h-5 w-5 text-[var(--mq-accent)]" />
                          ) : (
                            <span className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-md text-[11px] font-semibold flex items-center justify-center ${
                              isActive ? t.itemNumActive : t.itemNum
                            }`}>
                              {ci + 1}
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className={`block text-sm leading-snug ${isActive ? 'font-semibold' : 'font-medium'}`}>{ch.title}</span>
                            <span className={`block text-xs mt-0.5 ${t.faint}`}>
                              {ch.week_number ? `Week ${ch.week_number}` : ''}
                              {ch.video_url ? `${ch.week_number ? ' · ' : ''}Video` : ''}
                              {drill ? `${ch.week_number || ch.video_url ? ' · ' : ''}${drill.done ? `Drill ${drill.score}/${drill.total}` : 'Drill'}` : ''}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Pinned progress footer — real data: teacher-marked class progress
              + the student's own drill completion (DeepLearning.AI-style). */}
          {(() => {
            const cls = classProgressByProgram?.[selectedProgram];
            const quizIds = Object.values(quizByChapter);
            const drillsDone = quizIds.filter(id => myAttempts[id]).length;
            const readCount = allChapters.filter(ch => readChapters.has(ch.id)).length;
            if (!cls && !quizIds.length && !onOpenResults) return null;
            return (
              <div className={`shrink-0 border-t ${t.divider} p-3 space-y-2.5`}>
                {allChapters.length > 0 && autoResume && (
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className={`text-xs font-medium ${t.text}`}>Lessons</span>
                      <span className={`text-xs tabular-nums ${t.faint}`}>{readCount}/{allChapters.length}</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${t.itemNum.split(' ')[0]}`}>
                      <div className="h-full bg-[var(--mq-accent)] rounded-full transition-all" style={{ width: `${Math.round((readCount / allChapters.length) * 100)}%` }} />
                    </div>
                  </div>
                )}
                {cls && (
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className={`text-xs font-medium ${t.text}`}>Classes</span>
                      <span className={`text-xs tabular-nums ${t.faint}`}>{cls.completed}/{cls.total} · {cls.pct}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${t.itemNum.split(' ')[0]}`}>
                      <div className="h-full bg-[var(--mq-accent)] rounded-full transition-all" style={{ width: `${cls.pct}%` }} />
                    </div>
                  </div>
                )}
                {quizIds.length > 0 && (
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className={`text-xs font-medium ${t.text}`}>Drills</span>
                      <span className={`text-xs tabular-nums ${t.faint}`}>{drillsDone}/{quizIds.length}</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${t.itemNum.split(' ')[0]}`}>
                      <div className="h-full bg-[var(--mq-accent)] rounded-full transition-all" style={{ width: `${quizIds.length ? Math.round((drillsDone / quizIds.length) * 100) : 0}%` }} />
                    </div>
                  </div>
                )}
                {onOpenResults && (
                  <button
                    onClick={onOpenResults}
                    className="w-full text-left text-xs font-medium text-[var(--mq-accent)] hover:text-[var(--mq-accent)] transition-colors"
                  >
                    Tests &amp; results →
                  </button>
                )}
              </div>
            );
          })()}
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--mq-accent)] text-white text-sm font-medium hover:bg-[var(--mq-accent-deep)] transition-colors"
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
                    className="group inline-flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl bg-[var(--mq-accent)] text-white hover:bg-[var(--mq-accent-deep)] transition-colors text-left max-w-[70%]"
                  >
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wider text-[var(--mq-on-accent)]">Next lesson</span>
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

        /* Reading font: in the light/sepia reading modes the Latin body reads
           as book text — a proper serif (Lora), not the UI sans. Arabic keeps
           Amiri via the !important rules above; RTL nodes are excluded here so
           the override never touches them. Dark mode stays on the crisp sans
           (a serif muddies on near-black). */
        .lesson-theme-light p, .lesson-theme-light li, .lesson-theme-light blockquote, .lesson-theme-light figcaption,
        .lesson-theme-sepia p, .lesson-theme-sepia li, .lesson-theme-sepia blockquote, .lesson-theme-sepia figcaption {
          font-family: 'Lora', Georgia, Cambria, 'Times New Roman', serif;
        }
        .lesson-theme-light [dir="rtl"], .lesson-theme-sepia [dir="rtl"],
        .lesson-theme-light .verse, .lesson-theme-sepia .verse,
        .lesson-theme-light .arabic-prose, .lesson-theme-sepia .arabic-prose,
        .lesson-theme-light code, .lesson-theme-light pre, .lesson-theme-sepia code, .lesson-theme-sepia pre {
          font-family: revert;
        }
        .lesson-theme-light .verse, .lesson-theme-sepia .verse,
        .lesson-theme-light .arabic-prose, .lesson-theme-sepia .arabic-prose {
          font-family: 'Amiri Quran', 'Traditional Arabic', 'Arabic Typesetting', serif !important;
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

        /* Authored schematic tables carry pale-green cell fills as INLINE styles
           (#ecfdf5 / #d1fae5) with no inline text colour, so in dark mode the
           prose forces chalk-white text ONTO those pale fills — white-on-light,
           the cells the reader flagged. Force dark ink back onto exactly those
           authored-green cells (and their spans/links) so the header/label rows
           read. Cells with no authored fill keep the theme's chalk ink. */
        .lesson-theme-dark td[style*="#ecfdf5"],
        .lesson-theme-dark th[style*="#ecfdf5"],
        .lesson-theme-dark td[style*="#d1fae5"],
        .lesson-theme-dark th[style*="#d1fae5"] {
          color: #08301f !important;
        }
        .lesson-theme-dark td[style*="#ecfdf5"] *,
        .lesson-theme-dark th[style*="#ecfdf5"] *,
        .lesson-theme-dark td[style*="#d1fae5"] *,
        .lesson-theme-dark th[style*="#d1fae5"] * {
          color: #08301f !important;
        }
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
