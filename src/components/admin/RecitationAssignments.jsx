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

/**
 * Recitation Practice — teacher side.
 *
 * One active recitation per (student, program). Teacher assigns a passage,
 * student records audio, teacher reviews with grade + optional feedback +
 * optional voice note.
 *
 * Visual approach: single neutral surface, status as plain text, grade
 * picker as small ghost-bordered chips that turn dark when selected
 * (no traffic-light colours). One emerald accent on the primary action.
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

  // Realtime: auto-refresh when student submits or recitation changes
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

  // Broadcast channel for live recording indicator
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

  // ── Audio recording (teacher feedback) ──
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

  // ── Submit review ──
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
      <div className="space-y-3 py-2">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const status = rec?.status;
  const needsReview = status === 'submitted';
  const canAssign = !rec || (status === 'reviewed' && rec.feedback_seen_at);
  const awaitingStudentView = status === 'reviewed' && !rec.feedback_seen_at;

  // Status text shown next to the heading; null = no status to show.
  let statusText = null;
  let statusClass = 'text-gray-500';
  if (needsReview) {
    statusText = '1 to review';
    statusClass = 'text-emerald-700';
  } else if (status === 'assigned' && studentRecording) {
    statusText = 'Student is recording…';
    statusClass = 'text-emerald-700';
  } else if (status === 'assigned') {
    statusText = 'Awaiting student';
    statusClass = 'text-gray-500';
  } else if (awaitingStudentView) {
    statusText = 'Awaiting student to see feedback';
    statusClass = 'text-gray-500';
  } else if (status === 'reviewed') {
    statusText = 'Reviewed';
    statusClass = 'text-gray-500';
  }

  return (
    <div>
      {/* Top status line + Assign button */}
      <div className="flex items-baseline justify-between gap-3 mb-3">
        {statusText ? (
          <p className={`text-xs ${statusClass}`}>{statusText}</p>
        ) : <span />}
        {canAssign && !showAssign && (
          <button
            onClick={() => setShowAssign(true)}
            className="text-sm font-medium text-gray-900 hover:text-gray-600"
          >
            {rec ? 'Assign new passage' : '+ Assign passage'}
          </button>
        )}
      </div>

      {/* Submitted — review form */}
      {needsReview && (
        <div className="py-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">{rec.passage}</p>
            {rec.notes && <p className="text-sm text-gray-600 mt-0.5">{rec.notes}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Sent {new Date(rec.submitted_at || rec.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {studentUrl && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1.5">Student recording</p>
              <VoiceNote audioUrl={studentUrl} />
            </div>
          )}

          {/* Grade picker */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Grade</p>
            <div className="flex flex-wrap gap-2">
              {GRADE_OPTIONS.map(opt => {
                const selected = grade === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setGrade(opt.value)}
                    className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                      selected
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Written feedback */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1.5">Written feedback (optional)</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              className="w-full text-sm text-gray-900 border-0 border-b border-gray-200 bg-transparent px-0 py-1 resize-none focus:border-gray-900 focus:outline-none focus:ring-0"
            />
          </div>

          {/* Voice note */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1.5">Voice note (optional)</p>
            {!recording && !blob && (
              <button
                onClick={startRec}
                className="text-sm text-gray-700 hover:text-gray-900 underline-offset-4 hover:underline"
              >
                Record a voice note
              </button>
            )}
            {recording && (
              <div className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-mono tabular-nums">{fmt(elapsed)}</span>
                  <span className="text-gray-500">recording…</span>
                </div>
                <button onClick={stopRec} className="text-sm font-medium text-gray-900 hover:text-gray-600">
                  Stop
                </button>
              </div>
            )}
            {blob && blobUrl && !recording && (
              <VoiceNote audioUrl={blobUrl} onDelete={discardAudio} />
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmitReview}
              disabled={!grade || uploading}
              className="px-4 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </div>
      )}

      {/* Assigned — waiting for student */}
      {status === 'assigned' && (
        <div className="py-4 border-t border-gray-200">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{rec.passage}</p>
              {rec.notes && <p className="text-sm text-gray-600 mt-0.5">{rec.notes}</p>}
            </div>
            <button onClick={deleteRecitation} className="text-xs text-gray-500 hover:text-gray-900 flex-shrink-0">
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Reviewed — show what was sent */}
      {status === 'reviewed' && (
        <div className="py-4 border-t border-gray-200">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-gray-900">{rec.passage}</p>
            {rec.grade && (
              <span className="text-sm text-gray-700">{GRADE_LABEL[rec.grade] || rec.grade}</span>
            )}
          </div>
          {rec.feedback && (
            <p className="text-sm text-gray-700 mt-2 italic">"{rec.feedback}"</p>
          )}
          {studentUrl && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Student</p>
              <VoiceNote audioUrl={studentUrl} compact />
            </div>
          )}
          {teacherUrl && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Your feedback</p>
              <VoiceNote audioUrl={teacherUrl} compact />
            </div>
          )}
        </div>
      )}

      {/* Assign passage form */}
      {showAssign && (
        <div className="py-4 border-t border-gray-200 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Passage</p>
            <input
              type="text"
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              placeholder="e.g. Surah Al-Baqarah 1–5, Hadeeth 3, Page 10"
              className="w-full text-sm text-gray-900 border-0 border-b border-gray-200 bg-transparent px-0 py-1 focus:border-gray-900 focus:outline-none focus:ring-0"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Notes (optional)</p>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to focus on (e.g. madd, tajweed of letter ر)"
              className="w-full text-sm text-gray-900 border-0 border-b border-gray-200 bg-transparent px-0 py-1 focus:border-gray-900 focus:outline-none focus:ring-0"
            />
          </div>
          {rec && (
            <p className="text-xs text-gray-500">Previous reading will be replaced.</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowAssign(false); setPassage(''); setNotes(''); }}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!passage.trim() || assigning}
              className="px-4 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {assigning ? 'Assigning…' : 'Assign passage'}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!rec && !showAssign && (
        <p className="text-sm text-gray-500 py-2">
          No recitation activity yet. Assign a passage to get started.
        </p>
      )}
    </div>
  );
}
