/**
 * TeacherLessons — the teacher's lesson & quiz REVIEW surface.
 *
 * A purpose-built staff view (slate + emerald, from src/design/ui.js), not the
 * student's browse-and-resume list. It answers a teacher's actual questions:
 * which programs do I teach, what chapters and quizzes exist per milestone, and
 * let me preview exactly what my students see. It deliberately does NOT show the
 * student's personal completion dots (meaningless to a teacher).
 *
 * Preview reuses the real student reader (StudentLessons opened to one chapter),
 * so there is one reader implementation. Quiz preview opens the drill route.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { BookOpen, ChevronDown, Video, FileText, HelpCircle, Eye, PlayCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { PROGRAMS } from '../../config/programs';
import StudentLessons from '../student/StudentLessons';
import {
  CARD, CARD_OVERFLOW, HEADING_LG, HEADING_SM, LABEL_TINY,
  CHIP, CHIP_SELECTED, BTN_GHOST, STATUS_OK,
} from '../../design/ui';

const isArabic = (s) => /[؀-ۿ]/.test(s || '');

export default function TeacherLessons({ programs = [] }) {
  const uniquePrograms = useMemo(
    () => [...new Set((programs || []).filter(Boolean))],
    [programs]
  );

  const [program, setProgram] = useState(uniquePrograms[0] || null);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [quizByChapter, setQuizByChapter] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openMilestones, setOpenMilestones] = useState({});
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [preview, setPreview] = useState(null); // { program, chapterId } | null

  useEffect(() => {
    if (!program && uniquePrograms.length) setProgram(uniquePrograms[0]);
  }, [uniquePrograms, program]);

  const load = useCallback(async () => {
    if (!program) { setLoading(false); return; }
    setLoading(true); setError(false);
    try {
      const { data: courseRows, error: cErr } = await supabase
        .from('lesson_courses')
        .select('id, title, description, display_order, program_id')
        .eq('program_id', program)
        .order('display_order');
      if (cErr) throw cErr;
      setCourses(courseRows || []);

      const courseIds = (courseRows || []).map(c => c.id);
      if (!courseIds.length) { setChapters([]); setQuizByChapter({}); setLoading(false); return; }

      const { data: chapterRows, error: chErr } = await supabase
        .from('lesson_chapters')
        .select('id, title, week_number, course_id, content_type, video_url')
        .in('course_id', courseIds)
        .eq('is_published', true)
        .order('week_number', { ascending: true, nullsFirst: false });
      if (chErr) throw chErr;
      setChapters(chapterRows || []);

      const chapterIds = (chapterRows || []).map(c => c.id);
      if (chapterIds.length) {
        const { data: quizzes } = await supabase
          .from('lesson_quizzes')
          .select('id, chapter_id')
          .in('chapter_id', chapterIds)
          .eq('is_published', true);
        const qbc = {};
        (quizzes || []).forEach(q => { qbc[q.chapter_id] = q.id; });
        setQuizByChapter(qbc);
      } else {
        setQuizByChapter({});
      }
    } catch (e) {
      console.error('TeacherLessons load failed:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => { load(); }, [load]);

  const meta = PROGRAMS[program];
  const milestones = meta?.milestones || [];

  // Group chapters by milestone (by week range), then by course inside.
  const byMilestone = useMemo(() => {
    const map = {};
    milestones.forEach(m => { map[m.id] = []; });
    const ungrouped = [];
    chapters.forEach(ch => {
      const m = milestones.find(x => ch.week_number >= x.weekStart && ch.week_number <= x.weekEnd);
      if (m) map[m.id].push(ch); else ungrouped.push(ch);
    });
    return { map, ungrouped };
  }, [chapters, milestones]);

  // Open the first milestone that actually holds content, once loaded.
  useEffect(() => {
    if (loading || !milestones.length) return;
    const firstLive = milestones.find(m => (byMilestone.map[m.id] || []).length);
    if (firstLive) setOpenMilestones({ [firstLive.id]: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, program]);

  const liveMilestones = milestones.filter(m => (byMilestone.map[m.id] || []).length);
  const comingMilestones = milestones.filter(m => !(byMilestone.map[m.id] || []).length);
  const quizCount = chapters.filter(ch => quizByChapter[ch.id]).length;
  const courseTitle = (id) => courses.find(c => c.id === id)?.title;

  // ── Preview: hand the chapter to the real student reader ────────
  if (preview) {
    return (
      <StudentLessons
        forceTheme="light"
        previewProgram={preview.program}
        previewChapterId={preview.chapterId}
        onPreviewClose={() => setPreview(null)}
      />
    );
  }

  if (!uniquePrograms.length) {
    return (
      <div className={`${CARD} px-6 py-12 text-center`}>
        <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
        <p className="mt-3 text-sm font-medium text-slate-900">No programs assigned yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Once you are assigned students, the programs you teach appear here.
        </p>
      </div>
    );
  }

  const ChapterRow = ({ ch, showCourse }) => {
    const quizId = quizByChapter[ch.id];
    const ar = isArabic(ch.title);
    return (
      <div className="flex items-start gap-3 px-4 sm:px-5 py-3.5 border-t border-slate-100 first:border-t-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-sm font-medium text-slate-900 truncate"
              dir={ar ? 'rtl' : 'ltr'}
              style={ar ? { fontFamily: 'Amiri, serif', fontSize: '1.05rem' } : undefined}
            >
              {ch.title}
            </p>
            {quizId ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                <HelpCircle className="h-3 w-3" /> Quiz
              </span>
            ) : (
              <span className="text-xs text-slate-400">No quiz</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-slate-500">
            {ch.week_number != null && <span className="tabular-nums">Week {ch.week_number}</span>}
            {showCourse && courseTitle(ch.course_id) && (
              <span className="truncate">{courseTitle(ch.course_id)}</span>
            )}
            <span className="inline-flex items-center gap-1">
              {ch.video_url ? <Video className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              {ch.video_url ? 'Video + notes' : 'Notes'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className={BTN_GHOST}
            onClick={() => setPreview({ program, chapterId: ch.id })}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Lesson
          </button>
          {quizId && (
            <button
              className={BTN_GHOST}
              onClick={() => window.open(`/student/drill/${quizId}`, '_blank', 'noopener')}
            >
              <PlayCircle className="h-3.5 w-3.5 mr-1" /> Quiz
            </button>
          )}
        </div>
      </div>
    );
  };

  const MilestoneCard = ({ m }) => {
    const chaps = (byMilestone.map[m.id] || []).slice().sort((a, b) => a.week_number - b.week_number);
    const open = !!openMilestones[m.id];
    const withQuiz = chaps.filter(ch => quizByChapter[ch.id]).length;
    // course ids present, to decide whether to label the course per row
    const courseIdsHere = [...new Set(chaps.map(c => c.course_id))];
    const multiCourse = courseIdsHere.length > 1;
    return (
      <div className={CARD_OVERFLOW}>
        <button
          onClick={() => setOpenMilestones(s => ({ ...s, [m.id]: !s[m.id] }))}
          className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{m.name}</p>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">Weeks {m.weekStart}–{m.weekEnd}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
            <span className="tabular-nums">{chaps.length} lesson{chaps.length === 1 ? '' : 's'}</span>
            {withQuiz > 0 && <span className={`${STATUS_OK} tabular-nums`}>{withQuiz} quiz{withQuiz === 1 ? '' : 'zes'}</span>}
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {open && (
          <div className="border-t border-slate-100">
            {multiCourse
              ? courseIdsHere.map(cid => {
                  const cc = chaps.filter(c => c.course_id === cid);
                  return (
                    <div key={cid}>
                      <div className="px-4 sm:px-5 py-2 bg-slate-50 border-t border-slate-100 first:border-t-0">
                        <p className={LABEL_TINY}>{courseTitle(cid)}</p>
                      </div>
                      {cc.map(ch => <ChapterRow key={ch.id} ch={ch} showCourse={false} />)}
                    </div>
                  );
                })
              : chaps.map(ch => <ChapterRow key={ch.id} ch={ch} showCourse={false} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Program selector */}
      {uniquePrograms.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {uniquePrograms.map(p => (
            <button
              key={p}
              onClick={() => setProgram(p)}
              className={program === p ? CHIP_SELECTED : CHIP}
            >
              {PROGRAMS[p]?.shortName || p}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className={`${CARD} px-6 py-16 flex justify-center`}>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className={`${CARD} px-6 py-12 text-center`}>
          <p className="text-sm text-slate-600">Couldn’t load the lessons for this program.</p>
          <button onClick={load} className={`${BTN_GHOST} mt-3`}>Try again</button>
        </div>
      ) : (
        <>
          {/* Review summary — one honest line, not hero-metric cards */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{meta?.shortName || program}</span>
            <span className="text-slate-400">·</span>
            <span className="tabular-nums">{chapters.length} published lesson{chapters.length === 1 ? '' : 's'}</span>
            <span className="text-slate-400">·</span>
            <span className="tabular-nums">{quizCount} with a quiz</span>
            <span className="text-slate-400">·</span>
            <span className="tabular-nums">{liveMilestones.length} of {milestones.length} milestones live</span>
          </div>

          {chapters.length === 0 ? (
            <div className={`${CARD} px-6 py-12 text-center`}>
              <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="mt-3 text-sm font-medium text-slate-900">Nothing published yet</p>
              <p className="mt-1 text-sm text-slate-500">Published lessons for this program will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveMilestones.map(m => <MilestoneCard key={m.id} m={m} />)}

              {/* Ungrouped chapters, if any */}
              {byMilestone.ungrouped.length > 0 && (
                <div className={CARD_OVERFLOW}>
                  <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Other lessons</p>
                  </div>
                  {byMilestone.ungrouped.map(ch => <ChapterRow key={ch.id} ch={ch} showCourse />)}
                </div>
              )}

              {/* Coming-soon milestones, de-weighted into one collapsible row */}
              {comingMilestones.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowComingSoon(v => !v)}
                    className="w-full flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showComingSoon ? 'rotate-180' : ''}`} />
                    {comingMilestones.length} milestone{comingMilestones.length === 1 ? '' : 's'} coming soon
                    <span className="tabular-nums">
                      (Weeks {comingMilestones[0].weekStart}–{comingMilestones[comingMilestones.length - 1].weekEnd})
                    </span>
                  </button>
                  {showComingSoon && (
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 px-4 sm:px-5 pb-2">
                      {comingMilestones.map(m => (
                        <span key={m.id} className="text-xs text-slate-400">
                          {m.name} <span className="tabular-nums">· W{m.weekStart}–{m.weekEnd}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
