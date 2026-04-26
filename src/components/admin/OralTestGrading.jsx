import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
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
 * Locking a row freezes its score (with confirmation). Submit is enabled
 * only when every row is locked. Drafts persist to localStorage.
 *
 * Visual approach: standard card-based UI with proper bordered inputs and
 * real buttons. Greyscale palette with a single emerald accent on the
 * primary submit action. No coloured theme tint, no decorative icons,
 * no traffic-light pills.
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

function sourceLabel(source) {
  if (source === 'bank') return 'From bank';
  if (source === 'ad_hoc') return 'New question';
  if (source === 'quick_mark') return 'Quick mark';
  return source;
}

// Reusable input class — bordered, padded, focus ring. The standard.
const inputClass =
  'w-full text-sm text-slate-900 placeholder-slate-400 ' +
  'border border-slate-200 rounded-md px-3 py-2 bg-white ' +
  'focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 focus:outline-none ' +
  'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

// Compact variant for inline numerics
const numInputClass =
  'text-sm tabular-nums text-slate-900 ' +
  'border border-slate-200 rounded-md px-2 py-1.5 bg-white ' +
  'focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 focus:outline-none ' +
  'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

const btnPrimary =
  'inline-flex items-center justify-center px-4 py-2 ' +
  'bg-emerald-600 text-white text-sm font-medium rounded-md ' +
  'hover:bg-emerald-700 active:bg-emerald-800 ' +
  'disabled:bg-gray-200 disabled:text-slate-400 disabled:cursor-not-allowed ' +
  'transition-colors';

const btnSecondary =
  'inline-flex items-center justify-center px-3 py-2 ' +
  'bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md ' +
  'hover:bg-slate-50 hover:border-slate-400 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'transition-colors';

const btnGhost =
  'inline-flex items-center justify-center px-2 py-1 ' +
  'text-slate-600 text-xs font-medium rounded ' +
  'hover:bg-slate-100 hover:text-slate-900 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'transition-colors';

