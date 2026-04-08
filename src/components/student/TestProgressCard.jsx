import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { CheckCircle, XCircle, Clock, Award, ChevronRight, Lock, Mic } from 'lucide-react';
import { PROGRAMS } from '../../config/programs';

export default function TestProgressCard({ programId, currentWeek }) {
  const [results, setResults] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const program = PROGRAMS[programId];
  const milestones = program?.milestones || [];

  useEffect(() => {
    if (programId) fetchData();
  }, [programId]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch in parallel
      const [settingsRes, resultsRes, attemptsRes] = await Promise.all([
        supabase
          .from('program_test_settings')
          .select('*')
          .eq('program_id', programId)
          .single(),
        supabase
          .from('student_program_results')
          .select('*')
          .eq('student_id', user.id)
          .eq('program_id', programId)
          .single(),
        supabase
          .from('test_attempts')
          .select('type, milestone_index, percentage, status')
          .eq('student_id', user.id)
          .eq('program_id', programId)
          .in('status', ['completed', 'timed_out'])
          .order('completed_at', { ascending: false }),
      ]);

      setSettings(settingsRes.data);
      setResults(resultsRes.data);
      setAttempts(attemptsRes.data || []);
    } catch (error) {
      console.error('Error fetching test progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !program) {
    return null;
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
          Tests & Exam Progress
        </h3>
        {results && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            results.status === 'passed' ? 'bg-emerald-100 text-emerald-700' :
            results.status === 'failed' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {results.status === 'passed' && <CheckCircle className="h-3 w-3" />}
            {results.status === 'failed' && <XCircle className="h-3 w-3" />}
            {results.status === 'in_progress' && <Clock className="h-3 w-3" />}
            {results.status === 'passed' ? 'PASSED' : results.status === 'failed' ? 'FAILED' : 'IN PROGRESS'}
          </span>
        )}
      </div>

      {/* Overall score */}
      {results?.weighted_total != null && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Weighted Total</span>
            <span className={`text-lg font-bold ${
              results.weighted_total >= (settings?.pass_mark || 50) ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {Number(results.weighted_total).toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 mt-1 gap-0.5">
            <span>Milestones ({settings?.milestone_test_weight || 50}%): {results.milestone_average != null ? `${Number(results.milestone_average).toFixed(1)}%` : '—'}</span>
            <span>Exam ({settings?.final_exam_weight || 50}%): {results.final_exam_score != null ? `${Number(results.final_exam_score).toFixed(1)}%` : '—'}</span>
          </div>
        </div>
      )}

      {/* Milestone tests */}
      <div className="space-y-2 mb-4">
        {milestones.map((m, idx) => {
          const test = milestoneTestMap[idx];
          const unlocked = isMilestoneUnlocked(m);
          const completed = test?.status === 'completed';
          const testModes = settings?.milestone_test_modes || {};
          const isOral = testModes[String(idx)] === 'oral';

          return (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-all">
              <div className="flex items-center gap-2.5">
                {completed ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : unlocked ? (
                  isOral ? <Mic className="h-4 w-4 text-orange-500" /> : <Clock className="h-4 w-4 text-amber-500" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-300" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Milestone {idx + 1}: {m.name}
                    {isOral && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-medium align-middle">ORAL</span>}
                  </p>
                  {completed && (
                    <p className="text-xs text-emerald-600 font-medium">{Number(test.percentage).toFixed(1)}%</p>
                  )}
                </div>
              </div>
              {unlocked && !completed && !isOral && (
                <Link
                  to={`/student/test/${programId}/milestone/${idx}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-all"
                >
                  Take Test <ChevronRight className="h-3 w-3" />
                </Link>
              )}
              {unlocked && !completed && isOral && (
                <span className="text-xs text-orange-600 font-medium">Awaiting teacher</span>
              )}
              {!unlocked && !completed && (
                <span className="text-xs text-gray-400">Week {m.weekEnd}+</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Final Exam */}
      {(() => {
        const testModes = settings?.milestone_test_modes || {};
        const isExamOral = testModes['final_exam'] === 'oral';

        return (
          <div className={`p-3 rounded-lg border-2 ${
            bestExam ? 'border-emerald-200 bg-emerald-50' :
            isFinalExamUnlocked() ? 'border-amber-200 bg-amber-50' :
            'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {bestExam ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                ) : isFinalExamUnlocked() ? (
                  isExamOral ? <Mic className="h-5 w-5 text-orange-500" /> : <Award className="h-5 w-5 text-amber-500" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-300" />
                )}
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Final Exam
                    {isExamOral && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-medium align-middle">ORAL</span>}
                  </p>
                  {bestExam && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Best: {Number(bestExam.percentage).toFixed(1)}%
                      {examAttempts.length > 1 && ` (${examAttempts.length} attempts)`}
                    </p>
                  )}
                  {!isFinalExamUnlocked() && (
                    <p className="text-xs text-gray-400">Complete all milestone tests first</p>
                  )}
                </div>
              </div>
              {isFinalExamUnlocked() && !bestExam && !isExamOral && (
                <Link
                  to={`/student/test/${programId}/final_exam`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all"
                >
                  Start Exam <ChevronRight className="h-3 w-3" />
                </Link>
              )}
              {isFinalExamUnlocked() && !bestExam && isExamOral && (
                <span className="text-xs text-orange-600 font-medium">Awaiting teacher</span>
              )}
              {canRetakeExam && !isExamOral && (
                <Link
                  to={`/student/test/${programId}/final_exam`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-all"
                >
                  Retake <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
