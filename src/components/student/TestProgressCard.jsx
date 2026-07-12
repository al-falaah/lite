import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { CheckCircle, XCircle, Clock, Award, ChevronRight, Lock, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import { PROGRAMS } from '../../config/programs';
import { BTN_SECONDARY } from '../../design/ui';
import { BTN_CTA_COMPACT, STATUS_PILL_OK, STATUS_PILL_PENDING, STATUS_PILL_BAD, CARD_DARK } from '../../design/lms';
import { CardSkeleton } from '../common/DataStates';

export default function TestProgressCard({ programId, currentWeek }) {
  const [results, setResults] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState({}); // { [attemptId]: bool }

  const program = PROGRAMS[programId];
  const milestones = program?.milestones || [];

  useEffect(() => {
    if (programId) fetchData();
  }, [programId]);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch in parallel. maybeSingle: missing settings/results rows are
      // normal for a new student, not errors.
      const [settingsRes, resultsRes, attemptsRes] = await Promise.all([
        supabase
          .from('program_test_settings')
          .select('*')
          .eq('program_id', programId)
          .maybeSingle(),
        supabase
          .from('student_program_results')
          .select('*')
          .eq('student_id', user.id)
          .eq('program_id', programId)
          .maybeSingle(),
        supabase
          .from('test_attempts')
          .select('id, type, milestone_index, percentage, status, is_oral, answers, oral_notes, completed_at')
          .eq('student_id', user.id)
          .eq('program_id', programId)
          .in('status', ['completed', 'timed_out'])
          .order('completed_at', { ascending: false }),
      ]);

      const queryError = settingsRes.error || resultsRes.error || attemptsRes.error;
      if (queryError) {
        console.error('Error fetching test progress:', queryError);
        setFetchError(true);
        return;
      }

      setSettings(settingsRes.data);
      setResults(resultsRes.data);
      setAttempts(attemptsRes.data || []);
    } catch (error) {
      console.error('Error fetching test progress:', error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!program) {
    return null;
  }

  if (loading) {
    return <CardSkeleton lines={4} />;
  }

  if (fetchError) {
    return (
      <div className={`${CARD_DARK} p-4 sm:p-5 text-center`}>
        <p className="text-sm text-slate-700 dark:text-gray-300">Couldn't load your test progress.</p>
        <button onClick={fetchData} className={`${BTN_SECONDARY} mt-3`}>
          Try again
        </button>
      </div>
    );
  }

  // Build milestone test status map
  const milestoneTestMap = {};
  attempts
    .filter(a => a.type === 'milestone')
    .forEach(a => {
      const key = a.milestone_index;
      if (!(key in milestoneTestMap) || a.percentage > milestoneTestMap[key].percentage) {
        milestoneTestMap[key] = a;
      }
    });

  const examAttempts = attempts.filter(a => a.type === 'final_exam');
  const bestExam = examAttempts.length > 0
    ? examAttempts.reduce((best, a) => a.percentage > best.percentage ? a : best, examAttempts[0])
    : null;

  // Determine which milestones are unlocked (based on currentWeek)
  const isMilestoneUnlocked = (milestone) => {
    return currentWeek >= milestone.weekEnd;
  };

  const isFinalExamUnlocked = () => {
    // All milestone tests must be completed
    return milestones.every((_, idx) => milestoneTestMap[idx]?.status === 'completed');
  };

  const maxExamAttempts = settings?.allow_exam_retake ? 1 + (settings?.max_exam_retakes || 1) : 1;
  const canRetakeExam = examAttempts.length < maxExamAttempts && results?.status === 'failed';

  const toggleBreakdown = (attemptId) => {
    setExpandedBreakdown((prev) => ({ ...prev, [attemptId]: !prev[attemptId] }));
  };

  const renderBreakdown = (attempt) => {
    if (!attempt?.is_oral) return null;
    const rubric = attempt?.answers?.rubric;
    if (!Array.isArray(rubric) || rubric.length === 0) return null;
    const isOpen = !!expandedBreakdown[attempt.id];
    return (
      <div className="mt-1.5 ml-6">
        <button
          onClick={() => toggleBreakdown(attempt.id)}
          className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium"
        >
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {isOpen ? 'Hide' : 'View'} breakdown ({rubric.length} question{rubric.length === 1 ? '' : 's'})
        </button>
        {isOpen && (
          <ul className="mt-1.5 space-y-1.5 border-l-2 border-emerald-200 dark:border-emerald-800 pl-2.5">
            {rubric.map((r, i) => (
              <li key={i} className="text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-gray-700 dark:text-gray-300 flex-1">{r.text || '(no text)'}</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {r.score}/{r.max}{r.weight > 1 ? ` ×${r.weight}` : ''}
                  </span>
                </div>
                {r.notes && <div className="text-gray-500 dark:text-gray-400 italic mt-0.5">{r.notes}</div>}
              </li>
            ))}
          </ul>
        )}
        {attempt.oral_notes && (
          <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 italic">
            Teacher: {attempt.oral_notes}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5 sm:gap-2">
          <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
          Tests & Exam Progress
        </h3>
        {results && (
          <span className={`${
            results.status === 'passed' ? STATUS_PILL_OK :
            results.status === 'failed' ? STATUS_PILL_BAD :
            STATUS_PILL_PENDING
          } whitespace-nowrap`}>
            {results.status === 'passed' && <CheckCircle className="h-3 w-3" />}
            {results.status === 'failed' && <XCircle className="h-3 w-3" />}
            {results.status === 'in_progress' && <Clock className="h-3 w-3" />}
            {results.status === 'passed' ? 'PASSED' : results.status === 'failed' ? 'FAILED' : 'IN PROGRESS'}
          </span>
        )}
      </div>

      {/* Overall score */}
      {results?.weighted_total != null && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Weighted Total</span>
            <span className={`text-lg font-bold ${
              results.weighted_total >= (settings?.pass_mark || 50) ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {Number(results.weighted_total).toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 gap-0.5">
            <span>Milestones ({settings?.milestone_test_weight || 50}%): {results.milestone_average != null ? `${Number(results.milestone_average).toFixed(1)}%` : '—'}</span>
            <span>Exam ({settings?.final_exam_weight || 50}%): {results.final_exam_score != null ? `${Number(results.final_exam_score).toFixed(1)}%` : '—'}</span>
          </div>
        </div>
      )}

      {/* Milestone tests */}
      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        {milestones.map((m, idx) => {
          const test = milestoneTestMap[idx];
          const unlocked = isMilestoneUnlocked(m);
          const completed = test?.status === 'completed';
          const testModes = settings?.milestone_test_modes || {};
          const isOral = testModes[String(idx)] === 'oral';

          return (
            <div key={idx} className="p-3 sm:p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all">
              <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                {completed ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                ) : unlocked ? (
                  isOral ? <Mic className="h-4 w-4 text-amber-500 flex-shrink-0" /> : <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white leading-snug">
                    Milestone {idx + 1}: {m.name}
                    {isOral && <span className="ml-1 sm:ml-1.5 text-xs px-2.5 py-1 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-full font-medium align-middle">ORAL</span>}
                  </p>
                  {completed && (
                    <p className="text-xs text-emerald-600 font-medium">{Number(test.percentage).toFixed(1)}%</p>
                  )}
                </div>
              </div>
              {unlocked && !completed && !isOral && (
                <Link
                  to={`/student/test/${programId}/milestone/${idx}`}
                  className={`${BTN_CTA_COMPACT} whitespace-nowrap flex-shrink-0`}
                >
                  Take Test <ChevronRight className="h-3 w-3" />
                </Link>
              )}
              {unlocked && !completed && isOral && (
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium whitespace-nowrap flex-shrink-0">Awaiting teacher</span>
              )}
              {!unlocked && !completed && (
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">Week {m.weekEnd}+</span>
              )}
              </div>
              {completed && renderBreakdown(test)}
              </div>
          );
        })}
      </div>

      {/* Final Exam */}
      {(() => {
        const testModes = settings?.milestone_test_modes || {};
        const isExamOral = testModes['final_exam'] === 'oral';

        return (
          <div className={`p-4 sm:p-4 rounded-lg border-2 ${
            bestExam ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' :
            isFinalExamUnlocked() ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20' :
            'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                {bestExam ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                ) : isFinalExamUnlocked() ? (
                  isExamOral ? <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" /> : <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    Final Exam
                    {isExamOral && <span className="ml-1 sm:ml-1.5 text-xs px-2 py-1 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-full font-medium align-middle">ORAL</span>}
                  </p>
                  {bestExam && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Best: {Number(bestExam.percentage).toFixed(1)}%
                      {examAttempts.length > 1 && ` (${examAttempts.length} attempts)`}
                    </p>
                  )}
                  {!isFinalExamUnlocked() && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Complete all milestone tests first</p>
                  )}
                </div>
              </div>
              {isFinalExamUnlocked() && !bestExam && !isExamOral && (
                <Link
                  to={`/student/test/${programId}/final_exam`}
                  className={`${BTN_CTA_COMPACT} whitespace-nowrap flex-shrink-0`}
                >
                  Start Exam <ChevronRight className="h-3 w-3" />
                </Link>
              )}
              {isFinalExamUnlocked() && !bestExam && isExamOral && (
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium whitespace-nowrap flex-shrink-0">Awaiting teacher</span>
              )}
              {canRetakeExam && !isExamOral && (
                <Link
                  to={`/student/test/${programId}/final_exam`}
                  className={`${BTN_CTA_COMPACT} whitespace-nowrap flex-shrink-0`}
                >
                  Retake <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            {bestExam && renderBreakdown(bestExam)}
          </div>
        );
      })()}
    </div>
  );
}
