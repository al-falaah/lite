import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Trash2 } from 'lucide-react';

export default function VoiceNote({ audioUrl, color = 'emerald', onDelete, compact = false }) {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [dragging, setDragging] = useState(false);
  const audioRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio();
    audio.preload = 'metadata';

    const onMeta = () => {
      if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onTime = () => { if (!dragging) setCurrentTime(audio.currentTime); };
    const onEnd = () => { setPlaying(false); setCurrentTime(0); };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.src = audioUrl;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  // Seek by click or drag
  const seekTo = useCallback((clientX) => {
    if (!barRef.current || !audioRef.current || !duration) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  }, [duration]);

  const handlePointerDown = (e) => {
    setDragging(true);
    seekTo(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => { if (dragging) seekTo(e.clientX); };
  const handlePointerUp = () => setDragging(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const palette = color === 'blue'
    ? { bg: 'bg-blue-50', fill: 'bg-blue-500', btn: 'bg-blue-500', track: 'bg-blue-200', dot: 'bg-blue-600' }
    : { bg: 'bg-emerald-50', fill: 'bg-emerald-500', btn: 'bg-emerald-500', track: 'bg-emerald-200', dot: 'bg-emerald-600' };

  const sz = compact ? 'px-2.5 py-1.5 gap-2' : 'px-3 py-2 gap-2.5';
  const btnSz = compact ? 'w-6 h-6' : 'w-7 h-7';
  const iconSz = compact ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <div className={`flex items-center ${sz} rounded-lg ${palette.bg}`}>
      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        className={`flex-shrink-0 ${btnSz} rounded-full ${palette.btn} text-white flex items-center justify-center shadow-sm`}
      >
        {playing
          ? <Pause className={iconSz} />
          : <Play className={`${iconSz} ml-0.5`} />}
      </button>

      {/* Seekable progress bar */}
      <div className="flex-1 min-w-0">
        <div
          ref={barRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`relative ${compact ? 'h-1' : 'h-1.5'} ${palette.track} rounded-full cursor-pointer touch-none select-none`}
        >
          <div
            className={`absolute top-0 left-0 h-full ${palette.fill} rounded-full`}
            style={{ width: `${progress}%` }}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${palette.dot} rounded-full shadow`}
            style={{ left: `max(0px, min(calc(100% - ${compact ? 10 : 12}px), calc(${progress}% - ${compact ? 5 : 6}px)))` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-gray-500 tabular-nums">{fmt(currentTime)}</span>
          <span className="text-[10px] text-gray-500 tabular-nums">{fmt(duration)}</span>
        </div>
      </div>

      {/* Delete */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className={iconSz} />
        </button>
      )}
    </div>
  );
}
