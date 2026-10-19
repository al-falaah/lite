import ToolSeo from '../../components/tools/ToolSeo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X, BookOpen, RotateCcw, Play, Loader2, Flame, ArrowRight } from 'lucide-react';
import TranslationSelect from '../../components/tools/TranslationSelect';
import SurahSelect from '../../components/tools/SurahSelect';
import VerseReader from '../../components/common/VerseReader';
import { getSura, listTranslations, credit } from '../../services/quranenc';
import { getSuraArabic } from '../../services/quranText';
import { SURAH_NAMES, AYAH_COUNTS } from '../../utils/quran';

/**
 * Meaning Match — a comprehension drill. Each round shows an āyah's meaning
 * (any of QuranEnc's 76 translations) and four Arabic āyāt; pick the one it
 * translates — or play the reverse. Distractors come from the same sūrah, and
 * no two options share the same Arabic or the same meaning, so every round has
 * exactly one correct answer. Arabic is our verified corpus text.
 */

const ROUNDS = 10;
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const SCOPES = [
  { id: 'amma', label: 'Juz ʿAmma (78–114)', suras: range(78, 114) },
  { id: 'tabarak', label: 'Juz Tabārak (67–77)', suras: range(67, 77) },
  { id: 'sura', label: 'One sūrah…', suras: null },
  { id: 'all', label: 'The whole Qurʾān', suras: range(1, 114) },
];
const PREF_KEY = 'meaning-match-prefs';

// Translation text without footnote markers like "[2011]".
const clean = (t) => String(t || '').replace(/\s*\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
// Pick a sūrah weighted by its āyah count, so every āyah is equally likely.
function pickSura(suras) {
  const total = suras.reduce((n, s) => n + AYAH_COUNTS[s], 0);
  let r = Math.random() * total;
  for (const s of suras) { r -= AYAH_COUNTS[s]; if (r <= 0) return s; }
  return suras[suras.length - 1];
}

async function loadSura(key, sura) {
  const [ar, tr] = await Promise.all([getSuraArabic(sura), getSura(key, sura)]);
  const meaning = Object.fromEntries(tr.map((r) => [r.aya, clean(r.translation)]));
  return ar.map((a) => ({ sura, aya: a.aya, text: a.text, meaning: meaning[a.aya] || '' }));
}

async function buildRound(key, suras, used) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const sura = pickSura(suras);
    const rows = (await loadSura(key, sura)).filter((r) => r.meaning.length >= 20);
    const textCount = {}; for (const r of rows) textCount[r.text] = (textCount[r.text] || 0) + 1;
    const candidates = rows.filter((r) => textCount[r.text] === 1 && !used.has(`${r.sura}:${r.aya}`));
    if (!candidates.length) continue;
    const answer = candidates[Math.floor(Math.random() * candidates.length)];

    // Distractors: same sūrah first, then neighbours; all texts AND meanings distinct.
    const pool = shuffle(rows.filter((r) => r.aya !== answer.aya));
    const pick = [];
    const seenText = new Set([answer.text]); const seenMeaning = new Set([answer.meaning]);
    const take = (list) => { for (const r of list) { if (pick.length >= 3) break; if (seenText.has(r.text) || seenMeaning.has(r.meaning)) continue; pick.push(r); seenText.add(r.text); seenMeaning.add(r.meaning); } };
    take(pool);
    for (const n of [sura + 1, sura - 1, sura + 2, sura - 2]) {
      if (pick.length >= 3) break;
      if (n < 1 || n > 114) continue;
      take(shuffle((await loadSura(key, n)).filter((r) => r.meaning.length >= 20)));
    }
    if (pick.length < 3) continue;
    return { answer, options: shuffle([answer, ...pick]) };
  }
  throw new Error('Could not build a round');
}

function readPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; }
}

