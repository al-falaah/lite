import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../services/supabase';
import { CheckCircle, XCircle, ArrowRight, BookOpen, ChevronLeft, Clock, AlertTriangle } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

export default function MilestoneTest() {
  const { programId, type, milestoneIndex } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Test data
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [timeLimit, setTimeLimit] = useState(null); // minutes
  const [settings, setSettings] = useState(null);

  // Test state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [shortAnswerText, setShortAnswerText] = useState('');
  const [answers, setAnswers] = useState({}); // { questionId: selectedValue }
  const [hasAnswered, setHasAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(null); // seconds
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    fetchTestSettings();
    startTest();
  }, [programId, type, milestoneIndex]);

  // Timer countdown
  useEffect(() => {
    if (!startedAt || !timeLimit || finished) return;

    const updateTimer = () => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      const remaining = (timeLimit * 60) - elapsed;

      if (remaining <= 0) {
        setTimedOut(true);
        setTimeRemaining(0);
        handleSubmit(true); // auto-submit
        return;
      }
      setTimeRemaining(Math.floor(remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startedAt, timeLimit, finished]);

  const fetchTestSettings = async () => {
    try {
      const { data } = await supabase
        .from('program_test_settings')
        .select('*')
        .eq('program_id', programId)
        .single();
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const startTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/get-test-questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          program_id: programId,
          type,
          milestone_index: type === 'milestone' ? parseInt(milestoneIndex) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.already_completed) {
          setError('You have already completed this test.');
        } else if (data.max_reached) {
          setError('You have reached the maximum number of attempts for this exam.');
        } else {
          setError(data.error || 'Failed to start test');
        }
        setLoading(false);
        return;
      }

      setAttemptId(data.attempt_id);
      setQuestions(data.questions);
      setStartedAt(data.started_at);
      setTimeLimit(data.time_limit_minutes);

      // Restore answers if resuming
      if (data.resumed && data.answers) {
        setAnswers(data.answers);
      }
    } catch (err) {
      console.error('Error starting test:', err);
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (submitting || finished) return;
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${supabaseUrl}/functions/v1/submit-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attempt_id: attemptId,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit test');
      }

      setResults(data);
      setFinished(true);
    } catch (err) {
      console.error('Error submitting test:', err);
      if (!isAutoSubmit) {
        alert('Failed to submit test. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [submitting, finished, attemptId, answers]);

  const currentQuestion = questions[currentIndex];

  const handleSelectAnswer = (value) => {
    if (hasAnswered) return;
    setSelectedAnswer(value);
  };

  const handleConfirmAnswer = () => {
    if (!currentQuestion) return;
    const value = currentQuestion.question_type === 'short_answer' ? shortAnswerText : selectedAnswer;
    if (!value) return;

    setHasAnswered(true);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      const nextQ = questions[currentIndex + 1];
      setSelectedAnswer(answers[nextQ?.id] || null);
      setShortAnswerText(answers[nextQ?.id] || '');
      setHasAnswered(!!answers[nextQ?.id]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      const prevQ = questions[currentIndex - 1];
      setSelectedAnswer(answers[prevQ?.id] || null);
      setShortAnswerText(answers[prevQ?.id] || '');
      setHasAnswered(!!answers[prevQ?.id]);
    }
  };

  const answeredCount = Object.keys(answers).length;

  const formatTime = (seconds) => {
    if (seconds == null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeWarning = timeRemaining != null && timeRemaining < 300; // < 5 min
  const isTimeCritical = timeRemaining != null && timeRemaining < 60; // < 1 min

  const testTitle = type === 'milestone'
    ? `Milestone ${parseInt(milestoneIndex) + 1} Test`
    : 'Final Exam';

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6e8]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading {testTitle}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6e8]">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{testTitle}</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link to="/student" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            ← Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  // Results screen
  if (finished && results) {
    const passed = results.percentage >= (settings?.pass_mark || 50);
    return (
      <>
        <Helmet>
          <title>{`${testTitle} — Results`}</title>
        </Helmet>
        <div className="min-h-screen bg-[#fdf6e8] flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <div className={`rounded-2xl p-8 text-center ${passed ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-amber-50 border-2 border-amber-200'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                {passed ? <CheckCircle className="h-10 w-10 text-emerald-600" /> : <XCircle className="h-10 w-10 text-amber-600" />}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {results.status === 'timed_out' ? 'Time\'s Up!' : passed ? 'Well Done!' : 'Keep Going!'}
              </h2>
              <p className="text-gray-600 mb-6">
                {results.status === 'timed_out'
                  ? 'Your test was auto-submitted when time ran out.'
                  : passed
                    ? `You passed the ${testTitle.toLowerCase()}.`
                    : `You need ${settings?.pass_mark || 50}% to pass.`}
              </p>

              <div className="text-5xl font-bold mb-2" style={{ color: passed ? '#059669' : '#d97706' }}>
                {results.score} / {results.total_questions}
              </div>
              <p className="text-sm text-gray-500 mb-8">
                {results.percentage.toFixed(1)}%
              </p>

              {/* Review section */}
              {(results.show_wrong_answers || results.show_correct_answers) && results.review && (
                <div className="text-left space-y-3 mb-8">
                  <h3 className="font-semibold text-gray-900 text-sm">Review</h3>
                  {results.review.map((r, i) => {
                    const q = questions.find(q => q.id === r.question_id);
                    if (!q) return null;
                    return (
                      <div key={r.question_id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start gap-2">
                          {r.is_correct ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{i + 1}. {q.question_text}</p>
                            {!r.is_correct && results.show_wrong_answers && r.your_answer && (
                              <p className="text-xs text-red-600 mt-1">Your answer: {r.your_answer}</p>
                            )}
                            {results.show_correct_answers && r.correct_answer && (
                              <p className="text-xs text-emerald-600 mt-0.5">Correct: {r.correct_answer}</p>
                            )}
                            {results.show_explanations && r.explanation && (
                              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{r.explanation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <Link to="/student"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-all">
                  <BookOpen className="h-4 w-4" /> Back to Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // No questions
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6e8]">
        <div className="text-center max-w-md mx-auto px-4">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-500 text-sm mb-6">The question bank is empty for this test.</p>
          <Link to="/student" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            ← Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  // Test-taking screen
  return (
    <>
      <Helmet>
        <title>{`${testTitle} — Question ${currentIndex + 1}`}</title>
      </Helmet>
      <div className="min-h-screen bg-[#fdf6e8]">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">{testTitle}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {answeredCount}/{questions.length} answered
              </span>
              <span className={`inline-flex items-center gap-1 text-sm font-mono font-bold px-2 py-1 rounded-lg ${
                isTimeCritical ? 'bg-red-100 text-red-700 animate-pulse' :
                isTimeWarning ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-amber-100">
            <div className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Question number & type badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-gray-500">Q{currentIndex + 1} of {questions.length}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              currentQuestion.question_type === 'mcq' ? 'bg-indigo-100 text-indigo-700' :
              currentQuestion.question_type === 'true_false' ? 'bg-blue-100 text-blue-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              {currentQuestion.question_type === 'mcq' ? 'MCQ' :
               currentQuestion.question_type === 'true_false' ? 'True/False' : 'Short Answer'}
            </span>
            {currentQuestion.section_tag && (
              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {currentQuestion.section_tag}
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
            {currentQuestion.question_text}
          </h2>

          {/* MCQ / True-False Options */}
          {(currentQuestion.question_type === 'mcq' || currentQuestion.question_type === 'true_false') && (
            <div className="space-y-3 mb-6">
              {(currentQuestion.options || []).map((opt, idx) => {
                const letter = opt.letter || String.fromCharCode(65 + idx);
                const isSelected = selectedAnswer === letter;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(letter)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
                    } ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isSelected ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base text-gray-800 leading-relaxed pt-0.5">
                        {opt.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Short Answer Input */}
          {currentQuestion.question_type === 'short_answer' && (
            <div className="mb-6">
              <input
                type="text"
                value={shortAnswerText}
                onChange={(e) => setShortAnswerText(e.target.value)}
                disabled={hasAnswered}
                placeholder="Type your answer..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-amber-400 focus:ring-0 disabled:bg-gray-50"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentIndex === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ← Previous
            </button>

            <div className="flex gap-3">
              {!hasAnswered ? (
                <button
                  onClick={handleConfirmAnswer}
                  disabled={currentQuestion.question_type === 'short_answer' ? !shortAnswerText.trim() : !selectedAnswer}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                    (currentQuestion.question_type === 'short_answer' ? shortAnswerText.trim() : selectedAnswer)
                      ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Confirm
                </button>
              ) : currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 shadow-sm inline-flex items-center gap-2 transition-all"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (answeredCount < questions.length) {
                      if (!confirm(`You've answered ${answeredCount} of ${questions.length} questions. Submit anyway?`)) return;
                    }
                    handleSubmit(false);
                  }}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 shadow-sm inline-flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Test'}
                </button>
              )}
            </div>
          </div>

          {/* Question navigator dots */}
          <div className="flex flex-wrap gap-1.5 mt-8 justify-center">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setSelectedAnswer(answers[q.id] || null);
                  setShortAnswerText(answers[q.id] || '');
                  setHasAnswered(!!answers[q.id]);
                }}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  idx === currentIndex
                    ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                    : answers[q.id]
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