export default function OralTestGrading({ student, program, currentWeek }) {
  const [settings, setSettings] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key being saved

  const [rubrics, setRubrics] = useState({});
  const [overallNotes, setOverallNotes] = useState({});

  const [picker, setPicker] = useState(null);
  const [lockConfirm, setLockConfirm] = useState(null);
  const [submitConfirm, setSubmitConfirm] = useState(null);

  const programConfig = PROGRAMS[program];
  const milestones = programConfig?.milestones || [];

  useEffect(() => {
    if (student?.auth_user_id && program) fetchData();
  }, [student?.auth_user_id, program]);

  const fetchData = async () => {
    try {
      const [settingsRes, attemptsRes] = await Promise.all([
        supabase.from('program_test_settings').select('*').eq('program_id', program).single(),
        supabase.from('test_attempts').select('*')
          .eq('student_id', student.auth_user_id).eq('program_id', program).eq('is_oral', true)
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

  const allMilestonesCompleted = milestones.every((_, idx) =>
    !!attempts.find(a => a.type === 'milestone' && a.milestone_index === idx && (a.status === 'completed' || a.status === 'timed_out'))
  );
  const isExamOral = testModes['final_exam'] === 'oral' && allMilestonesCompleted;

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
    } catch { /* ignore */ }
    setRubrics(prev => ({ ...prev, [itemKey]: initialRubric }));
    setOverallNotes(prev => ({ ...prev, [itemKey]: initialNotes }));
  };

  useEffect(() => {
    Object.keys(rubrics).forEach((itemKey) => {
      try {
        localStorage.setItem(
          draftKeyFor(itemKey),
          JSON.stringify({ rubric: rubrics[itemKey], overall_notes: overallNotes[itemKey] || '' })
        );
      } catch { /* quota */ }
    });
  }, [rubrics, overallNotes]);

  if (loading) return null;
  if (oralMilestones.length === 0 && !isExamOral) return null;

  const attemptMap = {};
  attempts.forEach(a => {
    const key = a.type === 'final_exam' ? 'final_exam' : `milestone_${a.milestone_index}`;
    if (!attemptMap[key] || a.percentage > attemptMap[key].percentage) attemptMap[key] = a;
  });

  // ── Mutations ────────────────────────────────────────────
  const updateRow = (itemKey, rid, patch) => {
    setRubrics(prev => ({
      ...prev,
      [itemKey]: (prev[itemKey] || []).map(r => (r.rid === rid ? { ...r, ...patch } : r)),
    }));
  };

  const addRow = (itemKey, partial) => {
    ensureRubric(itemKey);
    setRubrics(prev => ({ ...prev, [itemKey]: [...(prev[itemKey] || []), makeRow(partial)] }));
  };

  const addBankQuestions = (itemKey, picked) => {
    ensureRubric(itemKey);
    setRubrics(prev => ({
      ...prev,
      [itemKey]: [
        ...(prev[itemKey] || []),
        ...picked.map(q => makeRow({
          source: 'bank',
          question_id: q.question_id,
          picker_id: q.id,
          text: q.question_text,
        })),
      ],
    }));
  };

  const removeRow = (itemKey, rid) => {
    setRubrics(prev => ({ ...prev, [itemKey]: (prev[itemKey] || []).filter(r => r.rid !== rid) }));
  };

  const requestLockRow = (itemKey, rid) => {
    const row = (rubrics[itemKey] || []).find(r => r.rid === rid);
    if (!row) return;
    const s = parseFloat(row.score);
    const m = parseFloat(row.max);
    if (!Number.isFinite(s) || !Number.isFinite(m) || m <= 0) {
      toast.error('Enter a score and out-of value before locking');
      return;
    }
    if (s < 0 || s > m) {
      toast.error(`Score must be between 0 and ${m}`);
      return;
    }
    if (row.source !== 'bank' && !row.text?.trim()) {
      toast.error(row.source === 'quick_mark' ? 'Add a label before locking' : 'Add the question text before locking');
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

  const unlockRow = (itemKey, rid) => updateRow(itemKey, rid, { locked: false });

  const requestSubmit = (itemKey, type, milestoneIndex) => {
    const rubric = rubrics[itemKey] || [];
    if (rubric.length === 0) { toast.error('Add at least one question'); return; }
    if (!rubric.every(r => r.locked)) { toast.error('Lock every question before submitting'); return; }
    setSubmitConfirm({ key: itemKey, type, milestoneIndex, total: computeTotal(rubric) });
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
      const payloadRubric = rubric.map(r => ({
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
              client_total: total,
            }),
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      let result;
      try { result = await response.json(); }
      catch { throw new Error(`Server returned status ${response.status} with non-JSON body`); }

      if (!response.ok) throw new Error(result.error || 'Failed to record score');

      toast.success(result.message || 'Score recorded');
      try { localStorage.removeItem(draftKeyFor(key)); } catch { /* ignore */ }
      setRubrics(prev => { const n = { ...prev }; delete n[key]; return n; });
      setOverallNotes(prev => { const n = { ...prev }; delete n[key]; return n; });
      await fetchData();
    } catch (error) {
      console.error('Error recording oral score:', error);
      toast.error(error.name === 'AbortError' ? 'Request timed out. Please try again.' : (error.message || 'Failed to record score'));
    } finally {
      setSaving(null);
    }
  };

  // ── Renderers ────────────────────────────────────────────

  const renderGradedItem = (key, label) => {
    const existing = attemptMap[key];
    if (!existing) return null;
    const passed = existing.percentage >= (settings?.pass_mark || 50);
    const rubric = existing?.answers?.rubric || null;

    return (
      <div key={key} className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submitted {new Date(existing.completed_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-lg font-semibold tabular-nums ${passed ? 'text-emerald-700' : 'text-red-700'}`}>
              {Number(existing.percentage).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{passed ? 'Passed' : 'Did not pass'}</div>
          </div>
        </div>

        {rubric && Array.isArray(rubric) && rubric.length > 0 && (
          <details className="px-5 py-3 group">
            <summary className="text-sm text-slate-700 cursor-pointer hover:text-slate-900 select-none flex items-center gap-1">
              <span>View {rubric.length} question{rubric.length === 1 ? '' : 's'}</span>
              <svg className="h-3.5 w-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </summary>
            <ul className="mt-3 space-y-3">
              {rubric.map((r, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-800 flex-1">{r.text || '(no text)'}</span>
                    <span className="font-mono text-slate-700 whitespace-nowrap text-xs tabular-nums">
                      {r.score}/{r.max}{r.weight > 1 ? ` ×${r.weight}` : ''}
                    </span>
                  </div>
                  {r.notes && <div className="text-xs text-slate-500 italic mt-0.5">{r.notes}</div>}
                </li>
              ))}
            </ul>
          </details>
        )}
        {existing.oral_notes && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Overall feedback</p>
            <p className="text-sm text-slate-700 italic">"{existing.oral_notes}"</p>
          </div>
        )}
      </div>
    );
  };

  const renderRubricEditor = (itemKey, label, type, milestoneIndex) => {
    ensureRubric(itemKey);
    const rubric = rubrics[itemKey] || [];
    const total = computeTotal(rubric);
    const allLocked = rubric.length > 0 && rubric.every(r => r.locked);
    const isSaving = saving === itemKey;

    return (
      <div key={itemKey} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
          <div className="text-right">
            <div className="text-xs text-slate-500">Running total</div>
            <div className="text-lg font-semibold tabular-nums text-slate-900">{total.toFixed(1)}%</div>
          </div>
        </div>

        {/* Rubric rows */}
        <div className="px-5 py-4">
          {rubric.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-600">No questions yet.</p>
              <p className="text-xs text-slate-500 mt-1">Pick from the bank, write a new one, or add a quick mark below.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {rubric.map((r, idx) => (
                <li
                  key={r.rid}
                  className={`border rounded-lg p-3 transition-colors ${
                    r.locked ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Question text + remove */}
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono text-slate-400 mt-2 w-6 flex-shrink-0">Q{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      {r.source === 'bank' ? (
                        <p className="text-sm text-slate-900 leading-snug py-2">{r.text}</p>
                      ) : (
                        <textarea
                          value={r.text}
                          onChange={(e) => updateRow(itemKey, r.rid, { text: e.target.value })}
                          placeholder={r.source === 'quick_mark' ? 'Label (e.g. Recitation accuracy)' : 'Type the question…'}
                          rows={r.source === 'quick_mark' ? 1 : 2}
                          disabled={r.locked}
                          className={`${inputClass} resize-none`}
                        />
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                        <span>{sourceLabel(r.source)}</span>
                        {r.source === 'ad_hoc' && (
                          <>
                            <span className="text-gray-300">·</span>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700">
                              <input
                                type="checkbox"
                                checked={!!r.save_to_bank}
                                onChange={(e) => updateRow(itemKey, r.rid, { save_to_bank: e.target.checked })}
                                disabled={r.locked}
                                className="h-3.5 w-3.5 rounded border-slate-300 accent-gray-900"
                              />
                              Save to bank
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeRow(itemKey, r.rid)}
                      disabled={r.locked}
                      className={btnGhost}
                      aria-label="Remove question"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Score / max / weight + lock */}
                  <div className="flex items-end gap-3 mt-3 ml-9 flex-wrap">
                    <div className="flex items-end gap-1.5">
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Score</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={r.score}
                          onChange={(e) => updateRow(itemKey, r.rid, { score: e.target.value })}
                          disabled={r.locked}
                          placeholder="0"
                          className={`${numInputClass} w-16 text-right`}
                        />
                      </div>
                      <span className="text-sm text-slate-400 pb-2">/</span>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Max</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={r.max}
                          onChange={(e) => updateRow(itemKey, r.rid, { max: e.target.value })}
                          disabled={r.locked}
                          className={`${numInputClass} w-16`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Weight</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={r.weight}
                        onChange={(e) => updateRow(itemKey, r.rid, { weight: e.target.value })}
                        disabled={r.locked}
                        className={`${numInputClass} w-14`}
                      />
                    </div>
                    <div className="ml-auto">
                      {r.locked ? (
                        <button onClick={() => unlockRow(itemKey, r.rid)} className={btnSecondary}>
                          Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => requestLockRow(itemKey, r.rid)}
                          className={btnPrimary}
                        >
                          Lock score
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
                    className={`${inputClass} mt-3 ml-9`}
                    style={{ width: 'calc(100% - 2.25rem)' }}
                  />
                </li>
              ))}
            </ul>
          )}

          {/* Add buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => setPicker({ key: itemKey, type, milestoneIndex })} className={btnSecondary}>
              + Pick from bank
            </button>
            <button onClick={() => addRow(itemKey, { source: 'ad_hoc', max: 10 })} className={btnSecondary}>
              + New question
            </button>
            <button onClick={() => addRow(itemKey, { source: 'quick_mark', max: 10 })} className={btnSecondary}>
              + Quick mark
            </button>
          </div>
        </div>

        {/* Submit footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
          <div className="mb-3">
            <label className="text-xs font-medium text-slate-700 block mb-1.5">Overall feedback (optional)</label>
            <input
              type="text"
              value={overallNotes[itemKey] || ''}
              onChange={(e) => setOverallNotes(prev => ({ ...prev, [itemKey]: e.target.value }))}
              placeholder="A short note for the student"
              className={inputClass}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {!allLocked && rubric.length > 0
                ? `Lock all ${rubric.length} question${rubric.length === 1 ? '' : 's'} to submit.`
                : rubric.length === 0
                  ? 'Add a question above to get started.'
                  : 'All locked — ready to submit.'}
            </p>
            <button
              onClick={() => requestSubmit(itemKey, type, milestoneIndex)}
              disabled={!allLocked || isSaving}
              className={btnPrimary}
            >
              {isSaving ? 'Submitting…' : `Submit ${total.toFixed(1)}%`}
            </button>
          </div>
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
    <div className="space-y-4">
      {/* Status row */}
      {(pendingCount + gradedCount) > 0 && (
        <p className="text-sm text-slate-500">
          {pendingCount > 0 ? `${pendingCount} pending` : 'All graded'}
          {gradedCount > 0 && pendingCount > 0 && ` · ${gradedCount} graded`}
        </p>
      )}

      {pendingMilestones.map(({ idx }) =>
        renderRubricEditor(
          `milestone_${idx}`,
          `Milestone ${idx + 1} — ${milestones[idx]?.name || ''}`,
          'milestone',
          idx
        )
      )}
      {examPending && renderRubricEditor('final_exam', 'Final exam', 'final_exam', null)}

      {gradedCount > 0 && (
        <>
          <div className="pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</h4>
          </div>
          {gradedMilestones.map(({ idx }) =>
            renderGradedItem(`milestone_${idx}`, `Milestone ${idx + 1} — ${milestones[idx]?.name || ''}`)
          )}
          {examGraded && renderGradedItem('final_exam', 'Final exam')}
        </>
      )}

      {/* Question picker */}
      {picker && (
        <QuestionPickerModal
          programId={program}
          milestoneIndex={picker.milestoneIndex}
          type={picker.type}
          alreadyPickedIds={(rubrics[picker.key] || []).filter(r => r.source === 'bank' && r.picker_id).map(r => r.picker_id)}
          onPick={(picked) => { addBankQuestions(picker.key, picked); setPicker(null); }}
          onClose={() => setPicker(null)}
        />
      )}

      {/* Lock-row confirmation */}
      {lockConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Lock this question?</h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Question</p>
                <p className="text-sm text-slate-900 line-clamp-3">{lockConfirm.row.text || '(no text)'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Score</p>
                <p className="text-sm font-mono tabular-nums text-slate-900">
                  {lockConfirm.row.score}/{lockConfirm.row.max}
                  {lockConfirm.row.weight > 1 ? ` × weight ${lockConfirm.row.weight}` : ''}
                  <span className="ml-2 text-slate-500">({lockConfirm.computed}%)</span>
                </p>
              </div>
              {lockConfirm.row.notes && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm italic text-slate-700">{lockConfirm.row.notes}</p>
                </div>
              )}
              <p className="text-xs text-slate-500">You can unlock the row later, but only before submitting.</p>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => setLockConfirm(null)} className={btnSecondary}>Cancel</button>
              <button onClick={confirmLockRow} className={btnPrimary}>Lock score</button>
            </div>
          </div>
        </div>
      )}

      {/* Final submit confirmation */}
      {submitConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Submit final score?</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-slate-700 mb-1">
                Total: <span className="font-semibold text-slate-900 tabular-nums">{submitConfirm.total.toFixed(1)}%</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">Once submitted, the score is final and cannot be changed.</p>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => setSubmitConfirm(null)} className={btnSecondary}>Cancel</button>
              <button onClick={confirmSubmit} className={btnPrimary}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