export default function MeaningMatch() {
  const prefs = readPrefs();
  const [tKey, setTKey] = useState(prefs.tKey || 'english_saheeh');
  const [translation, setTranslation] = useState(null);
  const [scope, setScope] = useState(prefs.scope || 'amma');
  const [oneSura, setOneSura] = useState(prefs.oneSura || 67);
  const [direction, setDirection] = useState(prefs.direction || 'm2a'); // meaning→arabic | arabic→meaning

  const [phase, setPhase] = useState('setup'); // setup | loading | playing | done | error
  const [round, setRound] = useState(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [history, setHistory] = useState([]);
  const [reading, setReading] = useState(null);
  const used = useRef(new Set());
  const nextRound = useRef(null);

  useEffect(() => {
    listTranslations().then((all) => setTranslation(all.find((t) => t.key === tKey) || null)).catch(() => {});
  }, [tKey]);
  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ tKey, scope, oneSura, direction })); } catch { /* ignore */ }
  }, [tKey, scope, oneSura, direction]);

  const suras = scope === 'sura' ? [oneSura] : SCOPES.find((s) => s.id === scope).suras;

  const prefetch = useCallback(() => {
    nextRound.current = buildRound(tKey, suras, used.current).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tKey, scope, oneSura]);

  const start = async () => {
    used.current = new Set();
    setScore(0); setXp(0); setStreak(0); setBest(0); setHistory([]); setIndex(0); setPicked(null);
    setPhase('loading');
    try {
      const r = await buildRound(tKey, suras, used.current);
      used.current.add(`${r.answer.sura}:${r.answer.aya}`);
      setRound(r); setPhase('playing');
      prefetch();
    } catch { setPhase('error'); }
  };

  const choose = (opt) => {
    if (picked) return;
    setPicked(opt);
    const ok = opt.aya === round.answer.aya && opt.sura === round.answer.sura;
    const newStreak = ok ? streak + 1 : 0;
    setStreak(newStreak);
    setBest((b) => Math.max(b, newStreak));
    if (ok) { setScore((s) => s + 1); setXp((x) => x + 10 + (newStreak >= 3 ? 5 : 0)); }
    setHistory((h) => [...h, { ...round.answer, ok }]);
  };

  const advance = async () => {
    if (index + 1 >= ROUNDS) { setPhase('done'); return; }
    setPicked(null);
    setPhase('loading');
    let r = nextRound.current ? await nextRound.current : null;
    if (!r || used.current.has(`${r.answer.sura}:${r.answer.aya}`)) {
      try { r = await buildRound(tKey, suras, used.current); } catch { setPhase('error'); return; }
    }
    used.current.add(`${r.answer.sura}:${r.answer.aya}`);
    setRound(r); setIndex((i) => i + 1); setPhase('playing');
    prefetch();
  };

  // Keyboard: 1–4 choose, Enter continues.
  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const onKey = (e) => {
      if (reading) return;
      if (!picked && /^[1-4]$/.test(e.key)) choose(round.options[Number(e.key) - 1]);
      else if (picked && e.key === 'Enter') advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const ref = (r) => `${SURAH_NAMES[r.sura]} ${r.sura}:${r.aya}`;
  const m2a = direction === 'm2a';

  return (
    <>
      <ToolSeo
        path="/tools/meaning-match"
        title="Meaning Match — Qur'an comprehension drill in 70+ languages | The FastTrack Madrasah"
        name="Meaning Match"
        description="A quick Qur'an comprehension game: read an āyah's meaning in your language and pick the matching Arabic āyah — or the reverse. 76 translations, Juz ʿAmma to the whole Qur'an."
      />

      <div className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">Meaning Match</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Read an āyah&apos;s meaning in your own language and find the Arabic it translates — reading for understanding, not just recitation.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {(phase === 'setup' || phase === 'error') && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <p className="text-[13px] font-medium text-gray-700 mb-1.5">Meaning in</p>
              <TranslationSelect value={tKey} onChange={(k) => setTKey(k)} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-700 mb-1.5">Āyāt from</p>
              <div className="grid grid-cols-2 gap-2">
                {SCOPES.map((s) => (
                  <button key={s.id} onClick={() => setScope(s.id)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${scope === s.id ? 'border-wine-600 ring-1 ring-wine-600 bg-wine-50 text-wine-800 font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              {scope === 'sura' && <SurahSelect value={oneSura} onChange={setOneSura} className="mt-2" />}
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-700 mb-1.5">Mode</p>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
                {[['m2a', 'Meaning → Arabic'], ['a2m', 'Arabic → Meaning']].map(([id, label]) => (
                  <button key={id} onClick={() => setDirection(id)}
                    className={`rounded-md py-2 text-sm font-medium transition ${direction === id ? 'bg-white text-wine-700 shadow-sm' : 'text-gray-500'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {phase === 'error' && <p className="text-sm text-red-700">Couldn&apos;t load āyāt right now. Check your connection and try again.</p>}
            <button onClick={start} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-wine-600 py-3 text-base font-semibold text-white hover:bg-wine-700 shadow-sm">
              <Play className="h-4 w-4" /> Start · {ROUNDS} rounds
            </button>
          </div>
        )}

        {phase === 'loading' && (
          <div className="flex justify-center py-20 text-gray-400"><Loader2 className="h-7 w-7 animate-spin" /></div>
        )}

        {phase === 'playing' && round && (
          <div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-500">{index + 1} of {ROUNDS}</span>
              <span className="flex items-center gap-3">
                {streak >= 2 && <span className="inline-flex items-center gap-1 text-amber-600 font-semibold"><Flame className="h-4 w-4" />{streak}</span>}
                <span className="font-semibold text-wine-700">{xp} XP</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 mb-6 overflow-hidden">
              <div className="h-full bg-wine-600 transition-all" style={{ width: `${((index + (picked ? 1 : 0)) / ROUNDS) * 100}%` }} />
            </div>

            {/* Prompt */}
            <div className="rounded-2xl border border-[#eadfce] bg-[#fffdf7] px-5 sm:px-7 py-6 mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                {m2a ? 'Which āyah does this mean?' : 'Which meaning matches this āyah?'}
              </p>
              {m2a ? (
                <p dir="auto" className="text-lg sm:text-xl leading-relaxed text-gray-900">“{round.answer.meaning}”</p>
              ) : (
                <p dir="rtl" className="font-quran text-[28px] sm:text-[34px] leading-[2] text-gray-900 text-center">{round.answer.text}</p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {round.options.map((opt, i) => {
                const isAnswer = opt.aya === round.answer.aya && opt.sura === round.answer.sura;
                const isPicked = picked && opt.aya === picked.aya && opt.sura === picked.sura;
                const state = !picked ? 'idle' : isAnswer ? 'right' : isPicked ? 'wrong' : 'dim';
                return (
                  <button key={`${opt.sura}:${opt.aya}`} onClick={() => choose(opt)} disabled={!!picked}
                    className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                      state === 'right' ? 'border-emerald-500 bg-emerald-50' :
                      state === 'wrong' ? 'border-red-400 bg-red-50' :
                      state === 'dim' ? 'border-gray-200 bg-white opacity-55' :
                      'border-gray-200 bg-white hover:border-wine-300 hover:shadow-sm'}`}>
                    <span className={`mt-1 w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${
                      state === 'right' ? 'bg-emerald-600 text-white' : state === 'wrong' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {state === 'right' ? <Check className="h-4 w-4" /> : state === 'wrong' ? <X className="h-4 w-4" /> : i + 1}
                    </span>
                    {m2a ? (
                      <span dir="rtl" className="flex-1 font-quran text-[22px] sm:text-[26px] leading-[2] text-gray-900 text-right">{opt.text}</span>
                    ) : (
                      <span dir="auto" className="flex-1 text-[15px] leading-relaxed text-gray-800">{opt.meaning}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {picked && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className={`text-sm font-medium ${picked.aya === round.answer.aya && picked.sura === round.answer.sura ? 'text-emerald-700' : 'text-red-700'}`}>
                  {picked.aya === round.answer.aya && picked.sura === round.answer.sura ? 'Correct' : 'Not quite'} — {ref(round.answer)}
                </span>
                <button onClick={() => setReading(round.answer)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-wine-700 hover:bg-wine-50">
                  <BookOpen className="h-4 w-4" /> Read
                </button>
                <div className="flex-1" />
                <button onClick={advance} className="inline-flex items-center gap-1.5 rounded-xl bg-wine-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-wine-700">
                  {index + 1 >= ROUNDS ? 'See results' : 'Next'} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'done' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Your result</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">{score}/{ROUNDS}</p>
            <p className="text-sm text-gray-600 mt-1">{xp} XP · best streak {best}</p>
            <ul className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
              {history.map((h, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  {h.ok ? <Check className="h-4 w-4 text-emerald-600 shrink-0" /> : <X className="h-4 w-4 text-red-500 shrink-0" />}
                  <span className="text-sm text-gray-700 flex-1">{ref(h)}</span>
                  <button onClick={() => setReading(h)} className="text-sm font-medium text-wine-700 hover:underline">Read</button>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <button onClick={start} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-wine-600 py-3 text-sm font-semibold text-white hover:bg-wine-700">
                <RotateCcw className="h-4 w-4" /> Play again
              </button>
              <button onClick={() => setPhase('setup')} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Change settings</button>
            </div>
          </div>
        )}

        <p className="mt-8 text-xs text-gray-400">
          Meanings: {credit(translation)}. Arabic: verified ʿUthmānī text. The meaning of an āyah in another language is an
          interpretation, not the Qurʾān itself.
        </p>
      </div>

      {reading && <VerseReader sura={reading.sura} aya={reading.aya} onClose={() => setReading(null)} />}
    </>
  );
}
