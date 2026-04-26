import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';
import VoiceNote from '../common/VoiceNote';

const GRADE_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'needs_improvement', label: 'Needs improvement' },
];

const GRADE_LABEL = Object.fromEntries(GRADE_OPTIONS.map(g => [g.value, g.label]));
const MAX_SECONDS = 900;

const inputClass =
  'w-full text-sm text-slate-900 placeholder-slate-400 ' +
  'border border-slate-300 rounded-md px-3 py-2 bg-white ' +
  'focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 focus:outline-none ' +
  'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

const btnPrimary =
  'inline-flex items-center justify-center px-4 py-2 ' +
  'bg-emerald-600 text-white text-sm font-medium rounded-md ' +
  'hover:bg-emerald-700 active:bg-emerald-800 ' +
  'disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed ' +
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
  'transition-colors';

/**
 * Recitation Practice — teacher side.
 *
 * One active recitation per (student, program). Teacher assigns a passage,
 * student records audio, teacher reviews with grade + optional feedback +
 * optional voice note.
 *
 * Visual approach: standard card-based UI in slate + emerald palette.
 * Real bordered inputs, real buttons, status as text. Selected grade
 * uses an emerald-tinted chip — branded selection, not greyscale.
 */
export default function RecitationAssignments({ student, program, teacherId }) {
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [passage, setPassage] = useState('');
  const [notes, setNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Review state
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Audio URLs
  const [studentUrl, setStudentUrl] = useState(null);
  const [teacherUrl, setTeacherUrl] = useState(null);
  const [studentRecording, setStudentRecording] = useState(false);

  const mrRef = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);
  const broadcastRef = useRef(null);

  useEffect(() => {
    if (student?.id && program) load();
    return () => stopRec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, program, teacherId]);

  useEffect(() => {
    if (!student?.id || !program) return;
    const channel = supabase
      .channel(`rec-teacher-${student.id}-${program}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'recitations',
        filter: `student_id=eq.${student.id}`,
      }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, program]);

  useEffect(() => {
    if (!student?.id || !program) return;
    const ch = supabase.channel(`rec-live-${student.id}-${program}`);
    ch.on('broadcast', { event: 'recording' }, ({ payload }) => {
      if (payload?.role === 'student') setStudentRecording(payload.active);
    }).subscribe();
    broadcastRef.current = ch;
    return () => { supabase.removeChannel(ch); broadcastRef.current = null; };
  }, [student?.id, program]);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_active_recitation', { p_student_id: student.id, p_program_id: program })
        .maybeSingle();
      if (error) throw error;
      setRec(data);
      setStudentUrl(null);
      setTeacherUrl(null);
      if (data?.student_audio_url) {
        const { data: s } = await supabase.storage.from('recitations').createSignedUrl(data.student_audio_url, 600);
        if (s?.signedUrl) setStudentUrl(s.signedUrl);
      }
      if (data?.teacher_audio_url) {
        const { data: s } = await supabase.storage.from('recitations').createSignedUrl(data.teacher_audio_url, 600);
        if (s?.signedUrl) setTeacherUrl(s.signedUrl);
      }
    } catch (err) {
      console.error('Error loading recitation:', err);
    } finally {
      setLoading(false);
    }
  };

  const cleanupOld = async () => {
    if (!rec) return;
    const files = [rec.student_audio_url, rec.teacher_audio_url].filter(Boolean);
    if (files.length) await supabase.storage.from('recitations').remove(files);
    await supabase.from('recitations').delete().eq('id', rec.id);
  };

  const handleAssign = async () => {
    if (!passage.trim()) return;
    setAssigning(true);
    try {
      if (rec) await cleanupOld();
      const { error } = await supabase.from('recitations').insert({
        student_id: student.id,
        teacher_id: teacherId,
        program_id: program,
        passage: passage.trim(),
        notes: notes.trim() || null,
        status: 'assigned',
      });
      if (error) throw error;
      setPassage('');
      setNotes('');
      setShowAssign(false);
      toast.success('Passage assigned');
      load();
    } catch (err) {
      console.error('Error assigning:', err);
      toast.error('Failed to assign passage');
    } finally {
      setAssigning(false);
    }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 48000, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mr = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 48000 });
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const b = new Blob(chunks.current, { type: mime });
        setBlob(b);
        setBlobUrl(URL.createObjectURL(b));
      };
      mrRef.current = mr;
      mr.start(1000);
      setRecording(true);
      setElapsed(0);
      setBlob(null);
      setBlobUrl(null);
      broadcastRef.current?.send({ type: 'broadcast', event: 'recording', payload: { role: 'teacher', active: true } });
      timer.current = setInterval(() => {
        setElapsed(p => { if (p >= MAX_SECONDS - 1) { stopRec(); return MAX_SECONDS; } return p + 1; });
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      toast.error('Could not access microphone');
    }
  };

  const stopRec = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    if (mrRef.current?.state === 'recording') mrRef.current.stop();
    setRecording(false);
    broadcastRef.current?.send({ type: 'broadcast', event: 'recording', payload: { role: 'teacher', active: false } });
  };

  const discardAudio = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlob(null);
    setBlobUrl(null);
    setElapsed(0);
    chunks.current = [];
    broadcastRef.current?.send({ type: 'broadcast', event: 'recording', payload: { role: 'teacher', active: false } });
  };

  const handleSubmitReview = async () => {
    if (!grade || !rec) { toast.error('Please select a grade'); return; }
    setUploading(true);
    try {
      let teacherAudioPath = null;
      if (blob) {
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        const path = student.id + '/' + rec.id + '/teacher.' + ext;
        const { error: ue } = await supabase.storage.from('recitations').upload(path, blob, { contentType: blob.type, upsert: true });
        if (ue) throw ue;
        teacherAudioPath = path;
      }
      const updateData = {
        grade,
        feedback: feedback.trim() || null,
        status: 'reviewed',
        reviewed_at: new Date().toISOString(),
      };
      if (teacherAudioPath) updateData.teacher_audio_url = teacherAudioPath;
      if (teacherId && !rec.teacher_id) updateData.teacher_id = teacherId;
      const { error } = await supabase.from('recitations').update(updateData).eq('id', rec.id);
      if (error) throw error;
      setGrade('');
      setFeedback('');
      discardAudio();
      toast.success('Review submitted');
      load();
    } catch (err) {
      console.error('Review error:', err);
      toast.error('Failed to submit review');
    } finally {
      setUploading(false);
    }
  };

  const deleteRecitation = async () => {
    if (!rec) return;
    try {
      await cleanupOld();
      setRec(null);
      setStudentUrl(null);
      setTeacherUrl(null);
      toast.success('Deleted');
    } catch (e) { console.error(e); }
  };

  const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
        <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
        <div className="h-12 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  const status = rec?.status;
  const needsReview = status === 'submitted';
  const canAssign = !rec || (status === 'reviewed' && rec.feedback_seen_at);
  const awaitingStudentView = status === 'reviewed' && !rec.feedback_seen_at;

  let statusText = null;
  let statusClass = 'text-slate-500';
  if (needsReview) {
    statusText = '1 to review';
    statusClass = 'text-amber-700';
  } else if (status === 'assigned' && studentRecording) {
    statusText = 'Student is recording…';
    statusClass = 'text-emerald-700';
  } else if (status === 'assigned') {
    statusText = 'Awaiting student';
    statusClass = 'text-slate-500';
  } else if (awaitingStudentView) {
    statusText = 'Awaiting student';
    statusClass = 'text-slate-500';
  } else if (status === 'reviewed') {
    statusText = 'Reviewed';
    statusClass = 'text-slate-500';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

      {/* Card header */}
      <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Recitation activity</h3>
          {statusText && <p className={`text-xs mt-0.5 ${statusClass}`}>{statusText}</p>}
        </div>
        {canAssign && !showAssign && (
          <button onClick={() => setShowAssign(true)} className={btnSecondary}>
            {rec ? 'Assign new passage' : 'Assign passage'}
          </button>
        )}
      </div>

      {/* Submitted — review form */}
      {needsReview && (
        <div className="px-5 py-4 space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-900">{rec.passage}</p>
            {rec.notes && <p className="text-sm text-slate-600 mt-0.5">{rec.notes}</p>}
            <p className="text-xs text-slate-500 mt-1">
              Sent {new Date(rec.submitted_at || rec.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {studentUrl && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-1.5">Student recording</p>
              <VoiceNote audioUrl={studentUrl} />
            </div>
          )}

          {/* Grade picker */}
          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">Grade</p>
            <div className="flex flex-wrap gap-2">
              {GRADE_OPTIONS.map(opt => {
                const selected = grade === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setGrade(opt.value)}
                    className={`text-sm px-3 py-1.5 rounded-md border font-medium transition-colors ${
                      selected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Written feedback */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">Written feedback (optional)</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="A note for the student"
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Voice note */}
          <div>
            <p className="text-xs font-medium text-slate-700 mb-1.5">Voice note (optional)</p>
            {!recording && !blob && (
              <button onClick={startRec} className={btnSecondary}>
                Record a voice note
              </button>
            )}
            {recording && (
              <div className="flex items-center justify-between gap-3 px-3 py-2 border border-slate-200 rounded-md bg-slate-50">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-mono tabular-nums">{fmt(elapsed)}</span>
                  <span className="text-slate-500">recording…</span>
                </div>
                <button onClick={stopRec} className={btnPrimary}>
                  Stop
                </button>
              </div>
            )}
            {blob && blobUrl && !recording && (
              <VoiceNote audioUrl={blobUrl} onDelete={discardAudio} />
            )}
          </div>
        </div>
      )}

      {needsReview && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={handleSubmitReview}
            disabled={!grade || uploading}
            className={btnPrimary}
          >
            {uploading ? 'Submitting…' : 'Submit review'}
          </button>
        </div>
      )}

      {/* Assigned — waiting for student */}
      {status === 'assigned' && (
        <div className="px-5 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{rec.passage}</p>
              {rec.notes && <p className="text-sm text-slate-600 mt-0.5">{rec.notes}</p>}
            </div>
            <button onClick={deleteRecitation} className={btnGhost}>Delete</button>
          </div>
        </div>
      )}

      {/* Reviewed */}
      {status === 'reviewed' && (
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-slate-900">{rec.passage}</p>
            {rec.grade && (
              <span className="text-sm font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {GRADE_LABEL[rec.grade] || rec.grade}
              </span>
            )}
          </div>
          {rec.feedback && (
            <p className="text-sm text-slate-700 italic">"{rec.feedback}"</p>
          )}
          {studentUrl && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Student</p>
              <VoiceNote audioUrl={studentUrl} compact />
            </div>
          )}
          {teacherUrl && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Your feedback</p>
              <VoiceNote audioUrl={teacherUrl} compact />
            </div>
          )}
        </div>
      )}

      {/* Assign passage form */}
      {showAssign && (
        <div className="px-5 py-4 space-y-3 border-t border-slate-100 bg-slate-50">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">Passage</label>
            <input
              type="text"
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              placeholder="e.g. Surah Al-Baqarah 1–5, Hadeeth 3, Page 10"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to focus on"
              className={inputClass}
            />
          </div>
          {rec && (
            <p className="text-xs text-slate-500">Previous reading will be replaced.</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => { setShowAssign(false); setPassage(''); setNotes(''); }}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!passage.trim() || assigning}
              className={btnPrimary}
            >
              {assigning ? 'Assigning…' : 'Assign passage'}
            </button>
          </div>
        </div>
      )}

      {/* Empty */}
      {!rec && !showAssign && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-slate-600">No recitation activity yet.</p>
          <p className="text-xs text-slate-500 mt-1">Assign a passage to get started.</p>
        </div>
      )}
    </div>
  );
}
