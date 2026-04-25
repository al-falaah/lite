import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import {
  Mic, Save, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Plus, BookOpen, FilePlus, Tag, Trash2, Lock, Unlock,
} from 'lucide-react';
import { toast } from 'sonner';
import { PROGRAMS } from '../../config/programs';
import QuestionPickerModal from './QuestionPickerModal';

/**
 * Oral test grading with per-question rubric.
 *
 * Each rubric row has:
 *   { source, question_id?, text, score, max, weight, notes, locked }
 *   source: 'bank' | 'ad_hoc' | 'quick_mark'
 *
 * When the teacher clicks the lock toggle on a row, a confirm modal pops
 * up before the row is locked. Locked rows still contribute to the running
 * total, and only when ALL rows are locked can the teacher submit.
 *
 * Drafts are persisted to localStorage so the teacher can pause and resume
 * without losing progress.
 */

const DRAFT_KEY_PREFIX = 'oral-grading-draft-v1';

function makeRow(partial = {}) {
  return {
    rid: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    source: 'ad_hoc',
    question_id: null,
    picker_id: null,
    text: '',
    score: '',
    max: 10,
    weight: 1,
    notes: '',
    locked: false,
    save_to_bank: false,
    ...partial,
  };
}

function computeTotal(rubric) {
  let earnedW = 0;
  let possibleW = 0;
  for (const r of rubric) {
    const s = parseFloat(r.score);
    const m = parseFloat(r.max);
    const w = parseFloat(r.weight) || 1;
    if (Number.isFinite(s) && Number.isFinite(m) && m > 0) {
      earnedW += (s / m) * w;
      possibleW += w;
    }
  }
  if (possibleW === 0) return 0;
  return Math.round((earnedW / possibleW) * 100 * 10) / 10;
}

