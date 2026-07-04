// Tajweed Test Runner — /tools/tajweed-test
//
// Three views wired to sub-routes:
//   /tools/tajweed-test                         → Setup (topic pick, students, count)
//   /tools/tajweed-test/:sessionId/present      → Live present mode (grid, ayah, scoring)
//   /tools/tajweed-test/:sessionId/results      → Leaderboard + CSV/print
//
// Data model:
//   - tajweed_test_sessions:  the config + drawn question pool
//   - tajweed_test_answers:   one row per (session, student, question)
//
// The question pool is drawn at Start-time from quran_tajweed_aya using each
// selected topic's search_ar patterns (same query pattern as Shawaahid). The
// pool is stored as JSONB inside the session row so the numbered ayat stay
// stable throughout the session — no live re-fetching.

import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams, Routes, Route } from 'react-router-dom';
import { ArrowLeft, Play, Users, Hash, ListChecks, Download, Printer, RotateCcw } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { TAJWEED_CATEGORIES } from '../../utils/topicMap';
import { normalizeUthmani } from '../../utils/uthmani';

// ---------- Surah names (matches other tools) ----------
const SURAH_NAMES = {
  1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: 'Aal-Imran', 4: 'An-Nisa', 5: 'Al-Maidah',
  6: "Al-An'am", 7: "Al-A'raf", 8: 'Al-Anfal', 9: 'At-Tawbah', 10: 'Yunus',
  11: 'Hud', 12: 'Yusuf', 13: "Ar-Ra'd", 14: 'Ibrahim', 15: 'Al-Hijr',
  16: 'An-Nahl', 17: 'Al-Isra', 18: 'Al-Kahf', 19: 'Maryam', 20: 'Ta-Ha',
  21: 'Al-Anbiya', 22: 'Al-Hajj', 23: "Al-Mu'minun", 24: 'An-Nur', 25: 'Al-Furqan',
  26: "Ash-Shu'ara", 27: 'An-Naml', 28: 'Al-Qasas', 29: 'Al-Ankabut', 30: 'Ar-Rum',
  31: 'Luqman', 32: 'As-Sajdah', 33: 'Al-Ahzab', 34: 'Saba', 35: 'Fatir',
  36: 'Ya-Sin', 37: 'As-Saffat', 38: 'Sad', 39: 'Az-Zumar', 40: 'Ghafir',
  41: 'Fussilat', 42: 'Ash-Shura', 43: 'Az-Zukhruf', 44: 'Ad-Dukhan', 45: 'Al-Jathiyah',
  46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'Al-Fath', 49: 'Al-Hujurat', 50: 'Qaf',
  51: 'Adh-Dhariyat', 52: 'At-Tur', 53: 'An-Najm', 54: 'Al-Qamar', 55: 'Ar-Rahman',
  56: "Al-Waqi'ah", 57: 'Al-Hadid', 58: 'Al-Mujadilah', 59: 'Al-Hashr', 60: 'Al-Mumtahanah',
  61: 'As-Saff', 62: "Al-Jumu'ah", 63: 'Al-Munafiqun', 64: 'At-Taghabun', 65: 'At-Talaq',
  66: 'At-Tahrim', 67: 'Al-Mulk', 68: 'Al-Qalam', 69: 'Al-Haqqah', 70: "Al-Ma'arij",
  71: 'Nuh', 72: 'Al-Jinn', 73: 'Al-Muzzammil', 74: 'Al-Muddaththir', 75: 'Al-Qiyamah',
  76: 'Al-Insan', 77: 'Al-Mursalat', 78: 'An-Naba', 79: "An-Nazi'at", 80: "'Abasa",
  81: 'At-Takwir', 82: 'Al-Infitar', 83: 'Al-Mutaffifin', 84: 'Al-Inshiqaq', 85: 'Al-Buruj',
  86: 'At-Tariq', 87: "Al-A'la", 88: 'Al-Ghashiyah', 89: 'Al-Fajr', 90: 'Al-Balad',
  91: 'Ash-Shams', 92: 'Al-Layl', 93: 'Ad-Duha', 94: 'Ash-Sharh', 95: 'At-Tin',
  96: 'Al-Alaq', 97: 'Al-Qadr', 98: 'Al-Bayyinah', 99: 'Az-Zalzalah', 100: 'Al-Adiyat',
  101: "Al-Qari'ah", 102: 'At-Takathur', 103: 'Al-Asr', 104: 'Al-Humazah', 105: 'Al-Fil',
  106: 'Quraysh', 107: "Al-Ma'un", 108: 'Al-Kawthar', 109: 'Al-Kafirun', 110: 'An-Nasr',
  111: 'Al-Masad', 112: 'Al-Ikhlas', 113: 'Al-Falaq', 114: 'An-Nas',
};

