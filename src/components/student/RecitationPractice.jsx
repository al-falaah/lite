import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';
import { Mic, Send } from 'lucide-react';
import VoiceNote from '../common/VoiceNote';

const GRADE_LABELS = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  needs_improvement: 'Needs improvement',
};

const MAX_SECONDS = 900;

/**
 * Reading practice — student side.
 *
 * One active recitation per (student, program). The student picks a passage,
 * records a reading, and submits. Teacher reviews on their end. Once reviewed,
 * the student sees their grade + written feedback + optional voice note.
 *
 * Design: card-based with a header strip showing the current state
 * (no active practice / awaiting / pending review / reviewed). Status
 * shown as plain text in the header subtitle, not as decorative pills.
 * Single emerald accent on primary actions (Start / Record / Submit).
 */
export default function RecitationPractice({ studentId, programId, teacherId }) {
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passage, setPassage] = useState('');
  const [showStart, setShowStart] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [studentUrl, setStudentUrl] = useState(null);
  const [teacherUrl, setTeacherUrl] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [_feedbackSeen, setFeedbackSeen] = useState(false);
  const [teacherRecording, setTeacherRecording] = useState(false);

  const mrRef = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);
  const broadcastRef = useRef(null);

  useEffect(() => {
    if (studentId && programId) load();
    return () => stopRec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, programId]);

  useEffect(() => {
    if (!studentId || !programId) return;
    const channel = supabase
      .channel(`rec-student-${studentId}-${programId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'recitations',
        filter: `student_id=eq.${studentId}`,
      }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, programId]);

  useEffect(() => {
    if (!studentId || !programId) return;
    const ch = supabase.channel(`rec-live-${studentId}-${programId}`);
    ch.on('broadcast', { event: 'recording' }, ({ payload }) => {
      if (payload?.role === 'teacher') setTeacherRecording(payload.active);
    }).subscribe();
    broadcastRef.current = ch;
    return () => { supabase.removeChannel(ch); broadcastRef.current = null; };
  }, [studentId, programId]);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('recitations')
        .select('*')
        .eq('student_id', studentId)
        .eq('program_id', programId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setRec(data);
      setStudentUrl(null);
      setTeacherUrl(null);
      setFeedbackSeen(!!data?.feedback_seen_at);
      if (data?.status === 'reviewed' && !data?.feedback_seen_at) {
        supabase.from('recitations').update({ feedback_seen_at: new Date().toISOString() }).eq('id', data.id).then(() => {
          setFeedbackSeen(true);
        });
      }
      if (data?.student_audio_url) {
        const { data: s } = await supabase.storage.from('recitations').createSignedUrl(data.student_audio_url, 600);
        if (s?.signedUrl) setStudentUrl(s.signedUrl);
      }
      if (data?.teacher_audio_url) {
        const { data: s } = await supabase.storage.from('recitations').createSignedUrl(data.teacher_audio_url, 600);
        if (s?.signedUrl) setTeacherUrl(s.signedUrl);
      }
    } catch (e) {
      console.error('load recitation:', e);
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

  const handleStart = async () => {
    if (!passage.trim()) return;
    try {
      if (rec) await cleanupOld();
      const row = { student_id: studentId, program_id: programId, passage: passage.trim(), status: 'assigned' };
      if (teacherId) row.teacher_id = teacherId;
      const { error } = await supabase.from('recitations').insert(row);
      if (error) throw error;
      setPassage('');
      setShowStart(false);
      toast.success('Ready — record your reading');
      load();
    } catch (e) {
      console.error(e);
      toast.error('Failed to create');
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
      broadcastRef.current?.send({ type: 'broadcast', event: 'recording', payload: { role: 'student', active: true } });
      timer.current = setInterval(() => {
        setElapsed(p => { if (p >= MAX_SECONDS - 1) { stopRec(); return MAX_SECONDS; } return p + 1; });
      }, 1000);
    } catch (e) {
      console.error(e);
      toast.error('Microphone access denied');
    }
  };

  const stopRec = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    if (mrRef.current?.state === 'recording') mrRef.current.stop();
    setRecording(false);
    broadcastRef.current?.send({ type: 'broadcast', event: 'recording', payload: { role: 'student', active: false } });
  };

  const discard = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlob(null);
    setBlobUrl(null);
    setElapsed(0);
    chunks.current = [];
    broadcastRef.current?.send({ type: 'broadcast', event: 'recording', payload: { role: 'student', active: false } });
  };

  const submit = async () => {
    if (!blob || !rec) return;
    setUploading(true);
    try {
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const path = studentId + '/' + rec.id + '/student.' + ext;
      const { error: ue } = await supabase.storage.from('recitations').upload(path, blob, { contentType: blob.type, upsert: true });
      if (ue) throw ue;
      const { error: de } = await supabase.from('recitations').update({
        student_audio_url: path, status: 'submitted', submitted_at: new Date().toISOString(),
      }).eq('id', rec.id);
      if (de) throw de;
      discard();
      toast.success('Voice note sent');
      load();
    } catch (e) {
      console.error(e);
      toast.error('Failed to send');
    } finally {
      setUploading(false);
    }
  };

  const deleteMyAudio = async () => {
    if (!rec?.student_audio_url) return;
    try {
      await supabase.storage.from('recitations').remove([rec.student_audio_url]);
      await supabase.from('recitations').update({
        student_audio_url: null, status: 'assigned', submitted_at: null,
      }).eq('id', rec.id);
      toast.success('Voice note deleted');
      load();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete');
    }
  };

  const deleteAll = async () => {
    if (!rec) return;
    try {
      await cleanupOld();
      setRec(null);
      setStudentUrl(null);
      setTeacherUrl(null);
      toast.success('Removed');
    } catch (e) { console.error(e); }
  };

  const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm p-5 space-y-3">
        <div className="h-4 w-32 bg-slate-100 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-12 bg-slate-100 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  const status = rec?.status;

  // Status text shown in the card header strip
  let statusText = null;
  let statusClass = 'text-slate-500 dark:text-gray-400';
  if (!rec) {
    statusText = 'Ready when you are';
  } else if (showStart) {
    statusText = 'New practice';
  } else if (status === 'assigned') {
    statusText = 'Ready to record';
    statusClass = 'text-emerald-700 dark:text-emerald-400';
  } else if (status === 'submitted') {
    statusText = 'Awaiting teacher review';
    statusClass = 'text-amber-700 dark:text-amber-400';
  } else if (status === 'reviewed') {
    statusText = 'Reviewed';
    statusClass = 'text-emerald-700 dark:text-emerald-400';
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">

      {/* Card header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-700 flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Reading practice</h3>
          {statusText && <p className={`text-xs mt-0.5 ${statusClass}`}>{statusText}</p>}
        </div>
        {status === 'reviewed' && !showStart && (
          <button
            onClick={() => setShowStart(true)}
            className="inline-flex items-center justify-center px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 hover:border-slate-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            New practice
          </button>
        )}
      </div>

      {/* Empty / Start state */}
      {(!rec || showStart) && !recording && !blob && (
        <div className="px-5 py-5">
          {!showStart ? (
            <div className="text-center py-6">
              <Mic className="h-8 w-8 text-slate-300 dark:text-gray-600 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">No active practice yet</p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
                Pick something to read aloud and we'll send it to your teacher when you're ready.
              </p>
              <button
                onClick={() => setShowStart(true)}
                className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
              >
                <Mic className="h-4 w-4 mr-1.5" /> Start practice
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1.5">What are you reading?</label>
                <input
                  type="text"
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  placeholder="e.g. Surah Al-Fātiḥah, Hadeeth 1, Page 12"
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  className="w-full text-sm text-slate-900 placeholder-slate-400 border border-slate-300 rounded-md px-3 py-2 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowStart(false); setPassage(''); }}
                  className="inline-flex items-center justify-center px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 hover:border-slate-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStart}
                  disabled={!passage.trim()}
                  className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  Start
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assigned — record state */}
      {status === 'assigned' && !showStart && (
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{rec.passage}</p>
              {rec.notes && <p className="text-sm text-slate-600 dark:text-gray-300 mt-0.5">{rec.notes}</p>}
            </div>
            <button onClick={deleteAll} className="text-xs text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0">
              Cancel
            </button>
          </div>

          {!recording && !blob && (
            <button
              onClick={startRec}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
            >
              <Mic className="h-4 w-4 mr-1.5" /> Start recording
            </button>
          )}

          {recording && (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 border border-slate-200 dark:border-gray-600 rounded-md bg-slate-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-200">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="font-mono tabular-nums">{fmt(elapsed)}</span>
                <span className="text-slate-500 dark:text-gray-400">recording…</span>
              </div>
              <button
                onClick={stopRec}
                className="inline-flex items-center justify-center px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
              >
                Stop
              </button>
            </div>
          )}

          {blob && blobUrl && !recording && (
            <div className="space-y-3">
              <VoiceNote audioUrl={blobUrl} onDelete={discard} />
              <div className="flex justify-end">
                <button
                  onClick={submit}
                  disabled={uploading}
                  className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Sending…' : (
                    <>
                      <Send className="h-4 w-4 mr-1.5" /> Submit to teacher
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submitted — awaiting review */}
      {status === 'submitted' && !showStart && (
        <div className="px-5 py-5 space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{rec.passage}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Sent {rec.submitted_at ? new Date(rec.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          </div>

          {studentUrl && (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">Your recording</p>
              <VoiceNote audioUrl={studentUrl} onDelete={deleteMyAudio} />
            </div>
          )}

          {teacherRecording && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
              Your teacher is recording feedback…
            </p>
          )}
        </div>
      )}

      {/* Reviewed */}
      {status === 'reviewed' && !showStart && (
        <div className="px-5 py-5 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{rec.passage}</p>
            {rec.grade && (
              <span className="text-sm font-medium px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {GRADE_LABELS[rec.grade] || rec.grade}
              </span>
            )}
          </div>

          {rec.feedback && (
            <p className="text-sm text-slate-700 dark:text-gray-300 italic">"{rec.feedback}"</p>
          )}

          {studentUrl && (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">Your recording</p>
              <VoiceNote audioUrl={studentUrl} compact />
            </div>
          )}

          {teacherUrl && (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">Teacher feedback</p>
              <VoiceNote audioUrl={teacherUrl} compact />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