export default function OralTestGrading({ student, program, currentWeek }) {
  const [settings, setSettings] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key being saved
  const [expanded, setExpanded] = useState(false);

  // Active rubric editing — per item key
  const [rubrics, setRubrics] = useState({}); // { [key]: rubric[] }
  const [overallNotes, setOverallNotes] = useState({}); // { [key]: string }

  // Picker modal state
  const [picker, setPicker] = useState(null); // { key, type, milestoneIndex }

  // Per-row lock confirmation
  const [lockConfirm, setLockConfirm] = useState(null); // { key, rid, computed }

  // Final submit confirmation
  const [submitConfirm, setSubmitConfirm] = useState(null); // { key, type, milestoneIndex, total }

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

  const oralMilestones = milestones
    .map((m, idx) => ({ ...m, idx }))
    .filter(({ idx }) => testModes[String(idx)] === 'oral')
    .filter(m => currentWeek >= m.weekEnd);

  const allMilestonesCompleted = milestones.every((_, idx) => {
    const existing = attempts.find(a => a.type === 'milestone' && a.milestone_index === idx && (a.status === 'completed' || a.status === 'timed_out'));
    return !!existing;
  });
  const isExamOral = testModes['final_exam'] === 'oral' && allMilestonesCompleted;

  // Load draft from localStorage when rubric is created/loaded for first time
  const draftKeyFor = (itemKey) => `${DRAFT_KEY_PREFIX}:${student?.id}:${program}:${itemKey}`;

  const ensureRubric = (itemKey) => {
    if (rubrics[itemKey]) return;
    let initialRubric = [];
    let initialNotes = '';
    try {
      const raw = localStorage.getItem(draftKeyFor(itemKey));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.rubric)) initialRubric = parsed.rubric;
        if (typeof parsed.overall_notes === 'string') initialNotes = parsed.overall_notes;
      }
    } catch {}
    setRubrics((prev) => ({ ...prev, [itemKey]: initialRubric }));
    setOverallNotes((prev) => ({ ...prev, [itemKey]: initialNotes }));
  };

  // Persist draft on every change
  useEffect(() => {
    Object.keys(rubrics).forEach((itemKey) => {
      try {
        localStorage.setItem(
          draftKeyFor(itemKey),
          JSON.stringify({ rubric: rubrics[itemKey], overall_notes: overallNotes[itemKey] || '' })
        );
      } catch {}
    });
  }, [rubrics, overallNotes]);

  if (loading) return null;
  if (oralMilestones.length === 0 && !isExamOral) return null;

  // Build map of existing oral attempts (graded)
  const attemptMap = {};
  attempts.forEach(a => {
    const key = a.type === 'final_exam' ? 'final_exam' : `milestone_${a.milestone_index}`;
    if (!attemptMap[key] || a.percentage > attemptMap[key].percentage) {
      attemptMap[key] = a;
    }
  });

  const updateRow = (itemKey, rid, patch) => {
    setRubrics((prev) => ({
      ...prev,
      [itemKey]: (prev[itemKey] || []).map((r) => (r.rid === rid ? { ...r, ...patch } : r)),
    }));
  };

  const addRow = (itemKey, partial) => {
    ensureRubric(itemKey);
    setRubrics((prev) => ({
      ...prev,
      [itemKey]: [...(prev[itemKey] || []), makeRow(partial)],
    }));
  };

  const addBankQuestions = (itemKey, picked) => {
    ensureRubric(itemKey);
    setRubrics((prev) => ({
      ...prev,
      [itemKey]: [
        ...(prev[itemKey] || []),
        // picker returns rows shaped: { id: 'test:<uuid>'|'lesson:<uuid>', source, question_id, question_text, ... }
        ...picked.map((q) =>
          makeRow({
            source: 'bank',
            question_id: q.question_id, // null for lesson_quiz rows (text is the source of truth)
            picker_id: q.id, // prefixed id used to dedupe in the picker
            text: q.question_text,
          })
        ),
      ],
    }));
  };

  const removeRow = (itemKey, rid) => {
    setRubrics((prev) => ({
      ...prev,
      [itemKey]: (prev[itemKey] || []).filter((r) => r.rid !== rid),
    }));
  };

  const requestLockRow = (itemKey, rid) => {
    const row = (rubrics[itemKey] || []).find((r) => r.rid === rid);
    if (!row) return;
    const s = parseFloat(row.score);
    const m = parseFloat(row.max);
    if (!Number.isFinite(s) || !Number.isFinite(m) || m <= 0) {
      toast.error('Enter a score and max before locking this question');
      return;
    }
    if (s < 0 || s > m) {
      toast.error(`Score must be between 0 and ${m}`);
      return;
    }
    if (row.source === 'ad_hoc' && !row.text?.trim()) {
      toast.error('Add the question text before locking');
      return;
    }
    if (row.source === 'quick_mark' && !row.text?.trim()) {
      toast.error('Add a label before locking this mark');
      return;
    }
    const computed = Math.round((s / m) * 100 * 10) / 10;
    setLockConfirm({ key: itemKey, rid, computed, row });
  };

  const confirmLockRow = () => {
    if (!lockConfirm) return;
    updateRow(lockConfirm.key, lockConfirm.rid, { locked: true });
    setLockConfirm(null);
  };

  const unlockRow = (itemKey, rid) => {
    updateRow(itemKey, rid, { locked: false });
  };

  const requestSubmit = (itemKey, type, milestoneIndex) => {
    const rubric = rubrics[itemKey] || [];
    if (rubric.length === 0) {
      toast.error('Add at least one question to the rubric');
      return;
    }
    const allLocked = rubric.every((r) => r.locked);
    if (!allLocked) {
      toast.error('Lock every question first by clicking the lock icon on each row');
      return;
    }
    const total = computeTotal(rubric);
    setSubmitConfirm({ key: itemKey, type, milestoneIndex, total });
  };

  const confirmSubmit = async () => {
    if (!submitConfirm) return;
    const { key, type, milestoneIndex, total } = submitConfirm;
    setSubmitConfirm(null);
    setSaving(key);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error('Session expired. Please log in again.');
        setSaving(null);
        return;
      }

      const rubric = rubrics[key] || [];
      const payloadRubric = rubric.map((r) => ({
        source: r.source,
        question_id: r.question_id || null,
        text: r.text || '',
        score: Number(r.score),
        max: Number(r.max),
        weight: Number(r.weight) || 1,
        notes: r.notes || '',
        save_to_bank: r.source === 'ad_hoc' && !!r.save_to_bank,
      }));

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
              rubric: payloadRubric,
              overall_notes: overallNotes[key] || '',
              client_total: total, // sanity reference; backend recomputes
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
      // Clear local draft
      try { localStorage.removeItem(draftKeyFor(key)); } catch {}
      setRubrics((prev) => { const next = { ...prev }; delete next[key]; return next; });
      setOverallNotes((prev) => { const next = { ...prev }; delete next[key]; return next; });
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
    const rubric = existing?.answers?.rubric || null;

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
            {Number(existing.percentage).toFixed(1)}%
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1.5">
          Submitted on {new Date(existing.completed_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        {rubric && Array.isArray(rubric) && rubric.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              View {rubric.length} question{rubric.length === 1 ? '' : 's'} graded
            </summary>
            <ul className="mt-2 space-y-1.5">
              {rubric.map((r, i) => (
                <li key={i} className="text-xs text-gray-600 border-l-2 border-gray-200 pl-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1">{r.text || '(no text)'}</span>
                    <span className="font-mono text-gray-700 whitespace-nowrap">{r.score}/{r.max}{r.weight > 1 ? ` ×${r.weight}` : ''}</span>
                  </div>
                  {r.notes && <div className="text-[11px] text-gray-400 italic mt-0.5">{r.notes}</div>}
                </li>
              ))}
            </ul>
          </details>
        )}
        {existing.oral_notes && (
          <div className="text-xs text-gray-500 italic mt-2">Overall: {existing.oral_notes}</div>
        )}
      </div>
    );
  };

  const renderRubricEditor = (itemKey, label, type, milestoneIndex) => {
    ensureRubric(itemKey);
    const rubric = rubrics[itemKey] || [];
    const total = computeTotal(rubric);
    const allLocked = rubric.length > 0 && rubric.every((r) => r.locked);
    const canSubmit = allLocked && saving !== itemKey;

    return (
      <div key={itemKey} className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Mic className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-sm font-medium text-gray-900">{label}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-medium">ORAL</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Total: </span>
            <span className={`font-bold ${total >= (settings?.pass_mark || 50) ? 'text-emerald-600' : 'text-red-600'}`}>
              {total.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Rubric rows */}
        {rubric.length === 0 ? (
          <div className="text-xs text-gray-500 italic py-3 text-center bg-gray-50 rounded mb-3">
            No questions yet. Add from the bank, write a new one, or add a quick mark.
          </div>
        ) : (
          <ul className="space-y-2 mb-3">
            {rubric.map((r, idx) => (
              <li key={r.rid} className={`p-2 rounded border ${r.locked ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-400 mt-1 flex-shrink-0">Q{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    {r.source === 'bank' ? (
                      <p className="text-sm text-gray-900 leading-snug">{r.text}</p>
                    ) : (
                      <textarea
                        value={r.text}
                        onChange={(e) => updateRow(itemKey, r.rid, { text: e.target.value })}
                        placeholder={r.source === 'quick_mark' ? 'Label (e.g. Recitation accuracy)' : 'Type the question...'}
                        rows={r.source === 'quick_mark' ? 1 : 2}
                        disabled={r.locked}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-y disabled:bg-gray-50 disabled:text-gray-600"
                      />
                    )}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded inline-flex items-center gap-1">
                        {r.source === 'bank' ? <BookOpen className="h-2.5 w-2.5" /> : r.source === 'ad_hoc' ? <FilePlus className="h-2.5 w-2.5" /> : <Tag className="h-2.5 w-2.5" />}
                        {r.source === 'bank' ? 'From bank' : r.source === 'ad_hoc' ? 'New question' : 'Quick mark'}
                      </span>
                      {r.source === 'ad_hoc' && (
                        <label className="text-[10px] text-gray-600 inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!r.save_to_bank}
                            onChange={(e) => updateRow(itemKey, r.rid, { save_to_bank: e.target.checked })}
                            disabled={r.locked}
                            className="h-3 w-3"
                          />
                          Save to bank for next time
                        </label>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeRow(itemKey, r.rid)}
                    disabled={r.locked}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 block">Score</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={r.score}
                      onChange={(e) => updateRow(itemKey, r.rid, { score: e.target.value })}
                      disabled={r.locked}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block">Out of</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={r.max}
                      onChange={(e) => updateRow(itemKey, r.rid, { max: e.target.value })}
                      disabled={r.locked}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block">Weight</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={r.weight}
                      onChange={(e) => updateRow(itemKey, r.rid, { weight: e.target.value })}
                      disabled={r.locked}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-50"
                    />
                  </div>
                  <div className="flex items-end">
                    {r.locked ? (
                      <button
                        onClick={() => unlockRow(itemKey, r.rid)}
                        className="w-full inline-flex items-center justify-center gap-1 px-2 py-1 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50"
                      >
                        <Unlock className="h-3 w-3" /> Unlock
                      </button>
                    ) : (
                      <button
                        onClick={() => requestLockRow(itemKey, r.rid)}
                        className="w-full inline-flex items-center justify-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 border border-orange-200 rounded text-xs hover:bg-orange-200 font-medium"
                      >
                        <Lock className="h-3 w-3" /> Lock
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  value={r.notes || ''}
                  onChange={(e) => updateRow(itemKey, r.rid, { notes: e.target.value })}
                  placeholder="Per-question notes (optional)"
                  disabled={r.locked}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs mt-2 disabled:bg-gray-50"
                />
              </li>
            ))}
          </ul>
        )}

        {/* Add buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setPicker({ key: itemKey, type, milestoneIndex })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
          >
            <BookOpen className="h-3 w-3" /> Pick from bank
          </button>
          <button
            onClick={() => addRow(itemKey, { source: 'ad_hoc', max: 10 })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
          >
            <FilePlus className="h-3 w-3" /> New question
          </button>
          <button
            onClick={() => addRow(itemKey, { source: 'quick_mark', max: 10 })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
          >
            <Tag className="h-3 w-3" /> Quick mark
          </button>
        </div>

        {/* Overall notes + submit */}
        <div className="border-t pt-3">
          <input
            type="text"
            value={overallNotes[itemKey] || ''}
            onChange={(e) => setOverallNotes((prev) => ({ ...prev, [itemKey]: e.target.value }))}
            placeholder="Overall feedback for the student (optional)"
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm mb-2"
          />
          <button
            onClick={() => requestSubmit(itemKey, type, milestoneIndex)}
            disabled={!canSubmit}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" />
            {saving === itemKey ? 'Submitting…' : `Submit ${total.toFixed(1)}%`}
          </button>
          {!allLocked && rubric.length > 0 && (
            <p className="text-[11px] text-gray-500 italic text-center mt-1">
              Lock all {rubric.length} question{rubric.length === 1 ? '' : 's'} to enable submit.
            </p>
          )}
        </div>
      </div>
    );
  };

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
          {pendingMilestones.map(({ idx }) =>
            renderRubricEditor(
              `milestone_${idx}`,
              `Milestone ${idx + 1} — ${milestones[idx]?.name || ''}`,
              'milestone',
              idx
            )
          )}
          {examPending &&
            renderRubricEditor('final_exam', 'Final Exam', 'final_exam', null)
          }

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

      {/* Question picker modal */}
      {picker && (
        <QuestionPickerModal
          programId={program}
          milestoneIndex={picker.milestoneIndex}
          type={picker.type}
          alreadyPickedIds={(rubrics[picker.key] || []).filter((r) => r.source === 'bank' && r.picker_id).map((r) => r.picker_id)}
          onPick={(picked) => {
            addBankQuestions(picker.key, picked);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {/* Per-row lock confirmation */}
      {lockConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-3">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Lock this question's score?</h3>
            <div className="text-sm text-gray-700 space-y-1.5 mb-4">
              <p className="text-xs text-gray-500">Question</p>
              <p className="line-clamp-3">{lockConfirm.row.text || '(no text)'}</p>
              <p className="text-xs text-gray-500 mt-2">Score</p>
              <p className="font-mono">
                {lockConfirm.row.score}/{lockConfirm.row.max}
                {lockConfirm.row.weight > 1 ? ` × weight ${lockConfirm.row.weight}` : ''}
                <span className="ml-2 text-gray-500">({lockConfirm.computed}%)</span>
              </p>
              {lockConfirm.row.notes && (
                <>
                  <p className="text-xs text-gray-500 mt-2">Notes</p>
                  <p className="italic text-gray-600">{lockConfirm.row.notes}</p>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              You can unlock this row later if you change your mind, but only before submitting the final score.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setLockConfirm(null)} className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmLockRow} className="flex-1 px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 font-medium">
                Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final submit confirmation */}
      {submitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-3">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Submit final score?</h3>
            <p className="text-sm text-gray-700 mb-1">
              Computed total: <span className="font-bold text-gray-900">{submitConfirm.total.toFixed(1)}%</span>
            </p>
            <p className="text-xs text-amber-600 mb-4">
              This score is final and cannot be changed after submission.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSubmitConfirm(null)} className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmSubmit} className="flex-1 px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 font-medium">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