// Flatten TAJWEED_CATEGORIES into a topic-lookup for O(1) name access
const TOPIC_BY_ID = TAJWEED_CATEGORIES
  .flatMap((cat) => cat.topics.map((t) => ({ ...t, _category_en: cat.name_en })))
  .reduce((acc, t) => { acc[t.id] = t; return acc; }, {});

// ---------- Router root ----------
export default function TajweedTest() {
  return (
    <Routes>
      <Route index element={<Setup />} />
      <Route path=":sessionId/present" element={<Present />} />
      <Route path=":sessionId/results" element={<Results />} />
    </Routes>
  );
}

// ============================================================================
// View 1: Setup — teacher configures the session
// ============================================================================
function Setup() {
  const navigate = useNavigate();
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState(new Set());
  const [questionCount, setQuestionCount] = useState(20);
  const [maxPoints, setMaxPoints] = useState(3);
  const [questionsPerStudent, setQuestionsPerStudent] = useState(1);
  const [studentsRaw, setStudentsRaw] = useState('');
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleTopic = (id) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCategoryAll = (category) => {
    const ids = category.topics.map((t) => t.id);
    const allSelected = ids.every((id) => selectedTopicIds.has(id));
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const studentList = useMemo(
    () =>
      studentsRaw
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    [studentsRaw]
  );

  const canStart =
    className.trim().length > 0 &&
    selectedTopicIds.size > 0 &&
    studentList.length > 0 &&
    questionCount > 0;

  const handleStart = async () => {
    setErrorMsg('');
    if (!canStart) return;
    setStarting(true);
    try {
      // 1. Draw the question pool.
      // For each selected topic, use its search_ar patterns to find ayat that
      // mention that rule in quran_tajweed_aya.content. We pull a big candidate
      // set then randomly sample down to questionCount.
      const selectedTopics = [...selectedTopicIds]
        .map((id) => TOPIC_BY_ID[id])
        .filter(Boolean);

      // Build an OR filter across every search term of every selected topic.
      const orTerms = selectedTopics.flatMap((t) => t.search_ar || []);
      if (orTerms.length === 0) {
        throw new Error('The selected topics have no search patterns.');
      }
      const orFilter = orTerms.map((t) => `content.ilike.%${t}%`).join(',');

      // Pull a candidate window big enough to give the teacher good variety.
      const CANDIDATE_LIMIT = Math.max(200, questionCount * 4);
      const { data: candidateRows, error: qErr } = await supabase
        .from('quran_tajweed_aya')
        .select('sura_number, aya_number, aya_text, content')
        .or(orFilter)
        .limit(CANDIDATE_LIMIT);
      if (qErr) throw qErr;
      if (!candidateRows || candidateRows.length === 0) {
        throw new Error('No ayat found for the selected topics. Try adding more topics.');
      }

      // For each row, figure out WHICH selected topic it matched. This is the
      // topic we display as "the rule to identify". If it matches multiple,
      // we pick one at random from the matches.
      const withTopic = candidateRows.map((r) => {
        const matches = selectedTopics.filter((t) =>
          (t.search_ar || []).some((term) => r.content && r.content.includes(term))
        );
        const chosen = matches[Math.floor(Math.random() * Math.max(1, matches.length))];
        return { ...r, topic_id: chosen ? chosen.id : null };
      }).filter((r) => r.topic_id);

      if (withTopic.length < questionCount) {
        throw new Error(
          `Only ${withTopic.length} ayat matched the selected topics — try adding more topics or reducing question count.`
        );
      }

      // Shuffle + slice
      const shuffled = withTopic.sort(() => Math.random() - 0.5).slice(0, questionCount);
      const questionPool = shuffled.map((r, i) => ({
        number: i + 1,
        sura_number: r.sura_number,
        aya_number: r.aya_number,
        aya_text: r.aya_text,
        topic_id: r.topic_id,
      }));

      // 2. Insert the session
      const { data: session, error: sErr } = await supabase
        .from('tajweed_test_sessions')
        .insert({
          teacher_name: teacherName || null,
          class_name: className.trim(),
          topic_ids: [...selectedTopicIds],
          student_names: studentList,
          question_count: questionCount,
          max_points_per_q: maxPoints,
          questions_per_student: questionsPerStudent,
          question_pool: questionPool,
        })
        .select('id')
        .single();
      if (sErr) throw sErr;

      // 3. Jump to Present
      navigate(`/tools/tajweed-test/${session.id}/present`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to start session. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Tajweed Test Runner | The FastTrack Madrasah</title>
        <meta name="description" content="Run a live tajweed quiz session. Configure topics, add students, and score answers on the fly — with printable results." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            to="/tools"
            className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            All tools
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tajweed Test Runner</h1>
            <p className="text-gray-600">
              Configure a live quiz session, then present it to your class. Students take
              turns picking numbers; you score answers on the fly. Results are printable.
            </p>
          </div>

          {/* How to use — collapsed by default */}
          <details className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 group">
            <summary className="cursor-pointer text-sm font-semibold text-emerald-900 flex items-center gap-2 select-none">
              <span className="inline-block transform transition-transform group-open:rotate-90">▸</span>
              How to use
            </summary>
            <div className="mt-4 space-y-4 text-sm text-emerald-900">
              <div>
                <p className="font-semibold mb-1">1. Set up the session (this page)</p>
                <ul className="list-disc pl-5 space-y-1 text-emerald-800">
                  <li>Give the session a class name (e.g. <em>Advanced Tajweed — Week 8</em>).</li>
                  <li>Pick the tajweed topics you want to test. You can select a whole category or individual topics.</li>
                  <li>Set the total number of questions, the questions each student should answer in a row, and the max points per question.</li>
                  <li>Add the student names — one per line, in the order they'll go.</li>
                  <li>Click <strong>Start Session</strong> — the tool draws random ayat from the Qurʾān that match the topics you picked.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">2. Run the session (next page)</p>
                <p className="text-emerald-800 mb-2">
                  The projected screen shows a grid of numbers and the current student's name. Ask the student to pick a number — you click it to open the ayah full-screen. You then have two ways to run the question:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-emerald-800">
                  <li>
                    <strong>Option A — Recite whole, then rule on a chosen part.</strong>
                    Ask the student to recite the whole ayah. Then click one or more words to highlight the portion you want to ask about, and ask them to name the tajweed rule in that portion.
                  </li>
                  <li>
                    <strong>Option B — Highlight first, then recite that part.</strong>
                    Click words to highlight the portion first. Ask the student to recite only that highlighted portion aloud, and to name the tajweed rule in it.
                  </li>
                </ul>
                <p className="text-emerald-800 mt-2">
                  When you're ready, use the score buttons (0 to your chosen max) to score the answer. The scoring panel has a "Reveal rule (teacher only)" toggle in case you need to check what topic the ayah matched.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">3. Finish and export</p>
                <p className="text-emerald-800">
                  When the session ends, click <strong>End session</strong> to go to the leaderboard. From there you can download a CSV or print the results.
                </p>
              </div>
            </div>
          </details>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
            {/* Class name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class / session name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Advanced Tajweed — Week 8"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Teacher name (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teacher name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Ustadh / Ustadhah…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Topic multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which tajweed topics? <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  {selectedTopicIds.size} selected
                </span>
              </label>
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto divide-y divide-gray-100">
                {TAJWEED_CATEGORIES.map((cat) => {
                  const catIds = cat.topics.map((t) => t.id);
                  const allSel = catIds.every((id) => selectedTopicIds.has(id));
                  const someSel = catIds.some((id) => selectedTopicIds.has(id));
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{cat.name_en}</div>
                          <div className="text-xs text-gray-500 font-arabic" dir="rtl">{cat.name_ar}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCategoryAll(cat)}
                          className="text-xs text-emerald-700 hover:text-emerald-800 font-medium whitespace-nowrap"
                        >
                          {allSel ? 'Deselect all' : someSel ? 'Select all' : 'Select all'}
                        </button>
                      </div>
                      <div className="p-2 grid sm:grid-cols-2 gap-1">
                        {cat.topics.map((topic) => {
                          const checked = selectedTopicIds.has(topic.id);
                          return (
                            <label
                              key={topic.id}
                              className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                                checked ? 'bg-emerald-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleTopic(topic.id)}
                                className="mt-0.5 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                              />
                              <span>
                                <span className="text-gray-800">{topic.name_en}</span>
                                <span className="text-gray-500 font-arabic ml-1" dir="rtl">
                                  ({topic.name_ar})
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question count + questions per student + max points */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.max(1, Math.min(200, Number(e.target.value) || 0)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">The pool students pick from (1..N).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per student
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={questionsPerStudent}
                  onChange={(e) => setQuestionsPerStudent(Math.max(1, Math.min(50, Number(e.target.value) || 0)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">Questions each student answers in a row before rotating.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max points per question
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(Math.max(1, Math.min(10, Number(e.target.value) || 0)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default 3 — one per recitation quality tier.</p>
              </div>
            </div>

            {/* Students */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Students <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  {studentList.length} name{studentList.length === 1 ? '' : 's'}
                </span>
              </label>
              <textarea
                value={studentsRaw}
                onChange={(e) => setStudentsRaw(e.target.value)}
                placeholder="One name per line (or comma-separated)"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Students take turns in this order.</p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              disabled={!canStart || starting}
              onClick={handleStart}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white transition-colors ${
                canStart && !starting
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <Play className="h-5 w-5" />
              {starting ? 'Preparing questions…' : 'Start Session'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// View 2: Present — live projected view
// ============================================================================
function Present() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);           // rows from tajweed_test_answers
  const [loading, setLoading] = useState(true);
  const [currentStudentIdx, setCurrentStudentIdx] = useState(0);
  const [currentStudentAnsweredCount, setCurrentStudentAnsweredCount] = useState(0);
  const [openQuestionNumber, setOpenQuestionNumber] = useState(null);
  const [highlightedWordSet, setHighlightedWordSet] = useState(new Set()); // per-open-question
  const [pointsPending, setPointsPending] = useState(null);
  const [notesPending, setNotesPending] = useState('');
  const [savingScore, setSavingScore] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load session + answers
  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: s, error: sErr } = await supabase
        .from('tajweed_test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (sErr) throw sErr;
      setSession(s);
      const { data: a, error: aErr } = await supabase
        .from('tajweed_test_answers')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (aErr) throw aErr;
      setAnswers(a || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load session.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  const usedNumbers = useMemo(
    () => new Set(answers.map((a) => a.question_index)),
    [answers]
  );

  const studentNames = session?.student_names || [];
  const currentStudent = studentNames[currentStudentIdx] || null;

  const openQuestion = useMemo(() => {
    if (!session || openQuestionNumber == null) return null;
    return session.question_pool.find((q) => q.number === openQuestionNumber) || null;
  }, [session, openQuestionNumber]);

  const openQuestionTopic = openQuestion ? TOPIC_BY_ID[openQuestion.topic_id] : null;

  // Split the ayah into words. QCF Uthmani tanwīn marks are normalised to
  // standard Arabic tanwīn (see src/utils/uthmani.js) so they render in
  // Amiri Quran without silently changing grammatical case.
  const ayahWords = useMemo(() => {
    if (!openQuestion?.aya_text) return [];
    return normalizeUthmani(openQuestion.aya_text.trim()).split(/\s+/);
  }, [openQuestion]);

  const toggleWord = (idx) => {
    setHighlightedWordSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const handleOpenNumber = (n) => {
    if (usedNumbers.has(n)) return;
    setOpenQuestionNumber(n);
    setHighlightedWordSet(new Set());
    setPointsPending(null);
    setNotesPending('');
  };

  const handleClose = () => {
    setOpenQuestionNumber(null);
    setHighlightedWordSet(new Set());
    setPointsPending(null);
    setNotesPending('');
  };

  const handleSaveScore = async () => {
    if (!openQuestion || pointsPending == null || !currentStudent) return;
    setSavingScore(true);
    try {
      const { error } = await supabase
        .from('tajweed_test_answers')
        .insert({
          session_id: sessionId,
          student_name: currentStudent,
          question_index: openQuestion.number,
          sura_number: openQuestion.sura_number,
          aya_number: openQuestion.aya_number,
          topic_id: openQuestion.topic_id,
          points_awarded: pointsPending,
          notes: notesPending || null,
        });
      if (error) throw error;
      // Only rotate to the next student once the current student has
      // answered their per-student allocation. Otherwise stay on them.
      // Don't loop back to the first student after the last one finishes —
      // clamp at the end so the teacher can end the session naturally.
      const perStudent = session.questions_per_student || 1;
      const newCount = currentStudentAnsweredCount + 1;
      if (newCount >= perStudent) {
        if (currentStudentIdx < studentNames.length - 1) {
          setCurrentStudentIdx(currentStudentIdx + 1);
          setCurrentStudentAnsweredCount(0);
        } else {
          // Last student's last question — stay here; the teacher can end
          // the session with the End button.
          setCurrentStudentAnsweredCount(newCount);
        }
      } else {
        setCurrentStudentAnsweredCount(newCount);
      }
      handleClose();
      await load();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save score.');
    } finally {
      setSavingScore(false);
    }
  };

  const handleEndSession = async () => {
    if (!window.confirm('End the session and go to results? You can still add more answers afterwards.')) return;
    try {
      await supabase
        .from('tajweed_test_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (err) {
      console.error(err);
    }
    navigate(`/tools/tajweed-test/${sessionId}/results`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading session…
      </div>
    );
  }
  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 px-4 text-center">
        {errorMsg}
      </div>
    );
  }
  if (!session) return null;

  const pool = session.question_pool || [];
  const maxPts = session.max_points_per_q || 3;

  return (
    <>
      <Helmet>
        <title>{session.class_name} | Tajweed Test</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Live session</div>
              <div className="font-bold text-gray-900 text-lg">{session.class_name}</div>
              {session.teacher_name && (
                <div className="text-xs text-gray-500">Teacher: {session.teacher_name}</div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  Student {currentStudentIdx + 1} of {studentNames.length}
                </div>
                <div className="text-emerald-700 font-bold text-lg">
                  {currentStudent || '—'}
                </div>
                {(session.questions_per_student || 1) > 1 && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    Q {Math.min(currentStudentAnsweredCount + 1, session.questions_per_student)} of {session.questions_per_student} for this student
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={currentStudentIdx >= studentNames.length - 1}
                onClick={() => {
                  if (currentStudentIdx < studentNames.length - 1) {
                    setCurrentStudentIdx(currentStudentIdx + 1);
                    setCurrentStudentAnsweredCount(0);
                  }
                }}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Skip to next student without scoring"
              >
                Skip →
              </button>
              <button
                type="button"
                onClick={handleEndSession}
                className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-900"
              >
                End session
              </button>
            </div>
          </div>
        </div>

        {openQuestion ? (
          // ------ Open question view ------
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Question {openQuestion.number} / {pool.length}
                </div>
                <div className="text-sm text-gray-700">
                  {SURAH_NAMES[openQuestion.sura_number]} · {openQuestion.sura_number}:{openQuestion.aya_number}
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to grid
              </button>
            </div>

            {/* Ayah with tap-to-highlight words */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 sm:p-10 mb-6">
              <div
                dir="rtl"
                className="font-arabic text-3xl sm:text-5xl text-gray-900 text-center select-none"
                style={{ lineHeight: '2.6' }}
              >
                {ayahWords.map((w, i) => (
                  <span
                    key={i}
                    onClick={() => toggleWord(i)}
                    className={`inline-block px-2 py-1 mx-1 my-1 rounded cursor-pointer transition-colors ${
                      highlightedWordSet.has(i)
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'hover:bg-emerald-50'
                    }`}
                  >
                    {w}
                  </span>
                ))}
              </div>
              <p className="text-center text-xs text-gray-500 mt-6">
                Click any word to highlight it. Click again to un-highlight.
              </p>
            </div>

            {/* Prompt */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
              <div className="font-semibold text-amber-900 mb-1">Prompt</div>
              <div className="text-amber-800 text-sm">
                Recite this ayah correctly and identify the tajweed rule in the highlighted words.
              </div>
            </div>

            {/* Score buttons */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-sm font-semibold text-gray-800">
                  Score {currentStudent ? `${currentStudent}'s` : 'this'} answer
                </div>
                {openQuestionTopic && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">Reveal rule (teacher only)</summary>
                    <div className="mt-1 text-right">
                      {openQuestionTopic.name_en}
                      <span dir="rtl" className="font-arabic ml-1">({openQuestionTopic.name_ar})</span>
                    </div>
                  </details>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.from({ length: maxPts + 1 }, (_, i) => i).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPointsPending(p)}
                    className={`px-5 py-3 rounded-lg font-bold text-lg border-2 transition-colors ${
                      pointsPending === p
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <label className="block text-xs text-gray-600 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={notesPending}
                onChange={(e) => setNotesPending(e.target.value)}
                placeholder="e.g. confused ghunnah with iẓhār"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <button
                type="button"
                disabled={pointsPending == null || savingScore}
                onClick={handleSaveScore}
                className={`mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white transition-colors ${
                  pointsPending != null && !savingScore
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {(() => {
                  if (savingScore) return 'Saving…';
                  const perStudent = session.questions_per_student || 1;
                  const isLastAnswerForStudent = currentStudentAnsweredCount + 1 >= perStudent;
                  const isLastStudent = currentStudentIdx >= studentNames.length - 1;
                  if (isLastAnswerForStudent && isLastStudent) return 'Save & Finish';
                  if (isLastAnswerForStudent) return 'Save & Next Student';
                  return `Save & Next Question (${currentStudentAnsweredCount + 1}/${perStudent})`;
                })()}
              </button>
            </div>
          </div>
        ) : (
          // ------ Number grid view ------
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
            <div className="mb-4 text-center">
              <div className="text-lg text-gray-800 mb-1">
                Pick a number, <span className="font-bold text-emerald-700">{currentStudent}</span>.
              </div>
              <div className="text-xs text-gray-500">
                Answered {answers.length} of {pool.length} · Session ID: {sessionId.slice(0, 8)}…
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3">
              {pool.map((q) => {
                const used = usedNumbers.has(q.number);
                return (
                  <button
                    key={q.number}
                    type="button"
                    disabled={used}
                    onClick={() => handleOpenNumber(q.number)}
                    className={`aspect-square rounded-xl text-xl sm:text-2xl font-bold transition-all ${
                      used
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-500 shadow-sm'
                    }`}
                  >
                    {q.number}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// View 3: Results — leaderboard + CSV/print
// ============================================================================
function Results() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase
        .from('tajweed_test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      setSession(s);
      const { data: a } = await supabase
        .from('tajweed_test_answers')
        .select('*')
        .eq('session_id', sessionId);
      setAnswers(a || []);
      setLoading(false);
    })();
  }, [sessionId]);

  const perStudent = useMemo(() => {
    if (!session) return [];
    const students = session.student_names || [];
    const maxPts = session.max_points_per_q || 3;
    // Each student is graded against the questions they were ASSIGNED
    // (questions_per_student × max_points_per_q), not the whole pool.
    const assignedQuestions = session.questions_per_student || 1;
    const assignedMax = assignedQuestions * maxPts;
    return students
      .map((name) => {
        const rows = answers.filter((a) => a.student_name === name);
        const total = rows.reduce((s, r) => s + (r.points_awarded || 0), 0);
        return {
          name,
          total,
          score_percent: assignedMax > 0 ? Math.round((total / assignedMax) * 100) : 0,
          rows,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [session, answers]);

  const handleDownloadCsv = () => {
    if (!session) return;
    const rows = [
      ['Student', 'Points', 'Score'],
      ...perStudent.map((s) => [
        s.name,
        s.total,
        `${s.score_percent}%`,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.class_name.replace(/[^\w-]/g, '_')}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading results…
      </div>
    );
  }
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Session not found.
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Results — {session.class_name}</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 print:bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <Link
              to={`/tools/tajweed-test/${sessionId}/present`}
              className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to session
            </Link>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Download className="h-4 w-4" />
                Download CSV
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <Link
                to="/tools/tajweed-test"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />
                New session
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 print:shadow-none print:border-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{session.class_name}</h1>
            {session.teacher_name && (
              <div className="text-sm text-gray-600 mb-4">Teacher: {session.teacher_name}</div>
            )}
            <div className="text-xs text-gray-500 mb-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{(session.student_names || []).length} students</span>
              <span className="inline-flex items-center gap-1"><Hash className="h-3 w-3" />{session.question_count} questions</span>
              <span className="inline-flex items-center gap-1"><ListChecks className="h-3 w-3" />{session.max_points_per_q} pts max per Q</span>
              <span>Session {sessionId.slice(0, 8)}…</span>
            </div>

            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr className="text-left text-gray-600">
                  <th className="pb-2 pr-2">#</th>
                  <th className="pb-2 pr-2">Student</th>
                  <th className="pb-2 pr-2 text-right">Points</th>
                  <th className="pb-2 pr-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {perStudent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No answers recorded yet.
                    </td>
                  </tr>
                ) : (
                  perStudent.map((s, i) => (
                    <tr key={s.name} className="border-b border-gray-100">
                      <td className="py-2 pr-2 font-semibold text-gray-500">{i + 1}</td>
                      <td className="py-2 pr-2 font-medium text-gray-900">{s.name}</td>
                      <td className="py-2 pr-2 text-right font-bold text-emerald-700">{s.total}</td>
                      <td className="py-2 pr-2 text-right">{s.score_percent}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
