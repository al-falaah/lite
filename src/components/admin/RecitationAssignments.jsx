import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';
import { Mic, Square, Send, BookOpen, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import VoiceNote from '../common/VoiceNote';

const GRADE_OPTIONS = [
  { value: 'excellent', label: 'Excellent', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'good', label: 'Good', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'fair', label: 'Fair', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'needs_improvement', label: 'Needs Improvement', color: 'bg-red-100 text-red-700 border-red-300' },
];

const MAX_SECONDS = 900;

export default function RecitationAssignments({ student, program, teacherId }) {
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
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

  const mrRef = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);

  useEffect(() => {
    if (student?.id && program) load();
    return () => stopRec();
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

  // --- Assign passage ---
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

  // --- Audio Recording (teacher feedback) ---
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true }
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
    } catch (err) {
      console.error('Microphone error:', err);
      toast.error('Could not access microphone');
    }
  };

  const stopRec = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    if (mrRef.current?.state === 'recording') mrRef.current.stop();
    setRecording(false);
  };

  const discardAudio = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlob(null);
    setBlobUrl(null);
    setElapsed(0);
    chunks.current = [];
  };

  // --- Submit review ---
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

  // --- Delete recitation ---
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
      <div className="animate-pulse space-y-2.5 p-4">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-14 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  const status = rec?.status;
  const needsReview = status === 'submitted';
  const canAssign = !rec || (status === 'reviewed' && rec.feedback_seen_at);
  const awaitingStudentView = status === 'reviewed' && !rec.feedback_seen_at;

  return (
    <div className="mt-4 border border-emerald-200 rounded-lg bg-emerald-50/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-bold text-gray-900">Reading Practice</span>
          {needsReview ? (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
              1 to review
            </span>
          ) : status === 'assigned' ? (
            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
              Assigned
            </span>
          ) : null}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2.5">

          {needsReview && (
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
              <div className="flex items-start justify-between mb-1.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{rec.passage}</p>
                  {rec.notes && <p className="text-xs text-gray-500">{rec.notes}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Sent {new Date(rec.submitted_at || rec.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {studentUrl && (
                <div className="mb-2.5">
                  <p className="text-[10px] text-gray-400 mb-1">Student recording</p>
                  <VoiceNote audioUrl={studentUrl} color="emerald" />
                </div>
              )}

              {/* Review form */}
              <div className="space-y-2.5 border-t border-gray-200 pt-2.5">
                <div>
                  <p className="text-xs text-gray-600 mb-1.5">Grade</p>
                  <div className="flex flex-wrap gap-1.5">
                    {GRADE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setGrade(opt.value)}
                        className={'text-xs px-2.5 py-1 rounded-full border transition-colors ' +
                          (grade === opt.value
                            ? opt.color
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Written feedback (optional)"
                  rows={2}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                />

                <div>
                  <p className="text-xs text-gray-600 mb-1.5">Audio feedback (optional)</p>
                  {!recording && !blob && (
                    <button onClick={startRec} className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                      <Mic className="h-3 w-3" /> Record
                    </button>
                  )}
                  {recording && (
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-mono text-gray-700 tabular-nums">{fmt(elapsed)}</span>
                      </div>
                      <button onClick={stopRec} className="flex items-center gap-1 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg">
                        <Square className="h-2.5 w-2.5" /> Stop
                      </button>
                    </div>
                  )}
                  {blob && blobUrl && !recording && (
                    <VoiceNote audioUrl={blobUrl} color="blue" onDelete={discardAudio} />
                  )}
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={!grade || uploading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white text-xs sm:text-sm font-medium py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-3 w-3" />
                  {uploading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}

          {status === 'assigned' && (
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{rec.passage}</p>
                  {rec.notes && <p className="text-xs text-gray-500 mt-0.5">{rec.notes}</p>}
                </div>
                <button onClick={deleteRecitation} className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500 ml-2">Delete</button>
              </div>
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Waiting for student
              </p>
            </div>
          )}

          {status === 'reviewed' && (
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
              <div className="flex items-start justify-between mb-1.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{rec.passage}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-emerald-700 mt-0.5">
                    <CheckCircle className="h-3 w-3" /> Reviewed
                  </span>
                </div>
              </div>
              {rec.grade && (
                <span className={'inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border mb-2 ' +
                  (GRADE_OPTIONS.find(g => g.value === rec.grade)?.color || '')}>
                  {GRADE_OPTIONS.find(g => g.value === rec.grade)?.label || rec.grade}
                </span>
              )}
              {rec.feedback && <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mb-2">{rec.feedback}</p>}
              {studentUrl && (
                <div className="mb-1.5">
                  <p className="text-[10px] text-gray-400 mb-1">Student</p>
                  <VoiceNote audioUrl={studentUrl} color="emerald" compact />
                </div>
              )}
              {teacherUrl && (
                <div className="mb-1.5">
                  <p className="text-[10px] text-gray-400 mb-1">Your feedback</p>
                  <VoiceNote audioUrl={teacherUrl} color="blue" compact />
                </div>
              )}
              {awaitingStudentView && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3" /> Student hasn’t seen this yet
                </p>
              )}
            </div>
          )}

          {canAssign && (
            <div>
              {!showAssign ? (
                <div>
                  <button
                    onClick={() => setShowAssign(true)}
                    className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"
                  >
                    <BookOpen className="h-3 w-3" /> Assign Reading
                  </button>
                  {rec && <p className="text-[10px] text-gray-400 mt-1">Previous reading will be replaced</p>}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <input
                    type="text"
                    value={passage}
                    onChange={(e) => setPassage(e.target.value)}
                    placeholder="e.g. Surah Al-Baqarah 1-5, Hadeeth 3, Page 10"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAssign}
                      disabled={!passage.trim() || assigning}
                      className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {assigning ? 'Assigning...' : 'Assign'}
                    </button>
                    <button onClick={() => { setShowAssign(false); setPassage(''); setNotes(''); }} className="text-xs text-gray-500 hover:text-gray-700">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!rec && !showAssign && (
            <p className="text-xs text-gray-400 text-center py-4">No reading practice activity</p>
          )}
        </div>
      )}
    </div>
  );
}
