import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RotateCcw, ArrowRight, Play, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import {
  segmentHighlights, calcXP, getComboMultiplier, getComboLabel,
  getLevel, getLevelTitle, levelProgress,
} from '../../utils/drillHelpers';
import { loadTajweedDrillData, generateSession } from '../../utils/tajweedDrillGenerator';

const PHASES = { READY: 'ready', PLAYING: 'playing', RESULT: 'result', SUMMARY: 'summary' };

// Matches seed row in migration 20260416000003_seed_endless_tajweed_deck.sql
const ENDLESS_TAJWEED_DECK_ID = '00000000-0000-0000-0000-00000000e4d1';

export default function DrillPlayer() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEndless = deckId?.startsWith('endless-');
  const endlessLength = parseInt(searchParams.get('n') || '10', 10);
  const endlessRule = searchParams.get('rule') || null;

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);

  // Game state
  const [phase, setPhase] = useState(PHASES.READY);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [usedHint, setUsedHint] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Scoring
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [lastXP, setLastXP] = useState(0);
  const [resultAnim, setResultAnim] = useState(null);
  const [floatingXP, setFloatingXP] = useState(null);

  // Timer
  const startRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);

  // ── Load deck + cards + student ────────────────────────
  useEffect(() => {
    const load = async () => {
      if (isEndless) {
        // Just preload the data + deck metadata; cards are generated in startGame()
        // so the READY screen's "questions" count reflects the chosen length but
        // we avoid showing stale cards that a later regenerate would overwrite.
        const data = await loadTajweedDrillData();
        const ruleLabel = endlessRule ? data.rules[endlessRule]?.name_en : null;
        setDeck({
          id: ENDLESS_TAJWEED_DECK_ID,
          title: ruleLabel ? `Endless: ${ruleLabel}` : 'Endless Tajweed',
          topic: 'Tajweed',
          program: 'tajweed',
          cover_emoji: ruleLabel ? '🎯' : '♾️',
          description: `${endlessLength} mixed questions from the Qur'an`,
        });
        // Placeholder with the right length so READY screen stats are accurate.
        // Real cards are generated on Start.
        setCards(new Array(endlessLength).fill(null));
      } else {
        const [{ data: d }, { data: c }] = await Promise.all([
          supabase.from('drill_decks').select('*').eq('id', deckId).single(),
          supabase.from('drill_cards').select('*').eq('deck_id', deckId).order('sort_order'),
        ]);
        setDeck(d);
        setCards(c || []);
      }

      // Get student ID
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: stu } = await supabase
          .from('students')
          .select('id')
          .eq('email', session.user.email)
          .single();
        if (stu) setStudentId(stu.id);
      }
      setLoading(false);
    };
    load();
  }, [deckId, isEndless, endlessLength, endlessRule]);

  // Timer
  useEffect(() => {
    if (phase !== PHASES.PLAYING && phase !== PHASES.RESULT) return;
    const interval = setInterval(() => {
      if (startRef.current) setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const currentCard = cards[index];

  // ── Start ──────────────────────────────────────────────
  const startGame = async () => {
    // For endless mode, regenerate a fresh set of cards each run
    if (isEndless) {
      const data = await loadTajweedDrillData();
      setCards(generateSession(data, endlessLength, endlessRule));
    }
    setPhase(PHASES.PLAYING);
    startRef.current = Date.now();
    setIndex(0);
    setScore(0);
    setXp(0);
    setCombo(0);
    setMaxCombo(0);
    setAnswers([]);
    setSelected(null);
    setUsedHint(false);
    setShowHint(false);
  };

  // ── Sound helper ───────────────────────────────────────
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(185, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
      setTimeout(() => ctx.close(), 600);
    } catch (e) { /* Audio not supported */ }
  };

  // ── Answer ─────────────────────────────────────────────
  const handleAnswer = (optionIndex) => {
    if (selected !== null) return; // already answered
    setSelected(optionIndex);
    const isCorrect = optionIndex === currentCard.correct_index;
    const newCombo = isCorrect ? combo + 1 : 0;
    const earned = isCorrect ? calcXP(currentCard.points, newCombo, usedHint) : 0;

    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);
    if (isCorrect) {
      setScore(s => s + 1);
      setXp(x => x + earned);
    }
    setLastXP(earned);
    setAnswers(prev => [...prev, { cardId: currentCard.id, selected: optionIndex, correct: currentCard.correct_index, isCorrect, xp: earned }]);

    // Sound + haptic + animation
    playSound(isCorrect ? 'correct' : 'wrong');
    if (navigator.vibrate) navigator.vibrate(isCorrect ? [10] : [40, 20, 40]);
    setResultAnim(isCorrect ? 'correct' : 'wrong');
    if (isCorrect && earned > 0) {
      setFloatingXP(earned);
      setTimeout(() => setFloatingXP(null), 1200);
    }

    setPhase(PHASES.RESULT);
  };

  // ── Next card ──────────────────────────────────────────
  const nextCard = async () => {
    if (index + 1 >= cards.length) {
      // Finished — record attempt
      const totalTime = Math.floor((Date.now() - startRef.current) / 1000);
      if (studentId && deck) {
        await supabase.rpc('record_drill_attempt', {
          p_student_id: studentId,
          p_deck_id: deck.id,
          p_program: deck.program,
          p_score: score,
          p_total_cards: cards.length,
          p_xp_earned: xp,
          p_max_combo: maxCombo,
          p_time_seconds: totalTime,
        });
      }
      setPhase(PHASES.SUMMARY);
    } else {
      setIndex(i => i + 1);
      setSelected(null);
      setUsedHint(false);
      setShowHint(false);
      setResultAnim(null);
      setPhase(PHASES.PLAYING);
    }
  };

  // ── Hint ───────────────────────────────────────────────
  const revealHint = () => {
    setShowHint(true);
    setUsedHint(true);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const comboMultiplier = getComboMultiplier(combo);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
    </div>
  );

  if (!deck || cards.length === 0) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p className="text-lg">Deck not found or empty</p>
      <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white">← Go back</button>
    </div>
  );

  // ═══════════════════════════════════════════════════════
  // READY SCREEN
  // ═══════════════════════════════════════════════════════
  if (phase === PHASES.READY) return (
    <>
      <Helmet><title>{`${deck.title} | Drills`}</title></Helmet>
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-6xl mb-4">{deck.cover_emoji}</p>
          <h1 className="text-2xl font-bold text-white mb-2">{deck.title}</h1>
          <p className="text-gray-400 text-sm mb-1">{deck.topic}</p>
          {deck.description && <p className="text-gray-500 text-xs mb-6">{deck.description}</p>}

          <div className="flex justify-center gap-6 mb-8 text-gray-400 text-sm">
            <span>{cards.length} questions</span>
            <span>{cards.reduce((s, c) => s + (c?.points || 10), 0)} XP possible</span>
          </div>

          <button onClick={startGame}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            <Play className="h-5 w-5" /> Start Drill
          </button>

          <button onClick={() => navigate(-1)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-300">
            ← Back
          </button>
        </div>
      </div>
    </>
  );

  // ═══════════════════════════════════════════════════════
  // SUMMARY SCREEN
  // ═══════════════════════════════════════════════════════
  if (phase === PHASES.SUMMARY) {
    const percent = Math.round((score / cards.length) * 100);
    const isPerfect = score === cards.length;
    return (
      <>
        <Helmet><title>{`Results | ${deck.title}`}</title></Helmet>
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-sm w-full">
            <p className="text-5xl mb-3">{isPerfect ? '💯' : percent >= 70 ? '🌟' : '📖'}</p>
            <h2 className="text-2xl font-bold text-white mb-1">
              {isPerfect ? 'PERFECT!' : percent >= 70 ? 'Great job!' : 'Keep practicing!'}
            </h2>
            <p className="text-gray-400 text-sm mb-6">{deck.title}</p>

            {/* Score Breakdown */}
            <div className="bg-gray-800/50 rounded-xl p-5 mb-6 space-y-3 border border-gray-700/50">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Score</span>
                <span className="text-white font-bold">{score}/{cards.length} ({percent}%)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">XP Earned</span>
                <span className="text-amber-400 font-bold">+{xp}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Best Combo</span>
                <span className="text-orange-400 font-bold">x{maxCombo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Time</span>
                <span className="text-gray-300 font-mono">{formatTime(elapsed)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={startGame}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Retry
              </button>
              <button onClick={() => navigate('/drills')}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                All Drills <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════
  // PLAYING / RESULT SCREEN
  // ═══════════════════════════════════════════════════════
  const isResult = phase === PHASES.RESULT;
  const isCorrect = selected === currentCard.correct_index;

  return (
    <>
      <Helmet><title>{`Q${index + 1} | ${deck.title}`}</title></Helmet>
      <div className="min-h-screen bg-gray-950 flex flex-col">

        {/* Screen flash on answer */}
        {resultAnim && (
          <div className={`fixed inset-0 pointer-events-none z-40 animate-drill-flash ${
            resultAnim === 'correct' ? 'bg-emerald-500/15' : 'bg-red-500/15'
          }`} />
        )}

        {/* Floating XP */}
        {floatingXP && (
          <div className="fixed top-1/3 left-1/2 pointer-events-none z-50 animate-xp-float">
            <span className="text-4xl font-black text-amber-400 drop-shadow-lg">+{floatingXP}</span>
          </div>
        )}

        {/* Top Bar */}
        <div className="px-4 pt-4 pb-2 safe-top">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-white text-xs flex items-center gap-1"><X className="h-3 w-3" /> Quit</button>
            <div className="flex items-center gap-3 text-sm">
              {combo >= 3 && (
                <span className="text-orange-400 font-bold text-xs">
                  {getComboLabel(combo)}
                </span>
              )}
              <span className="text-amber-400 font-mono font-bold">{xp} XP</span>
              <span className="text-gray-500 font-mono">{formatTime(elapsed)}</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${((index + (isResult ? 1 : 0)) / cards.length) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-gray-600">
            <span>{index + 1} of {cards.length}</span>
            {combo >= 3 && <span className="text-orange-500">x{comboMultiplier} bonus</span>}
          </div>
        </div>

        {/* Card Content */}
        <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-lg mx-auto w-full">

          {/* Arabic Text */}
          {currentCard.arabic_text && (
            <div className="mb-6 p-5 bg-gray-800/60 rounded-2xl border border-gray-700/40">
              <p dir="rtl" className="text-2xl sm:text-3xl leading-loose font-arabic text-white text-center">
                {segmentHighlights(currentCard.arabic_text, currentCard.highlight_ranges).map((seg, j) =>
                  seg.highlighted
                    ? <span key={j} className="font-arabic bg-amber-500/30 text-amber-300 px-1 rounded-md border-b-2 border-amber-500/60">{seg.text}</span>
                    : <span key={j} className="font-arabic">{seg.text}</span>
                )}
              </p>
            </div>
          )}

          {/* Question */}
          <h2 className="text-lg font-semibold text-white mb-6 text-center leading-relaxed">
            {currentCard.question}
          </h2>

          {/* Options */}
          <div className={`space-y-3 mb-6 ${resultAnim === 'wrong' ? 'animate-drill-wrong' : ''}`}>
            {currentCard.options.map((opt, i) => {
              let style = 'border-gray-700 bg-gray-800/40 text-gray-200 active:bg-gray-800';
              if (isResult) {
                if (i === currentCard.correct_index) style = 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
                else if (i === selected && !isCorrect) style = 'border-red-500 bg-red-500/20 text-red-300';
                else style = 'border-gray-800 bg-gray-800/20 text-gray-600';
              }

              const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
              return (
                <button
                  key={i}
                  onClick={() => !isResult && handleAnswer(i)}
                  disabled={isResult}
                  className={`w-full py-4 px-5 rounded-xl border-2 text-left text-sm font-medium transition-colors flex items-center gap-3 ${style}`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isResult && i === currentCard.correct_index ? 'bg-emerald-500/30 text-emerald-300'
                    : isResult && i === selected && !isCorrect ? 'bg-red-500/30 text-red-300'
                    : isResult ? 'bg-gray-800/30 text-gray-600'
                    : 'bg-gray-700/50 text-gray-400'
                  }`}>{LETTERS[i]}</span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Hint */}
          {!isResult && currentCard.hint && !showHint && (
            <button onClick={revealHint}
              className="self-center text-xs text-gray-500 hover:text-amber-400 mb-4">
              Use hint (−50% XP)
            </button>
          )}
          {showHint && !isResult && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 mb-4">
              <p className="text-xs text-amber-400">💡 {currentCard.hint}</p>
            </div>
          )}

          {/* Result Feedback */}
          {isResult && (
            <div className={`rounded-xl px-5 py-4 mb-4 border ${
              isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 animate-drill-correct' : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite'}
                </span>
                {isCorrect && <span className="text-amber-400 text-sm font-bold">+{lastXP} XP</span>}
              </div>
              {currentCard.explanation && (
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{currentCard.explanation}</p>
              )}
            </div>
          )}

          {/* Next Button */}
          {isResult && (
            <button onClick={nextCard}
              className="w-full py-4 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              {index + 1 >= cards.length ? 'See Results' : 'Next Question'} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
