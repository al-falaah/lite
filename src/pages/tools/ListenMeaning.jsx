import ToolSeo from '../../components/tools/ToolSeo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Loader2, Volume2, ChevronDown } from 'lucide-react';
import SurahSelect from '../../components/tools/SurahSelect';
import TranslationSelect from '../../components/tools/TranslationSelect';
import { AUDIO_TRANSLATIONS, RECITERS, getSura, listTranslations, credit, meaningAudioUrl, recitationUrl } from '../../services/quranenc';
import { getSuraArabic } from '../../services/quranText';
import { SURAH_NAMES, toArabicDigits } from '../../utils/quran';

/**
 * Listen to the Meaning — a memorisation companion. Plays each āyah's
 * recitation (EveryAyah.com), optionally repeated, then its meaning SPOKEN in
 * the listener's language (QuranEnc audio, 13 languages), and moves through
 * the sūrah, following along on screen. A missing audio file is skipped.
 */

const MODES = [
  { id: 'both', label: 'Recitation + meaning' },
  { id: 'recite', label: 'Recitation only' },
  { id: 'meaning', label: 'Meaning only' },
];
const PREF_KEY = 'listen-meaning-prefs';
const readPrefs = () => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; } };
const clean = (t) => String(t || '').replace(/\s*\[\d+\]/g, '').trim();

