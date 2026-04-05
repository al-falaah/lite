import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../services/supabase';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, BookOpen, ChevronLeft } from 'lucide-react';

// Shuffle array (Fisher-Yates)
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function ChapterQuiz() {
  const { courseSlug, chapterSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [course, setCourse] = useState(null);
  const [chapter, setChapter] = useState(null);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answers, setAnswers] = useState({}); // { questionId: selectedLetter }
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [courseSlug, chapterSlug]);

  const fetchQuiz = async () => {
    try {
      // Get course
      const { data: courseData, error: courseErr } = await supabase
        .from('lesson_courses')
        .select('*')
        .eq('slug', courseSlug)
        .single();
      if (courseErr) throw courseErr;
      setCourse(courseData);

      // Get chapter
      const { data: chapterData, error: chapterErr } = await supabase
        .from('lesson_chapters')
        .select('*')
        .eq('course_id', courseData.id)
        .eq('slug', chapterSlug)
        .eq('is_published', true)
        .single();
      if (chapterErr) throw chapterErr;
      setChapter(chapterData);

      // Get quiz
      const { data: quizData, error: quizErr } = await supabase
        .from('lesson_quizzes')
        .select('*')
        .eq('chapter_id', chapterData.id)
        .eq('is_published', true)
        .single();
      if (quizErr) throw quizErr;
      setQuiz(quizData);

      // Get questions
      const { data: qData, error: qErr } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizData.id)
        .order('question_number');
      if (qErr) throw qErr;

      // Apply shuffle settings
      let processedQuestions = qData || [];
      if (quizData.shuffle_questions) {
        processedQuestions = shuffle(processedQuestions);
      }
      if (quizData.shuffle_options) {
        processedQuestions = processedQuestions.map(q => {
          const opts = [...q.options];
          const correctText = opts.find(o => o.startsWith(q.correct_answer + '.'));
          const shuffled = shuffle(opts);
          // Re-letter options and find new correct answer
          const reLettered = shuffled.map((text, i) => {
            const letter = String.fromCharCode(65 + i);
            return letter + '. ' + text.replace(/^[A-D]\.\s*/, '');
          });
          const newCorrectIdx = shuffled.indexOf(correctText);
          const newCorrectLetter = String.fromCharCode(65 + newCorrectIdx);
          return { ...q, options: reLettered, correct_answer: newCorrectLetter };
        });
      }
      setQuestions(processedQuestions);
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleSelect = (letter) => {
    if (hasAnswered) return;
    setSelectedAnswer(letter);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || hasAnswered) return;
    setHasAnswered(true);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedAnswer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const score = useMemo(() => {
    if (!finished) return 0;
    return questions.filter(q => answers[q.id] === q.correct_answer).length;
  }, [finished, questions, answers]);

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setAnswers({});
    setFinished(false);
    // Re-shuffle if enabled
    if (quiz?.shuffle_questions) setQuestions(shuffle(questions));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6e8]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6e8]">
        <div className="text-center max-w-md mx-auto px-4">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Quiz Not Available</h2>
          <p className="text-gray-500 text-sm mb-6">There's no quiz for this chapter yet.</p>
          <Link to={`/resources/${courseSlug}`} className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            ← Back to chapter
          </Link>
        </div>
      </div>
    );
  }

  // Results screen
  if (finished) {
    const passed = score >= quiz.passing_score;
    return (
      <>
        <Helmet>
          <title>Quiz Results — {quiz.title}</title>
        </Helmet>
        <div className="min-h-screen bg-[#fdf6e8] flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <div className={`rounded-2xl p-8 text-center ${passed ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-amber-50 border-2 border-amber-200'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                {passed ? <CheckCircle className="h-10 w-10 text-emerald-600" /> : <XCircle className="h-10 w-10 text-amber-600" />}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {passed ? 'Well Done!' : 'Keep Trying!'}
              </h2>
              <p className="text-gray-600 mb-6">
                {passed ? 'You passed the quiz.' : `You need ${quiz.passing_score} correct answers to pass.`}
              </p>

              <div className="text-5xl font-bold mb-2" style={{ color: passed ? '#059669' : '#d97706' }}>
                {score} / {questions.length}
              </div>
              <p className="text-sm text-gray-500 mb-8">
                {passed ? 'Correct answers' : `Passing score: ${quiz.passing_score}`}
              </p>

              {/* Question review */}
              <div className="text-left space-y-3 mb-8">
                {questions.map((q, i) => {
                  const isCorrect = answers[q.id] === q.correct_answer;
                  return (
                    <div key={q.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start gap-2">
                        {isCorrect ? <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{i + 1}. {q.question}</p>
                          {!isCorrect && (
                            <p className="text-xs text-red-600 mt-1">Your answer: {answers[q.id]} · Correct: {q.correct_answer}</p>
                          )}
                          {q.explanation && (
                            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{q.explanation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={handleRetry}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all">
                  <RotateCcw className="h-4 w-4" /> Try Again
                </button>
                <Link to={`/resources/${courseSlug}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-all">
                  <BookOpen className="h-4 w-4" /> Back to Chapter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Question screen
  const isCorrect = hasAnswered && selectedAnswer === currentQuestion.correct_answer;
  const isWrong = hasAnswered && selectedAnswer !== currentQuestion.correct_answer;

  return (
    <>
      <Helmet>
        <title>{quiz.title} — Question {currentIndex + 1}</title>
      </Helmet>
      <div className="min-h-screen bg-[#fdf6e8]">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to={`/resources/${courseSlug}`} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
              <ChevronLeft className="h-4 w-4" /> Back
            </Link>
            <span className="text-sm font-medium text-gray-900">{quiz.title}</span>
            <span className="text-sm text-gray-500">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-amber-100">
            <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${((currentIndex + (hasAnswered ? 1 : 0)) / questions.length) * 100}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Section tag */}
          {currentQuestion.section_tag && (
            <span className="inline-block text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full mb-4">
              {currentQuestion.section_tag}
            </span>
          )}

          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedAnswer === letter;
              const isThisCorrect = hasAnswered && letter === currentQuestion.correct_answer;
              const isThisWrong = hasAnswered && isSelected && letter !== currentQuestion.correct_answer;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(letter)}
                  disabled={hasAnswered}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isThisCorrect
                      ? 'border-emerald-400 bg-emerald-50'
                      : isThisWrong
                        ? 'border-red-400 bg-red-50'
                        : isSelected
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
                  } ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isThisCorrect ? 'bg-emerald-200 text-emerald-800' :
                      isThisWrong ? 'bg-red-200 text-red-800' :
                      isSelected ? 'bg-amber-200 text-amber-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {isThisCorrect ? <CheckCircle className="h-4 w-4" /> : isThisWrong ? <XCircle className="h-4 w-4" /> : letter}
                    </span>
                    <span className="text-sm sm:text-base text-gray-800 leading-relaxed pt-0.5">
                      {opt.replace(/^[A-D]\.\s*/, '')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {hasAnswered && currentQuestion.explanation && (
            <div className={`rounded-xl p-4 mb-6 border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <p className="text-sm font-semibold mb-1" style={{ color: isCorrect ? '#059669' : '#d97706' }}>
                {isCorrect ? 'Correct!' : 'Not quite.'}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end">
            {!hasAnswered ? (
              <button onClick={handleSubmitAnswer} disabled={!selectedAnswer}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedAnswer
                    ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}>
                Check Answer
              </button>
            ) : (
              <button onClick={handleNext}
                className="px-6 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 shadow-sm inline-flex items-center gap-2 transition-all">
                {currentIndex < questions.length - 1 ? (
                  <>Next <ArrowRight className="h-4 w-4" /></>
                ) : (
                  'See Results'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
