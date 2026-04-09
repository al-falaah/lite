import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';
import { Mic, Square, Send, Clock, CheckCircle, BookOpen } from 'lucide-react';
import VoiceNote from '../common/VoiceNote';

const GRADE_STYLES = {
  excellent: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  good: 'bg-blue-100 text-blue-700 border-blue-300',
  fair: 'bg-amber-100 text-amber-700 border-amber-300',
  needs_improvement: 'bg-red-100 text-red-700 border-red-300',
};
const GRADE_LABELS = {
  excellent: 'Excellent', good: 'Good', fair: 'Fair', needs_improvement: 'Needs Improvement',
};

const MAX_SECONDS = 900;

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
  const [feedbackSeen, setFeedbackSeen] = useState(false);

  const mrRef = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);

  useEffect(() => {
    if (studentId && programId) load();
    return () => stopRec();
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
      // Auto-mark feedback as seen when student loads a reviewed recitation
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
      toast.success('Ready \u2014 record your reading');
      load();
    } catch (e) {
      console.error(e);
      toast.error('Failed to create');
    }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mr = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 24000 });
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
  };

  const discard = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlob(null);
    setBlobUrl(null);
    setElapsed(0);
    chunks.current = [];
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
      toast.success('Voice note sent!');
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
      <div className="border-t border-gray-200 pt-5 mt-5">
        <div className="animate-pulse space-y-2.5">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-14 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  const status = rec?.status;

  return (
    <div className="border-t border-gray-200 pt-5 mt-5">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-emerald-600" />
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Reading Practice</h3>
      </div>

      {(!rec || showStart) && !recording && !blob && (
        <div>
          {!showStart ? (
            <div className="text-center py-8">
              <Mic className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 mb-4">No active reading practice</p>
              <button
                onClick={() => setShowStart(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Mic className="h-3.5 w-3.5" />
                Start Practice
              </button>
            </div>
          ) : (
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">What are you reading?</label>
              <input
                type="text"
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
                placeholder="e.g. Surah Al-Fatiha, Hadeeth 1, Page 12"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={handleStart}
                  disabled={!passage.trim()}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  Start
                </button>
                <button onClick={() => { setShowStart(false); setPassage(''); }} className="text-xs text-gray-500 px-2 py-1.5 hover:text-gray-700">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'assigned' && !showStart && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{rec.passage}</p>
              {rec.notes && <p className="text-xs text-gray-500 mt-0.5">{rec.notes}</p>}
            </div>
            <button onClick={deleteAll} className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500 ml-2">Cancel</button>
          </div>

          {!recording && !blob && (
            <button
              onClick={startRec}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white text-xs sm:text-sm font-medium py-2.5 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Mic className="h-3.5 w-3.5" />
              Record
            </button>
          )}

          {recording && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono text-gray-700 tabular-nums">{fmt(elapsed)}</span>
              </div>
              <button onClick={stopRec} className="flex items-center gap-1 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-800">
                <Square className="h-2.5 w-2.5" /> Stop
              </button>
            </div>
          )}

          {blob && blobUrl && !recording && (
            <div className="space-y-2.5">
              <VoiceNote audioUrl={blobUrl} color="emerald" onDelete={discard} />
              <button
                onClick={submit}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white text-xs sm:text-sm font-medium py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-3 w-3" />
                {uploading ? 'Sending...' : 'Submit'}
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'submitted' && !showStart && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm font-medium text-gray-900 min-w-0 truncate">{rec.passage}</p>
            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              <Clock className="h-3 w-3" /> Pending
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 mb-2.5">
            Sent {rec.submitted_at ? new Date(rec.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
          {studentUrl && <VoiceNote audioUrl={studentUrl} color="emerald" onDelete={deleteMyAudio} />}
        </div>
      )}

      {status === 'reviewed' && !showStart && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2.5">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-gray-900 min-w-0 truncate">{rec.passage}</p>
            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle className="h-3 w-3" /> Reviewed
            </span>
          </div>

          {rec.grade && (
            <span className={'inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ' + (GRADE_STYLES[rec.grade] || '')}>
              {GRADE_LABELS[rec.grade] || rec.grade}
            </span>
          )}

          {rec.feedback && <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg p-2.5">{rec.feedback}</p>}

          {studentUrl && (
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Your recording</p>
              <VoiceNote audioUrl={studentUrl} color="emerald" compact />
            </div>
          )}

          {teacherUrl && (
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Teacher feedback</p>
              <VoiceNote audioUrl={teacherUrl} color="blue" compact />
            </div>
          )}

          <div>
            <button
              onClick={() => setShowStart(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white text-xs sm:text-sm font-medium py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Mic className="h-3.5 w-3.5" /> New Practice
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-1">This will replace the current reading</p>
          </div>
        </div>
      )}
    </div>
  );
}