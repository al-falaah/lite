import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RotateCcw, ArrowRight, Play, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import {
  calcXP, getComboMultiplier, getComboLabel,
} from '../../utils/drillHelpers';
import QuizLeaderboard from './QuizLeaderboard';

/**
 * Plays a chapter's lesson_quiz as a soft-timed drill game.
 *
 * URL: /student/drill/:quizId
 *
 * Soft timer per question (15s default). Speed bonus = 1× → 2× of base XP
 * scaled by remaining time. After timeout the bonus floor is base XP × 1.0
 * (still answerable). Combo multiplier and hint penalty stack on top.
 *
 * On finish, calls record_quiz_drill_attempt RPC which upserts on
 * (student_id, quiz_id) — last attempt overrides, attempts_count increments.
 */

const PHASES = { READY: 'ready', PLAYING: 'playing', RESULT: 'result', SUMMARY: 'summary' };

const TIME_PER_QUESTION_SECONDS = 15;
const BASE_POINTS = 10;

// Convert 'A'/'B'/'C'/'D' → 0/1/2/3
const letterToIndex = (letter) => Math.max(0, (letter || 'A').charCodeAt(0) - 65);

// Strip the leading "A. " / "B. " etc from option text so we can render letters separately.
const stripPrefix = (s) => (s || '').replace(/^[A-D]\.\s*/, '');

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function DrillPlayer() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Game state
  const [phase, setPhase] = useState(PHASES.READY);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null); // 0-3 once chosen
  const [didTimeout, setDidTimeout] = useState(false);

  // Scoring
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastXP, setLastXP] = useState(0);
  const [lastSpeedFactor, setLastSpeedFactor] = useState(1);
  const [resultAnim, setResultAnim] = useState(null);
  const [floatingXP, setFloatingXP] = useState(null);

  // Timing
  const startRef = useRef(null);                  // game start
  const questionStartRef = useRef(null);          // current question start
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [questionElapsed, setQuestionElapsed] = useState(0);

  const currentQuestion = questions[index];

  // ── Load quiz + questions + program (via course) ───────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: q, error: qErr } = await supabase
          .from('lesson_quizzes')
          .select('*')
          .eq('id', quizId)
          .single();
        if (qErr) throw qErr;
        if (cancelled) return;
        setQuiz(q);

        const { data: ch, error: chErr } = await supabase
          .from('lesson_chapters')
          .select('*, lesson_courses(slug, title, program_id)')
          .eq('id', q.chapter_id)
          .single();
        if (chErr) throw chErr;
        if (cancelled) return;
        setChapter(ch);
        setCourse(ch.lesson_courses);
        setProgram(ch.lesson_courses?.program_id);

        const { data: qs, error: qsErr } = await supabase
          .from('quiz_questions')
          .select('id, question_number, question, options, correct_answer, explanation, difficulty, section_tag')
          .eq('quiz_id', quizId)
          .order('question_number');
        if (qsErr) throw qsErr;
        if (cancelled) return;

        const normalised = (qs || []).map((row) => ({
          id: row.id,
          question: row.question,
          options: (row.options || []).map(stripPrefix),
          correct_index: letterToIndex(row.correct_answer),
          explanation: row.explanation || null,
          section_tag: row.section_tag,
        }));
        setQuestions(q.shuffle_questions ? shuffle(normalised) : normalised);
      } catch (err) {
        console.error('Failed to load quiz:', err);
        if (!cancelled) setLoadError(err.message || 'Failed to load quiz');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [quizId]);

  // ── Total game timer
  useEffect(() => {
    if (phase !== PHASES.PLAYING && phase !== PHASES.RESULT) return;
    const interval = setInterval(() => {
      if (startRef.current) setTotalElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  // ── Per-question soft timer
  useEffect(() => {
    if (phase !== PHASES.PLAYING) return;
    setQuestionElapsed(0);
    questionStartRef.current = Date.now();
    const interval = setInterval(() => {
      if (questionStartRef.current) {
        setQuestionElapsed(Math.floor((Date.now() - questionStartRef.current) / 1000));
      }
    }, 200);
    return () => clearInterval(interval);
  }, [phase, index]);

  // Mark didTimeout when soft timer crosses limit (still allows answering)
  useEffect(() => {
    if (phase !== PHASES.PLAYING) return;
    if (questionElapsed >= TIME_PER_QUESTION_SECONDS && !didTimeout) {
      setDidTimeout(true);
    }
  }, [questionElapsed, didTimeout, phase]);

  // ── Sound helper (kept identical to old DrillPlayer)
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
    } catch { /* Audio unsupported, silent */ }
  };

  const startGame = () => {
    setPhase(PHASES.PLAYING);
    startRef.current = Date.now();
    questionStartRef.current = Date.now();
    setIndex(0);
    setScore(0);
    setXp(0);
    setCombo(0);
    setMaxCombo(0);
    setSelected(null);
    setDidTimeout(false);
    setLastXP(0);
    setQuestionElapsed(0);
  };

  const handleAnswer = (optionIndex) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correct_index;
    const newCombo = isCorrect ? combo + 1 : 0;

    // Speed factor: 1.0 → 2.0 if answered before timeout, fixed 1.0 once timed out.
    // Linear: speedFactor = 1 + (timeLeft / total)
    const timeLeft = Math.max(0, TIME_PER_QUESTION_SECONDS - questionElapsed);
    const speedFactor = didTimeout ? 1 : 1 + (timeLeft / TIME_PER_QUESTION_SECONDS);
    const earned = isCorrect ? Math.round(calcXP(BASE_POINTS, newCombo, false) * speedFactor) : 0;

    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);
    if (isCorrect) {
      setScore((s) => s + 1);
      setXp((x) => x + earned);
    }
    setLastXP(earned);
    setLastSpeedFactor(speedFactor);

    playSound(isCorrect ? 'correct' : 'wrong');
    if (navigator.vibrate) navigator.vibrate(isCorrect ? [10] : [40, 20, 40]);
    setResultAnim(isCorrect ? 'correct' : 'wrong');
    if (isCorrect && earned > 0) {
      setFloatingXP(earned);
      setTimeout(() => setFloatingXP(null), 1200);
    }
    setPhase(PHASES.RESULT);
  };

  const nextCard = async () => {
    if (index + 1 >= questions.length) {
      const totalTime = Math.floor((Date.now() - startRef.current) / 1000);
      try {
        await supabase.rpc('record_quiz_drill_attempt', {
          p_quiz_id: quizId,
          p_program: program,
          p_score: score,
          p_total_questions: questions.length,
          p_xp: xp,
          p_time_seconds: totalTime,
        });
      } catch (err) {
        console.error('Failed to record drill attempt:', err);
      }
      setPhase(PHASES.SUMMARY);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setDidTimeout(false);
      setResultAnim(null);
      setPhase(PHASES.PLAYING);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const comboMultiplier = getComboMultiplier(combo);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
    </div>
  );

  if (loadError || !quiz || questions.length === 0) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4 px-4 text-center">
      <p className="text-lg">{loadError ? 'Failed to load drill' : 'No questions in this drill yet'}</p>
      {loadError && <p className="text-xs text-gray-500">{loadError}</p>}
      <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white">← Go back</button>
    </div>
  );

  const totalXpPossible = questions.length * BASE_POINTS * 2; // 2× speed cap

  // ═══════════════════════════════════════════════════════
  // READY
  // ═══════════════════════════════════════════════════════
  if (phase === PHASES.READY) return (
    <>
      <Helmet><title>{`${quiz.title} | Drill`}</title></Helmet>
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-1">{quiz.title}</h1>
          {chapter?.title && <p className="text-gray-400 text-sm mb-2">{chapter.title}</p>}
          {quiz.subtitle && <p className="text-gray-500 text-xs mb-6">{quiz.subtitle}</p>}

          <div className="flex justify-center gap-6 mb-6 text-gray-400 text-sm">
            <span>{questions.length} questions</span>
            <span>up to {totalXpPossible} XP</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">How to play</p>
            <ul className="text-xs text-gray-400 space-y-1.5">
              <li>• {TIME_PER_QUESTION_SECONDS}s per question — faster = more XP (up to 2×)</li>
              <li>• Build combos for ×1.5 / ×2 / ×3 multipliers</li>
              <li>• Last attempt updates your leaderboard score</li>
            </ul>
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
  // SUMMARY → leaderboard
  // ═══════════════════════════════════════════════════════
  if (phase === PHASES.SUMMARY) {
    const percent = Math.round((score / questions.length) * 100);
    const isPerfect = score === questions.length;
    return (
      <>
        <Helmet><title>{`Results | ${quiz.title}`}</title></Helmet>
        <div className="min-h-screen bg-gray-950 px-4 py-8 overflow-y-auto">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <p className="text-5xl mb-3">{isPerfect ? '💯' : percent >= 70 ? '🌟' : '📖'}</p>
              <h2 className="text-2xl font-bold text-white mb-1">
                {isPerfect ? 'PERFECT!' : percent >= 70 ? 'Great job!' : 'Keep practicing!'}
              </h2>
              <p className="text-gray-400 text-sm">{quiz.title}</p>
            </div>

            {/* Score Breakdown */}
            <div className="bg-gray-800/50 rounded-xl p-5 mb-6 space-y-3 border border-gray-700/50">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Score</span>
                <span className="text-white font-bold">{score}/{questions.length} ({percent}%)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">XP Earned</span>
                <span className="text-amber-400 font-bold">+{xp}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Best Combo</span>
                <span className="text-orange-400 font-bold">×{maxCombo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Time</span>
                <span className="text-gray-300 font-mono">{formatTime(totalElapsed)}</span>
              </div>
            </div>

            {/* Live leaderboard */}
            <div className="mb-6">
              <QuizLeaderboard quizId={quizId} program={program} darkMode />
            </div>

            <div className="flex gap-3">
              <button onClick={startGame}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Try again
              </button>
              <button onClick={() => navigate('/student')}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                Back to portal <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════
  // PLAYING / RESULT
  // ═══════════════════════════════════════════════════════
  const isResult = phase === PHASES.RESULT;
  const isCorrect = selected === currentQuestion?.correct_index;
  const timeLeft = Math.max(0, TIME_PER_QUESTION_SECONDS - questionElapsed);
  const timerPct = (timeLeft / TIME_PER_QUESTION_SECONDS) * 100;

  return (
    <>
      <Helmet><title>{`Q${index + 1} | ${quiz.title}`}</title></Helmet>
      <div className="min-h-screen bg-gray-950 flex flex-col">

        {resultAnim && (
          <div className={`fixed inset-0 pointer-events-none z-40 animate-drill-flash ${
            resultAnim === 'correct' ? 'bg-emerald-500/15' : 'bg-red-500/15'
          }`} />
        )}

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
                <span className="text-orange-400 font-bold text-xs">{getComboLabel(combo)}</span>
              )}
              <span className="text-amber-400 font-mono font-bold">{xp} XP</span>
              <span className="text-gray-500 font-mono">{formatTime(totalElapsed)}</span>
            </div>
          </div>

          {/* Progress (questions) */}
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${((index + (isResult ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-gray-600">
            <span>{index + 1} of {questions.length}</span>
            {combo >= 3 && <span className="text-orange-500">×{comboMultiplier} combo</span>}
          </div>

          {/* Per-question timer (only while playing, not on result) */}
          {!isResult && (
            <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  didTimeout ? 'bg-gray-600' : timerPct > 33 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${didTimeout ? 100 : timerPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-lg mx-auto w-full">

          <h2 className="text-lg font-semibold text-white mb-6 text-center leading-relaxed">
            {currentQuestion.question}
          </h2>

          <div className={`space-y-3 mb-6 ${resultAnim === 'wrong' ? 'animate-drill-wrong' : ''}`}>
            {currentQuestion.options.map((opt, i) => {
              let style = 'border-gray-700 bg-gray-800/40 text-gray-200 active:bg-gray-800';
              if (isResult) {
                if (i === currentQuestion.correct_index) style = 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
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
                    isResult && i === currentQuestion.correct_index ? 'bg-emerald-500/30 text-emerald-300'
                    : isResult && i === selected && !isCorrect ? 'bg-red-500/30 text-red-300'
                    : isResult ? 'bg-gray-800/30 text-gray-600'
                    : 'bg-gray-700/50 text-gray-400'
                  }`}>{LETTERS[i]}</span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>

          {!isResult && didTimeout && (
            <p className="text-center text-xs text-gray-500 mb-4 italic">
              Time's up — answer to continue (no speed bonus).
            </p>
          )}

          {isResult && (
            <div className={`rounded-xl px-5 py-4 mb-4 border ${
              isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 animate-drill-correct' : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite'}
                </span>
                {isCorrect && (
                  <span className="text-amber-400 text-sm font-bold">
                    +{lastXP} XP{lastSpeedFactor > 1.05 ? ` (×${lastSpeedFactor.toFixed(1)} speed)` : ''}
                  </span>
                )}
              </div>
              {currentQuestion.explanation && (
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{currentQuestion.explanation}</p>
              )}
            </div>
          )}

          {isResult && (
            <button onClick={nextCard}
              className="w-full py-4 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              {index + 1 >= questions.length ? 'See results' : 'Next question'} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
