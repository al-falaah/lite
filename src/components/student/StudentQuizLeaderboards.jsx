import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import QuizLeaderboard from '../drills/QuizLeaderboard';
import { PROGRAMS } from '../../config/programs';

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

    (async () => {
      // Resolve program → courses → chapters (with milestone_index) → quizzes
      const { data: courses } = await supabase
        .from('lesson_courses')
        .select('id, title')
        .eq('program_id', activeProgram);
      const courseIds = (courses || []).map(c => c.id);
      if (courseIds.length === 0) {
        if (!cancelled) { setQuizzes(prev => ({ ...prev, [activeProgram]: [] })); setLoading(false); }
        return;
      }

      const { data: chapters } = await supabase
        .from('lesson_chapters')
        .select('id, title, sort_order, milestone_index, course_id')
        .in('course_id', courseIds)
        .eq('is_published', true)
        .order('milestone_index', { nullsFirst: false })
        .order('sort_order', { nullsFirst: false });

      const chapterIds = (chapters || []).map(c => c.id);
      if (chapterIds.length === 0) {
        if (!cancelled) { setQuizzes(prev => ({ ...prev, [activeProgram]: [] })); setLoading(false); }
        return;
      }

      const { data: lq } = await supabase
        .from('lesson_quizzes')
        .select('id, chapter_id, title, is_published')
        .in('chapter_id', chapterIds)
        .eq('is_published', true);

      const chapterMap = Object.fromEntries((chapters || []).map(c => [c.id, c]));
      const rows = (lq || [])
        .map(q => ({ ...q, chapter: chapterMap[q.chapter_id] }))
        .sort((a, b) => {
          const am = a.chapter?.milestone_index ?? 999;
          const bm = b.chapter?.milestone_index ?? 999;
          if (am !== bm) return am - bm;
          return (a.chapter?.sort_order ?? 0) - (b.chapter?.sort_order ?? 0);
        });

      if (!cancelled) {
        setQuizzes(prev => ({ ...prev, [activeProgram]: rows }));
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeProgram, quizzes]);

  if (activeEnrolments.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">
        No active enrolments.
      </div>
    );
  }

  const programRows = quizzes[activeProgram] || [];

  return (
    <div>
      {/* Program tabs */}
      {activeEnrolments.length > 1 && (
        <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {activeEnrolments.map(e => (
            <button
              key={e.program}
              onClick={() => { setActiveProgram(e.program); setExpandedQuizId(null); }}
              className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeProgram === e.program
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {PROGRAMS[e.program]?.shortName || e.program}
            </button>
          ))}
        </div>
      )}

      {loading && programRows.length === 0 && (
        <div className="text-center py-8 text-xs text-gray-500">Loading…</div>
      )}

      {!loading && programRows.length === 0 && (
        <div className="text-center py-8 text-xs text-gray-500">
          No quizzes published for this program yet.
        </div>
      )}

      <ul className="space-y-2">
        {programRows.map(row => {
          const isOpen = expandedQuizId === row.id;
          const milestoneIdx = row.chapter?.milestone_index;
          return (
            <li key={row.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedQuizId(isOpen ? null : row.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Trophy className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{row.chapter?.title || row.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {milestoneIdx != null ? `Milestone ${milestoneIdx}` : 'No milestone'} · {row.title}
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {isOpen && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/30">
                  <QuizLeaderboard quizId={row.id} program={activeProgram} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