function Select({ value, onChange, children, label }) {
  return (
    <div className="relative">
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-9 py-2.5 text-base sm:text-sm text-gray-900 shadow-sm hover:border-gray-400 focus:border-wine-600 focus:ring-2 focus:ring-wine-600/25 outline-none">
        {children}
      </select>
      <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export default function ListenMeaning() {
  const prefs = readPrefs();
  const [sura, setSura] = useState(prefs.sura || 67);
  const [tKey, setTKey] = useState(prefs.tKey || 'english_rwwad');
  const [reciter, setReciter] = useState(prefs.reciter || RECITERS[0].id);
  const [mode, setMode] = useState(prefs.mode || 'both');
  const [repeat, setRepeat] = useState(prefs.repeat || 1);
  const [translation, setTranslation] = useState(null);

  const [data, setData] = useState({ status: 'loading', rows: [] });
  const [pos, setPos] = useState({ aya: 1, step: 'recite', rep: 1 });
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState('');
  const audio = useRef(null);
  const rowRefs = useRef({});

  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ sura, tKey, reciter, mode, repeat })); } catch { /* ignore */ }
  }, [sura, tKey, reciter, mode, repeat]);
  useEffect(() => { listTranslations().then((all) => setTranslation(all.find((t) => t.key === tKey) || null)).catch(() => {}); }, [tKey]);

  // Load Arabic (verified) + meaning text for the sūrah.
  useEffect(() => {
    let alive = true;
    setData({ status: 'loading', rows: [] });
    stop();
    Promise.all([getSuraArabic(sura), getSura(tKey, sura).catch(() => [])])
      .then(([ar, tr]) => {
        if (!alive) return;
        const m = Object.fromEntries(tr.map((r) => [r.aya, clean(r.translation)]));
        setData({ status: 'ready', rows: ar.map((a) => ({ aya: a.aya, text: a.text, meaning: m[a.aya] || '' })) });
        setPos({ aya: 1, step: mode === 'meaning' ? 'meaning' : 'recite', rep: 1 });
      })
      .catch(() => alive && setData({ status: 'error', rows: [] }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sura, tKey]);

  const last = data.rows.length;
  const firstStep = mode === 'meaning' ? 'meaning' : 'recite';

  const urlFor = useCallback((p) => (p.step === 'recite' ? recitationUrl(reciter, sura, p.aya) : meaningAudioUrl(tKey, sura, p.aya)), [reciter, sura, tKey]);

  // The step after `p`, or null at the end of the sūrah.
  const nextOf = useCallback((p) => {
    if (p.step === 'recite' && p.rep < repeat) return { ...p, rep: p.rep + 1 };
    if (p.step === 'recite' && mode === 'both') return { aya: p.aya, step: 'meaning', rep: 1 };
    if (p.aya >= last) return null;
    return { aya: p.aya + 1, step: firstStep, rep: 1 };
  }, [repeat, mode, last, firstStep]);

  function stop() {
    const a = audio.current; if (a) { a.pause(); a.removeAttribute('src'); }
    setPlaying(false);
  }

  const playAt = useCallback((p) => {
    const a = audio.current; if (!a) return;
    setPos(p);
    a.src = urlFor(p);
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [urlFor]);

  // Advance on end; skip a missing file instead of stalling.
  useEffect(() => {
    const a = audio.current; if (!a) return undefined;
    const onEnded = () => { const n = nextOf(pos); if (n) playAt(n); else { setPlaying(false); setNotice('Sūrah complete.'); } };
    const onError = () => {
      if (!a.getAttribute('src')) return;
      setNotice(`${pos.step === 'recite' ? 'Recitation' : 'Meaning audio'} unavailable for ${sura}:${pos.aya} — skipped.`);
      onEnded();
    };
    a.addEventListener('ended', onEnded); a.addEventListener('error', onError);
    return () => { a.removeEventListener('ended', onEnded); a.removeEventListener('error', onError); };
  }, [pos, nextOf, playAt, sura]);

  // Keep the current āyah in view, and tell the OS what's playing.
  useEffect(() => {
    rowRefs.current[pos.aya]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if ('mediaSession' in navigator && playing) {
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: `${SURAH_NAMES[sura]} ${sura}:${pos.aya}`,
          artist: pos.step === 'recite' ? RECITERS.find((r) => r.id === reciter)?.name : 'Meaning',
          album: 'The FastTrack Madrasah',
        });
      } catch { /* unsupported */ }
    }
  }, [pos, playing, sura, reciter]);

  const toggle = () => {
    const a = audio.current; if (!a) return;
    setNotice('');
    if (playing) { a.pause(); setPlaying(false); return; }
    // Resume mid-file if one is loaded; otherwise (re)start this āyah in the
    // CURRENT mode (the mode may have changed while paused).
    if (a.getAttribute('src')) a.play().then(() => setPlaying(true)).catch(() => {});
    else playAt({ aya: pos.aya, step: firstStep, rep: 1 });
  };
  const jump = (ayaN) => { setNotice(''); playAt({ aya: ayaN, step: firstStep, rep: 1 }); };

  const audioKeys = useMemo(() => AUDIO_TRANSLATIONS, []);
  const phaseLabel = pos.step === 'recite' ? `Reciting${repeat > 1 ? ` (${pos.rep}/${repeat})` : ''}` : 'Meaning';

  return (
    <>
      <ToolSeo
        path="/tools/listen"
        title="Listen to the Meaning — Qur'an recitation with spoken translation | The FastTrack Madrasah"
        name="Listen to the Meaning"
        description="Hear each āyah recited, then its meaning spoken in your language — English, French, Persian, Chinese, Somali and more — āyah by āyah through a sūrah. A memorisation companion for every family."
      />
      <audio ref={audio} preload="auto" />

      <div className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">Listen to the Meaning</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Hear each āyah recited, then its meaning spoken in your language — through a whole sūrah. For memorising
            with understanding, and for families who don&apos;t read Arabic yet.
          </p>
          <div className="mt-6 grid sm:grid-cols-2 gap-2.5">
            <SurahSelect value={sura} onChange={setSura} />
            <TranslationSelect value={tKey} onChange={(k) => setTKey(k)} only={audioKeys} label="Spoken meaning" />
            <Select value={reciter} onChange={(v) => { setReciter(v); stop(); }} label="Reciter">
              {RECITERS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
            <div className="grid grid-cols-[1fr_auto] gap-2.5">
              <Select value={mode} onChange={(v) => { setMode(v); stop(); }} label="Mode">
                {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </Select>
              <Select value={repeat} onChange={(v) => setRepeat(Number(v))} label="Repeat recitation">
                {[1, 2, 3, 5].map((n) => <option key={n} value={n}>×{n}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Player bar */}
      <div className="sticky top-16 z-10 bg-white/95 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => jump(Math.max(1, pos.aya - 1))} disabled={data.status !== 'ready'} aria-label="Previous āyah" className="h-10 w-10 inline-flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 disabled:opacity-40"><SkipBack className="h-5 w-5" /></button>
          <button onClick={toggle} disabled={data.status !== 'ready'} aria-label={playing ? 'Pause' : 'Play'}
            className="h-12 w-12 inline-flex items-center justify-center rounded-full bg-wine-600 text-white hover:bg-wine-700 shadow-sm disabled:opacity-50">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <button onClick={() => jump(Math.min(last, pos.aya + 1))} disabled={data.status !== 'ready'} aria-label="Next āyah" className="h-10 w-10 inline-flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 disabled:opacity-40"><SkipForward className="h-5 w-5" /></button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{SURAH_NAMES[sura]} {sura}:{pos.aya}{last ? <span className="text-gray-400 font-normal"> / {last}</span> : null}</p>
            <p className="text-xs text-gray-500 inline-flex items-center gap-1">
              {playing && <Volume2 className="h-3.5 w-3.5 text-wine-600" />}{playing ? phaseLabel : 'Paused'}
            </p>
          </div>
        </div>
        {notice && <p className="max-w-3xl mx-auto px-4 sm:px-6 pb-2 text-xs text-gray-500">{notice}</p>}
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
        {data.status === 'loading' && <div className="flex justify-center py-16 text-gray-400"><Loader2 className="h-7 w-7 animate-spin" /></div>}
        {data.status === 'error' && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Couldn&apos;t load this sūrah. Check your connection and try again.</p>}
        {data.status === 'ready' && (
          <ol className="space-y-2">
            {data.rows.map((r) => {
              const current = r.aya === pos.aya;
              return (
                <li key={r.aya} ref={(el) => { rowRefs.current[r.aya] = el; }}>
                  <button onClick={() => jump(r.aya)}
                    className={`w-full text-left rounded-xl border px-4 sm:px-5 py-4 transition ${current ? 'border-wine-300 bg-[#fffdf7] ring-1 ring-wine-200' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <p dir="rtl" className={`font-quran text-[24px] sm:text-[28px] leading-[2] text-right ${current && pos.step === 'recite' && playing ? 'text-wine-800' : 'text-gray-900'}`}>
                      {r.text} <span className="text-wine-700">{toArabicDigits(r.aya)}</span>
                    </p>
                    {r.meaning && (
                      <p dir="auto" className={`mt-2 text-[15px] leading-relaxed ${current && pos.step === 'meaning' && playing ? 'text-wine-800 font-medium' : 'text-gray-600'}`}>{r.meaning}</p>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-8 text-xs text-gray-400">
          Recitation: {RECITERS.find((r) => r.id === reciter)?.name} via EveryAyah.com. Spoken and written meaning: {credit(translation)}.
          Arabic: verified ʿUthmānī text. The meaning in another language is an interpretation, not the Qurʾān itself.
        </p>
      </div>
    </>
  );
}
