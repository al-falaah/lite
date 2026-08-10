import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import QuizLeaderboard from '../drills/QuizLeaderboard';
import { PROGRAMS } from '../../config/programs';
import { BTN_SECONDARY } from '../../design/ui';
import { Spinner } from '../common/DataStates';

/**
 * Per-program, per-quiz leaderboard hub.
 *
 * Programs the student is enrolled in show as tabs. Inside each tab, every
 * published lesson_quiz for the program is listed. Tap a quiz row to reveal
 * its leaderboard.
 *
 * No week-gating here on purpose: if a quiz is playable from the lesson page
 * (lesson visibility itself is what gates content), it should also be
 * inspectable on the leaderboard. The lesson list already controls whether
 * the student can reach a quiz; this view just shows results.
 */
export default function StudentQuizLeaderboards({ enrollments }) {
  const activeEnrolments = enrollments?.filter(e => e.status === 'active') || [];
  const [activeProgram, setActiveProgram] = useState(null);
  const [quizzes, setQuizzes] = useState({}); // { [program]: rows }
  const [loading, setLoading] = useState(false);
  const [fetchErrors, setFetchErrors] = useState({}); // { [program]: bool }
  const [reloadKey, setReloadKey] = useState(0); // bump to retry after a fetch error
  const [expandedQuizId, setExpandedQuizId] = useState(null);

  // Default to the first active enrolment once it arrives.
  useEffect(() => {
    if (activeProgram) return;
    const first = activeEnrolments[0]?.program;
    if (first) setActiveProgram(first);
  }, [activeEnrolments, activeProgram]);

  useEffect(() => {
    if (!activeProgram || quizzes[activeProgram]) return;
    let cancelled = false;
    setLoading(true);
    setFetchErrors(prev => ({ ...prev, [activeProgram]: false }));

    const fail = (error) => {
      console.error('Error fetching quiz leaderboards:', error);
      if (!cancelled) {
        setFetchErrors(prev => ({ ...prev, [activeProgram]: true }));
        setLoading(false);
      }
    };

    (async () => {
      // Resolve program → courses → chapters (with milestone_index) → quizzes
      const { data: courses, error: coursesError } = await supabase
        .from('lesson_courses')
        .select('id, title')
        .eq('program_id', activeProgram);
      if (coursesError) return fail(coursesError);
      const courseIds = (courses || []).map(c => c.id);
      if (courseIds.length === 0) {
        if (!cancelled) { setQuizzes(prev => ({ ...prev, [activeProgram]: [] })); setLoading(false); }
        return;
      }

      const { data: chapters, error: chaptersError } = await supabase
        .from('lesson_chapters')
        .select('id, title, chapter_number, milestone_index, course_id')
        .in('course_id', courseIds)
        .eq('is_published', true)
        .order('milestone_index', { nullsFirst: false })
        .order('chapter_number', { nullsFirst: false });
      if (chaptersError) return fail(chaptersError);

      const chapterIds = (chapters || []).map(c => c.id);
      if (chapterIds.length === 0) {
        if (!cancelled) { setQuizzes(prev => ({ ...prev, [activeProgram]: [] })); setLoading(false); }
        return;
      }

      const { data: lq, error: quizzesError } = await supabase
        .from('lesson_quizzes')
        .select('id, chapter_id, title, is_published')
        .in('chapter_id', chapterIds)
        .eq('is_published', true);
      if (quizzesError) return fail(quizzesError);

      const chapterMap = Object.fromEntries((chapters || []).map(c => [c.id, c]));
      const rows = (lq || [])
        .map(q => ({ ...q, chapter: chapterMap[q.chapter_id] }))
        .sort((a, b) => {
          const am = a.chapter?.milestone_index ?? 999;
          const bm = b.chapter?.milestone_index ?? 999;
          if (am !== bm) return am - bm;
          return (a.chapter?.chapter_number ?? 0) - (b.chapter?.chapter_number ?? 0);
        });

      if (!cancelled) {
        setQuizzes(prev => ({ ...prev, [activeProgram]: rows }));
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeProgram, quizzes, reloadKey]);

  if (activeEnrolments.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[var(--mq-ink-faint)]">
        No active enrolments.
      </div>
    );
  }

  const programRows = quizzes[activeProgram] || [];

  return (
    <div>
      {/* Program tabs */}
      {activeEnrolments.length > 1 && (
        <div className="flex gap-2 mb-4 border-b border-[var(--mq-rule)] overflow-x-auto">
          {activeEnrolments.map(e => (
            <button
              key={e.program}
              onClick={() => { setActiveProgram(e.program); setExpandedQuizId(null); }}
              className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeProgram === e.program
                  ? 'border-[var(--mq-accent)] text-[var(--mq-accent)]'
                  : 'border-transparent text-[var(--mq-ink-faint)] hover:text-[var(--mq-ink-soft)]'
              }`}
            >
              {PROGRAMS[e.program]?.shortName || e.program}
            </button>
          ))}
        </div>
      )}

      {loading && programRows.length === 0 && (
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      )}

      {!loading && fetchErrors[activeProgram] && (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--mq-ink-soft)]">Couldn't load the leaderboards.</p>
          <button onClick={() => setReloadKey(k => k + 1)} className={`${BTN_SECONDARY} mt-3`}>
            Try again
          </button>
        </div>
      )}

      {!loading && !fetchErrors[activeProgram] && programRows.length === 0 && (
        <div className="text-center py-8 text-xs text-[var(--mq-ink-faint)]">
          No quizzes published for this program yet.
        </div>
      )}

      {/* Grouped by milestone so the sheet has structure and rhythm, not a
          uniform run of identical rows. Each group is a ruled section with a
          mono specimen-label header; rows read as ruled entries you can open
          to reveal the ranked scores. */}
      {(() => {
        const groups = [];
        const byIdx = new Map();
        programRows.forEach(row => {
          const idx = row.chapter?.milestone_index ?? 999;
          if (!byIdx.has(idx)) { byIdx.set(idx, []); groups.push(idx); }
          byIdx.get(idx).push(row);
        });
        return (
          <div className="space-y-7">
            {groups.map(idx => {
              const rows = byIdx.get(idx);
              return (
                <section key={idx}>
                  <div className="flex items-baseline justify-between mb-2.5 pb-1.5 border-b border-[var(--mq-rule)]">
                    <span className="font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.16em] text-[var(--mq-ink-faint)]">
                      {idx !== 999 ? `Milestone ${idx}` : 'Unassigned'}
                    </span>
                    <span className="font-['JetBrains_Mono',monospace] text-[11px] tabular-nums text-[var(--mq-ink-ghost)]">
                      {rows.length} {rows.length === 1 ? 'drill' : 'drills'}
                    </span>
                  </div>
                  <ul className="divide-y divide-[var(--mq-rule-soft)]">
                    {rows.map(row => {
                      const isOpen = expandedQuizId === row.id;
                      return (
                        <li key={row.id}>
                          <button
                            onClick={() => setExpandedQuizId(isOpen ? null : row.id)}
                            aria-expanded={isOpen}
                            className="w-full py-3 flex items-center justify-between gap-3 text-left transition-colors hover:bg-[var(--mq-paper-sunk)]/60 rounded-[3px] px-2 -mx-2 mashq-focus"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Trophy className={`h-4 w-4 flex-shrink-0 ${isOpen ? 'text-[var(--mq-accent)]' : 'text-[var(--mq-ink-ghost)]'}`} />
                              <p className="text-sm font-medium text-[var(--mq-ink)] truncate">{row.chapter?.title || row.title}</p>
                            </div>
                            <span className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.08em] text-[var(--mq-ink-faint)] hidden sm:inline">
                                {isOpen ? 'Hide' : 'Rankings'}
                              </span>
                              {isOpen ? <ChevronUp className="h-4 w-4 text-[var(--mq-accent)]" /> : <ChevronDown className="h-4 w-4 text-[var(--mq-ink-ghost)]" />}
                            </span>
                          </button>
                          {isOpen && (
                            <div className="pb-3 pt-1">
                              <QuizLeaderboard quizId={row.id} program={activeProgram} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
