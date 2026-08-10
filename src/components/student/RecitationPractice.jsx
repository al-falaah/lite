import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';
import { Mic, Send, Square, RotateCcw, Clock, Check } from 'lucide-react';
import * as M from '../../design/mashq';
import { SpecLabel } from './mashq/Sheet';
import { normalizeUthmani } from '../../utils/uthmani';
import VoiceNote from '../common/VoiceNote';

// Number of bars in the live input-level meter (the drilled-strokes motif).
const METER_BARS = 28;

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
 * Design (Mashq world): a paper "recitation sheet", one station per state —
 * ready → reading & recording (the passage in Amirī Qurʾān, front and centre,
 * with a live input-level meter + mono timer docked below) → review-before-send
 * → awaiting teacher → reviewed (grade, written feedback, voice notes). Status
 * is a mono specimen readout; the one teal accent sits on each station's
 * primary action. The record indicator is a calm inked pulse, never flashing red.
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

  const [level, setLevel] = useState(0); // 0..1 live input level for the meter

  const mrRef = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);
  const broadcastRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  // Broadcast the recording flag. Uses httpSend (REST) when available — send()
  // silently falls back to REST with a deprecation warning when the socket
  // isn't joined (e.g. during unmount cleanup); httpSend is the explicit form.
  const sendRecordingFlag = (active) => {
    const ch = broadcastRef.current;
    if (!ch) return;
    const payload = { role: 'student', active };
    try {
      // httpSend(event, payload) — positional signature, unlike send()'s
      // message object. Falls back to send() on older realtime-js versions.
      if (typeof ch.httpSend === 'function') {
        Promise.resolve(ch.httpSend('recording', payload)).catch(() => {});
      } else {
        ch.send({ type: 'broadcast', event: 'recording', payload });
      }
    } catch { /* non-fatal signal */ }
  };

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

      // Live input-level meter via Web Audio (drives the drilled-strokes bars).
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
          const rms = Math.sqrt(sum / buf.length);
          setLevel(Math.min(1, rms * 3.2)); // scale so normal speech reads well
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch { /* meter is decorative; recording still works without it */ }

      mr.start(1000);
      setRecording(true);
      setElapsed(0);
      setBlob(null);
      setBlobUrl(null);
      sendRecordingFlag(true);
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
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    analyserRef.current = null;
    setLevel(0);
    setRecording(false);
    sendRecordingFlag(false);
  };

  const discard = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlob(null);
    setBlobUrl(null);
    setElapsed(0);
    chunks.current = [];
    sendRecordingFlag(false);
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

  // Is the passage Arabic? (render it in Amirī Qurʾān, RTL, when so)
  const isArabic = (t) => /[؀-ۿ]/.test(t || '');
  const PassageText = ({ text, size = 'text-2xl sm:text-[1.9rem]' }) => (
    isArabic(text) ? (
      <p dir="rtl" className={`${size} leading-[1.9] text-[var(--mq-ink)]`} style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}>
        {normalizeUthmani(text)}
      </p>
    ) : (
      <p className="text-base font-semibold text-[var(--mq-ink)]">{text}</p>
    )
  );

  if (loading) {
    return (
      <section className={`${M.SHEET} ${M.SHEET_PAD} space-y-3`}>
        <div className="h-3 w-28 bg-[var(--mq-rule-soft)] rounded animate-pulse" />
        <div className="h-16 bg-[var(--mq-paper-tint)] rounded animate-pulse" />
      </section>
    );
  }

  const status = rec?.status;

  // Header status readout (mono specimen label + measured state)
  let statusText = 'Ready when you are';
  let statusTone = 'text-[var(--mq-ink-faint)]';
  if (showStart) { statusText = 'New practice'; }
  else if (status === 'assigned') { statusText = recording ? 'Recording' : (blob ? 'Review your reading' : 'Ready to record'); statusTone = 'text-[var(--mq-accent)]'; }
  else if (status === 'submitted') { statusText = 'With your teacher'; statusTone = 'text-[var(--mq-warn)]'; }
  else if (status === 'reviewed') { statusText = 'Reviewed'; statusTone = 'text-[var(--mq-accent)]'; }

  return (
    <section className={`${M.SHEET} overflow-hidden`}>

      {/* Header — mono status readout on the sheet's ruled top */}
      <div className="px-5 sm:px-6 py-3.5 border-b border-[var(--mq-rule-soft)] flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5 min-w-0">
                    <span className="font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.16em] text-[var(--mq-ink-faint)]">Reading practice</span>
          <span className="text-[var(--mq-rule-strong)]">·</span>
          <span className={`font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.12em] ${statusTone}`}>{statusText}</span>
        </div>
        {status === 'reviewed' && !showStart && (
          <button onClick={() => setShowStart(true)} className={M.BTN_SECONDARY + ' !py-1.5 !px-3'}>
            New practice
          </button>
        )}
      </div>

      {/* Screen-reader live announcement of the recording/state moment */}
      <p className="sr-only" aria-live="polite">
        {recording ? `Recording, ${fmt(elapsed)}` : blob ? 'Recording ready to review' : statusText}
      </p>

      {/* === Ready / Start station === */}
      {(!rec || showStart) && !recording && !blob && (
        <div className="px-5 sm:px-6 py-8">
          {!showStart ? (
            <div className="text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-[6px] bg-[var(--mq-paper-sunk)] border border-[var(--mq-rule)] flex items-center justify-center">
                <Mic className="h-6 w-6 text-[var(--mq-ink-ghost)]" strokeWidth={1.75} />
              </div>
              <h3 className="font-sans font-semibold text-[var(--mq-ink)]">No active practice</h3>
              <p className="mt-1.5 text-sm text-[var(--mq-ink-soft)] max-w-sm mx-auto">
                Choose a passage to read aloud; record it, and it goes to your teacher for review.
              </p>
              <button onClick={() => setShowStart(true)} className={`${M.BTN_PRIMARY} mt-5`}>
                <Mic className="h-4 w-4" /> Start a reading
              </button>
            </div>
          ) : (
            <div className="max-w-lg mx-auto space-y-3">
              <label className="block">
                <SpecLabel>What are you reading?</SpecLabel>
                <input
                  type="text"
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  placeholder="e.g. Surah Al-Fātiḥah, or paste the āyah"
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  className="mt-1.5 w-full text-sm text-[var(--mq-ink)] placeholder-[var(--mq-ink-ghost)] border border-[var(--mq-rule-strong)] rounded-[3px] px-3 py-2.5 bg-[var(--mq-paper-raised)] focus:border-[var(--mq-accent)] focus:outline-none mashq-focus"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowStart(false); setPassage(''); }} className={M.BTN_SECONDARY}>Cancel</button>
                <button onClick={handleStart} disabled={!passage.trim()} className={M.BTN_PRIMARY}>Set passage</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === Reading & recording station === */}
      {status === 'assigned' && !showStart && (
        <div className="px-5 sm:px-6 py-6">
          {/* The passage — the hero the student reads from */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-3 mb-2">
              <SpecLabel>Recite</SpecLabel>
              {!recording && !blob && (
                <button onClick={deleteAll} className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.1em] text-[var(--mq-ink-ghost)] hover:text-[var(--mq-bad)] transition-colors mashq-focus">
                  Discard
                </button>
              )}
            </div>
            <div className="rounded-[4px] bg-[var(--mq-paper-sunk)] border border-[var(--mq-rule)] px-5 py-6 text-center">
              <PassageText text={rec.passage} />
              {rec.notes && <p className="mt-3 text-sm text-[var(--mq-ink-soft)]">{rec.notes}</p>}
            </div>
          </div>

          {/* The instrument — level meter + timer, docked below the passage */}
          {!blob && (
            <div className="rounded-[4px] border border-[var(--mq-rule)] bg-[var(--mq-paper-raised)] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`inline-flex h-2 w-2 rounded-full ${recording ? 'bg-[var(--mq-accent)] mashq-rec-pulse' : 'bg-[var(--mq-rule-strong)]'}`} />
                  <span className="font-['JetBrains_Mono',monospace] tabular-nums text-sm text-[var(--mq-ink)]">{fmt(elapsed)}</span>
                  <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--mq-ink-ghost)]">/ {fmt(MAX_SECONDS)}</span>
                </div>
                {/* live input-level meter — the drilled-strokes motif */}
                <div className="mashq-strokes h-5 flex-1 justify-center max-w-[220px]" aria-hidden="true">
                  {Array.from({ length: METER_BARS }).map((_, i) => {
                    const threshold = (i + 1) / METER_BARS;
                    const on = recording && level >= threshold * 0.85;
                    const h = 6 + ((i * 31) % 14);
                    return <span key={i} className={`mashq-stroke ${on ? 'is-done' : ''}`} style={{ height: h, width: 3 }} />;
                  })}
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                {!recording ? (
                  <button onClick={startRec} className={M.BTN_PRIMARY}>
                    <Mic className="h-4 w-4" /> Start recording
                  </button>
                ) : (
                  <button onClick={stopRec} className={M.BTN_SECONDARY}>
                    <Square className="h-3.5 w-3.5 fill-current" /> Stop
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recorded — review before sending */}
          {blob && blobUrl && !recording && (
            <div className="rounded-[4px] border border-[var(--mq-rule)] bg-[var(--mq-paper-raised)] px-5 py-4 space-y-4">
              <SpecLabel>Your reading</SpecLabel>
              <VoiceNote audioUrl={blobUrl} onDelete={discard} color="mashq" />
              <div className="flex justify-end gap-2">
                <button onClick={discard} className={M.BTN_SECONDARY}>
                  <RotateCcw className="h-3.5 w-3.5" /> Re-record
                </button>
                <button onClick={submit} disabled={uploading} className={M.BTN_PRIMARY}>
                  {uploading ? 'Sending…' : (<><Send className="h-4 w-4" /> Submit to teacher</>)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === Awaiting teacher station === */}
      {status === 'submitted' && !showStart && (
        <div className="px-5 sm:px-6 py-6 space-y-5">
          <div className="rounded-[4px] bg-[var(--mq-paper-sunk)] border border-[var(--mq-rule)] px-5 py-5 text-center">
            <PassageText text={rec.passage} size="text-xl sm:text-2xl" />
          </div>
          <div className="flex items-center gap-2.5 text-[var(--mq-warn)]">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">With your teacher for review</span>
            <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--mq-ink-ghost)] ml-auto">
              {rec.submitted_at ? new Date(rec.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
          {studentUrl && (
            <div>
              <SpecLabel>Your recording</SpecLabel>
              <div className="mt-2"><VoiceNote audioUrl={studentUrl} onDelete={deleteMyAudio} color="mashq" /></div>
            </div>
          )}
          {teacherRecording && (
            <p className="text-xs text-[var(--mq-accent)] inline-flex items-center gap-1.5" aria-live="polite">
              <span className="h-1.5 w-1.5 bg-[var(--mq-accent)] rounded-full mashq-rec-pulse" />
              Your teacher is recording feedback…
            </p>
          )}
        </div>
      )}

      {/* === Reviewed station — the payoff === */}
      {status === 'reviewed' && !showStart && (
        <div className="px-5 sm:px-6 py-6 space-y-5">
          <div className="rounded-[4px] bg-[var(--mq-paper-sunk)] border border-[var(--mq-rule)] px-5 py-5 text-center">
            <PassageText text={rec.passage} size="text-xl sm:text-2xl" />
          </div>

          {rec.grade && (
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 rounded-full bg-[var(--mq-accent)]/10 items-center justify-center">
                <Check className="h-4 w-4 text-[var(--mq-accent)]" />
              </span>
              <div>
                <SpecLabel>Grade</SpecLabel>
                <p className="font-sans font-semibold text-[var(--mq-accent)] leading-tight">{GRADE_LABELS[rec.grade] || rec.grade}</p>
              </div>
            </div>
          )}

          {rec.feedback && (
            <blockquote className="border-l-2 border-[var(--mq-accent)] pl-4 text-[var(--mq-ink-soft)]">
              {rec.feedback}
            </blockquote>
          )}

          {teacherUrl && (
            <div>
              <SpecLabel>Teacher's voice note</SpecLabel>
              <div className="mt-2"><VoiceNote audioUrl={teacherUrl} compact color="mashq" /></div>
            </div>
          )}
          {studentUrl && (
            <div>
              <SpecLabel>Your recording</SpecLabel>
              <div className="mt-2"><VoiceNote audioUrl={studentUrl} compact color="mashq" /></div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
