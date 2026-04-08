import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Mic, Save, CheckCircle, XCircle, Clock, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { PROGRAMS } from '../../config/programs';

export default function OralTestGrading({ student, program, currentWeek }) {
  const [settings, setSettings] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key being saved
  const [expanded, setExpanded] = useState(false);
  const [scores, setScores] = useState({}); // { "milestone_0": { percentage, notes }, "final_exam": { ... } }
  const [confirming, setConfirming] = useState(null); // key pending confirmation

  const programConfig = PROGRAMS[program];
  const milestones = programConfig?.milestones || [];

  useEffect(() => {
    if (student?.auth_user_id && program) fetchData();
  }, [student?.auth_user_id, program]);

  const fetchData = async () => {
    try {
      const [settingsRes, attemptsRes] = await Promise.all([
        supabase
          .from('program_test_settings')
          .select('*')
          .eq('program_id', program)
          .single(),
        supabase
          .from('test_attempts')
          .select('*')
          .eq('student_id', student.auth_user_id)
          .eq('program_id', program)
          .eq('is_oral', true)
          .order('completed_at', { ascending: false }),
      ]);

      setSettings(settingsRes.data);
      setAttempts(attemptsRes.data || []);
    } catch (error) {
      console.error('Error fetching oral test data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testModes = settings?.milestone_test_modes || {};

  // Get list of oral milestones — only show unlocked ones (student reached weekEnd)
  const oralMilestones = milestones
    .map((m, idx) => ({ ...m, idx }))
    .filter(({ idx }) => testModes[String(idx)] === 'oral')
    .filter(m => currentWeek >= m.weekEnd);

  // Final exam oral: only if all milestones completed
  const allMilestonesCompleted = milestones.every((_, idx) => {
    const key = `milestone_${idx}`;
    const existing = attempts.find(a => a.type === 'milestone' && a.milestone_index === idx && (a.status === 'completed' || a.status === 'timed_out'));
    return !!existing;
  });
  const isExamOral = testModes['final_exam'] === 'oral' && allMilestonesCompleted;

  if (loading) return null;

  // No oral tests configured for this program
  if (oralMilestones.length === 0 && !isExamOral) return null;

  // Build map of existing oral attempts
  const attemptMap = {};
  attempts.forEach(a => {
    const key = a.type === 'final_exam' ? 'final_exam' : `milestone_${a.milestone_index}`;
    if (!attemptMap[key] || a.percentage > attemptMap[key].percentage) {
      attemptMap[key] = a;
    }
  });

  const handleScoreChange = (key, field, value) => {
    setScores(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }));
  };

  const handleSubmitScore = (key, type, milestoneIndex) => {
    const score = scores[key];
    if (!score?.percentage && score?.percentage !== 0) {
      toast.error('Please enter a percentage score');
      return;
    }

    const pct = parseFloat(score.percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Percentage must be between 0 and 100');
      return;
    }

    // Show confirmation
    setConfirming({ key, type, milestoneIndex, pct, notes: score.notes || '' });
  };

  const handleConfirmSave = async () => {
    if (!confirming) return;
    const { key, type, milestoneIndex, pct, notes } = confirming;
    setConfirming(null);

    setSaving(key);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error('Session expired. Please log in again.');
        setSaving(null);
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      let response;
      try {
        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/record-oral-score`,
          {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              student_id: student.id,
              program_id: program,
              type,
              milestone_index: type === 'milestone' ? milestoneIndex : undefined,
              percentage: pct,
              notes,
            }),
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(`Server returned status ${response.status} with non-JSON body`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to record score');
      }

      toast.success(result.message || 'Score recorded successfully');
      // Clear the input and refresh data
      setScores(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await fetchData();
    } catch (error) {
      console.error('Error recording oral score:', error);
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error(error.message || 'Failed to record score');
      }
    } finally {
      setSaving(null);
    }
  };

  const renderGradedItem = (key, label) => {
    const existing = attemptMap[key];
    if (!existing) return null;
    const passed = existing.percentage >= (settings?.pass_mark || 50);

    return (
      <div key={key} className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {passed ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
            <span className="text-sm font-medium text-gray-900">{label}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-medium">ORAL</span>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {existing.percentage}%
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1.5">
          Submitted on {new Date(existing.completed_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
          {existing.oral_notes && (
            <span className="block mt-1 italic text-gray-400">Notes: {existing.oral_notes}</span>
          )}
        </div>
      </div>
    );
  };

  const renderUngradedItem = (key, label, type, milestoneIndex) => {
    const draft = scores[key] || {};

    return (
      <div key={key} className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Mic className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-medium">ORAL</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 sm:items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Score (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="e.g. 75"
              value={draft.percentage ?? ''}
              onChange={(e) => handleScoreChange(key, 'percentage', e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
            <input
              type="text"
              placeholder="Brief notes..."
              value={draft.notes ?? ''}
              onChange={(e) => handleScoreChange(key, 'notes', e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
          </div>
          <button
            onClick={() => handleSubmitScore(key, type, milestoneIndex)}
            disabled={saving === key || (!draft.percentage && draft.percentage !== 0)}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50 whitespace-nowrap"
          >
            <Save className="h-3 w-3" />
            {saving === key ? '...' : 'Submit'}
          </button>
        </div>
      </div>
    );
  };

  // Split milestones into graded and pending
  const gradedMilestones = oralMilestones.filter(({ idx }) => attemptMap[`milestone_${idx}`]);
  const pendingMilestones = oralMilestones.filter(({ idx }) => !attemptMap[`milestone_${idx}`]);
  const examGraded = isExamOral && attemptMap['final_exam'];
  const examPending = isExamOral && !attemptMap['final_exam'];
  const pendingCount = pendingMilestones.length + (examPending ? 1 : 0);
  const gradedCount = gradedMilestones.length + (examGraded ? 1 : 0);

  return (
    <div className="mt-4 border border-orange-200 rounded-lg bg-orange-50/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-bold text-gray-900">Oral Test Grading</span>
          {pendingCount > 0 ? (
            <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
              {pendingCount} pending
            </span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
              All graded
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Pending (ungraded) items — show form */}
          {pendingMilestones.map(({ idx }) =>
            renderUngradedItem(
              `milestone_${idx}`,
              `Milestone ${idx + 1} — ${milestones[idx]?.name || ''}`,
              'milestone',
              idx
            )
          )}
          {examPending &&
            renderUngradedItem('final_exam', 'Final Exam', 'final_exam', null)
          }

          {/* Graded items — read-only */}
          {gradedCount > 0 && (
            <>
              {pendingCount > 0 && (
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider pt-2">
                  Completed
                </div>
              )}
              {gradedMilestones.map(({ idx }) =>
                renderGradedItem(
                  `milestone_${idx}`,
                  `Milestone ${idx + 1} — ${milestones[idx]?.name || ''}`
                )
              )}
              {examGraded &&
                renderGradedItem('final_exam', 'Final Exam')
              }
            </>
          )}
        </div>
      )}

      {/* Confirmation dialog */}
      {confirming && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Confirm Score Submission</h3>
            <p className="text-sm text-gray-600 mb-1">
              You are about to submit a score of <span className="font-bold text-gray-900">{confirming.pct}%</span> for this oral test.
            </p>
            <p className="text-xs text-amber-600 mb-4">
              This score cannot be changed after submission.
            </p>
            {confirming.notes && (
              <p className="text-xs text-gray-500 mb-4 italic">Notes: {confirming.notes}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 font-medium"
              >
                Submit Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
