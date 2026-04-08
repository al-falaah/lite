import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Plus, Edit, Trash2, Save, X, AlertTriangle, CheckCircle, HelpCircle, ToggleLeft, Type } from 'lucide-react';
import { toast } from 'sonner';
import { PROGRAMS } from '../../config/programs';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice', icon: HelpCircle },
  { value: 'true_false', label: 'True / False', icon: ToggleLeft },
  { value: 'short_answer', label: 'Short Answer', icon: Type },
];

export default function TestQuestionManager({ selectedProgram, settings }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('milestone'); // milestone | final_exam
  const [selectedMilestone, setSelectedMilestone] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionCounts, setQuestionCounts] = useState({}); // { "milestone_0": 12, "final_exam": 8 }

  const program = PROGRAMS[selectedProgram];
  const milestones = program?.milestones || [];

  useEffect(() => {
    if (selectedProgram) {
      fetchQuestionCounts();
      fetchQuestions();
    }
  }, [selectedProgram, selectedType, selectedMilestone]);

  const fetchQuestionCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select('type, milestone_index')
        .eq('program_id', selectedProgram);

      if (error) throw error;

      const counts = {};
      (data || []).forEach(q => {
        const key = q.type === 'milestone' ? `milestone_${q.milestone_index}` : 'final_exam';
        counts[key] = (counts[key] || 0) + 1;
      });
      setQuestionCounts(counts);
    } catch (error) {
      console.error('Error fetching question counts:', error);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('test_questions')
        .select('*')
        .eq('program_id', selectedProgram)
        .eq('type', selectedType)
        .order('created_at');

      if (selectedType === 'milestone') {
        query = query.eq('milestone_index', selectedMilestone);
      }

      const { data, error } = await query;
      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      question_text: '',
      question_type: 'mcq',
      options: [
        { letter: 'A', text: '' },
        { letter: 'B', text: '' },
        { letter: 'C', text: '' },
        { letter: 'D', text: '' },
      ],
      correct_answer: 'A',
      explanation: '',
      difficulty: 'medium',
      section_tag: '',
    });
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;

    if (!editingQuestion.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }

    // Validate based on question type
    if (editingQuestion.question_type === 'mcq') {
      const hasEmptyOptions = editingQuestion.options.some(o => !o.text.trim());
      if (hasEmptyOptions) {
        toast.error('All options must have text');
        return;
      }
    }

    if (editingQuestion.question_type === 'short_answer' && !editingQuestion.correct_answer.trim()) {
      toast.error('Correct answer is required for short answer questions');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const questionData = {
        program_id: selectedProgram,
        type: selectedType,
        milestone_index: selectedType === 'milestone' ? selectedMilestone : null,
        question_text: editingQuestion.question_text,
        question_type: editingQuestion.question_type,
        options: editingQuestion.question_type === 'short_answer' ? [] : editingQuestion.options,
        correct_answer: editingQuestion.correct_answer,
        explanation: editingQuestion.explanation || null,
        difficulty: editingQuestion.difficulty,
        section_tag: editingQuestion.section_tag || null,
      };

      if (editingQuestion.id) {
        const { error } = await supabase
          .from('test_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);
        if (error) throw error;
        toast.success('Question updated');
      } else {
        const { error } = await supabase
          .from('test_questions')
          .insert({ ...questionData, created_by: user.id });
        if (error) throw error;
        toast.success('Question added');
      }

      setEditingQuestion(null);
      fetchQuestions();
      fetchQuestionCounts();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Delete this question?')) return;
    try {
      const { error } = await supabase
        .from('test_questions')
        .delete()
        .eq('id', questionId);
      if (error) throw error;
      toast.success('Question deleted');
      fetchQuestions();
      fetchQuestionCounts();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const getRequiredCount = () => {
    const programSettings = settings?.find(s => s.program_id === selectedProgram);
    return selectedType === 'milestone'
      ? (programSettings?.milestone_question_count || 25)
      : (programSettings?.exam_question_count || 50);
  };

  const currentKey = selectedType === 'milestone' ? `milestone_${selectedMilestone}` : 'final_exam';
  const currentCount = questionCounts[currentKey] || 0;
  const requiredCount = getRequiredCount();
  const hasEnoughQuestions = currentCount >= requiredCount;

  if (!selectedProgram || !program) {
    return (
      <div className="text-center py-12 text-gray-500">
        <HelpCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p>Select a program to manage questions</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Type selector */}
      <div className="flex gap-3">
        <button
          onClick={() => { setSelectedType('milestone'); setSelectedMilestone(0); setEditingQuestion(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedType === 'milestone'
              ? 'bg-slate-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Milestone Tests
        </button>
        <button
          onClick={() => { setSelectedType('final_exam'); setEditingQuestion(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedType === 'final_exam'
              ? 'bg-slate-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Final Exam
        </button>
      </div>

      {/* Milestone selector */}
      {selectedType === 'milestone' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {milestones.map((m, idx) => {
            const count = questionCounts[`milestone_${idx}`] || 0;
            const needed = getRequiredCount();
            const enough = count >= needed;
            return (
              <button
                key={idx}
                onClick={() => { setSelectedMilestone(idx); setEditingQuestion(null); }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedMilestone === idx
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="text-xs font-bold text-gray-500">Milestone {idx + 1}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  {enough ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  )}
                  <span className={`text-xs font-medium ${enough ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {count}/{needed} questions
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Status bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg ${
        hasEnoughQuestions ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
      }`}>
        <div className="flex items-center gap-2">
          {hasEnoughQuestions ? (
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          )}
          <span className="text-sm font-medium text-gray-900">
            {selectedType === 'milestone'
              ? `Milestone ${selectedMilestone + 1}: ${milestones[selectedMilestone]?.name}`
              : 'Final Exam'}
            {' '} — {currentCount} question{currentCount !== 1 ? 's' : ''} in bank
            {!hasEnoughQuestions && ` (need at least ${requiredCount})`}
          </span>
        </div>
        <button
          onClick={handleAddQuestion}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900"
        >
          <Plus className="h-3.5 w-3.5" /> Add Question
        </button>
      </div>

      {/* Question editor */}
      {editingQuestion && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="font-bold text-gray-900">
              {editingQuestion.id ? 'Edit Question' : 'New Question'}
            </h4>
            <div className="flex gap-2">
              <button onClick={handleSaveQuestion}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900">
                <Save className="h-3.5 w-3.5" /> Save
              </button>
              <button onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map(qt => (
                <button
                  key={qt.value}
                  onClick={() => {
                    const updates = { question_type: qt.value };
                    if (qt.value === 'true_false') {
                      updates.options = [
                        { letter: 'A', text: 'True' },
                        { letter: 'B', text: 'False' },
                      ];
                      updates.correct_answer = 'A';
                    } else if (qt.value === 'mcq') {
                      updates.options = [
                        { letter: 'A', text: '' },
                        { letter: 'B', text: '' },
                        { letter: 'C', text: '' },
                        { letter: 'D', text: '' },
                      ];
                      updates.correct_answer = 'A';
                    } else {
                      updates.options = [];
                      updates.correct_answer = '';
                    }
                    setEditingQuestion({ ...editingQuestion, ...updates });
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    editingQuestion.question_type === qt.value
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <qt.icon className="h-3.5 w-3.5" />
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <textarea rows={2} value={editingQuestion.question_text}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>

          {/* MCQ Options */}
          {editingQuestion.question_type === 'mcq' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              {(editingQuestion.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    editingQuestion.correct_answer === opt.letter
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {opt.letter}
                  </span>
                  <input type="text" value={opt.text}
                    onChange={(e) => {
                      const newOpts = [...editingQuestion.options];
                      newOpts[idx] = { ...newOpts[idx], text: e.target.value };
                      setEditingQuestion({ ...editingQuestion, options: newOpts });
                    }}
                    placeholder={`Option ${opt.letter}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <button
                    onClick={() => setEditingQuestion({ ...editingQuestion, correct_answer: opt.letter })}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium ${
                      editingQuestion.correct_answer === opt.letter
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    {editingQuestion.correct_answer === opt.letter ? 'Correct' : 'Set correct'}
                  </button>
                  {editingQuestion.options.length > 2 && (
                    <button
                      onClick={() => {
                        const newOpts = editingQuestion.options.filter((_, i) => i !== idx)
                          .map((o, i) => ({ ...o, letter: String.fromCharCode(65 + i) }));
                        const updates = { options: newOpts };
                        if (!newOpts.find(o => o.letter === editingQuestion.correct_answer)) {
                          updates.correct_answer = newOpts[0]?.letter || 'A';
                        }
                        setEditingQuestion({ ...editingQuestion, ...updates });
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {editingQuestion.options.length < 6 && (
                <button
                  onClick={() => {
                    const nextLetter = String.fromCharCode(65 + editingQuestion.options.length);
                    setEditingQuestion({
                      ...editingQuestion,
                      options: [...editingQuestion.options, { letter: nextLetter, text: '' }]
                    });
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-1"
                >
                  + Add option
                </button>
              )}
            </div>
          )}

          {/* True/False Options */}
          {editingQuestion.question_type === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
              <div className="flex gap-3">
                {['A', 'B'].map(letter => (
                  <button
                    key={letter}
                    onClick={() => setEditingQuestion({ ...editingQuestion, correct_answer: letter })}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      editingQuestion.correct_answer === letter
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {letter === 'A' ? 'True' : 'False'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Short Answer */}
          {editingQuestion.question_type === 'short_answer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Answer <span className="text-xs text-gray-400">(case-insensitive match)</span>
              </label>
              <input type="text" value={editingQuestion.correct_answer}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })}
                placeholder="Type the expected answer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (optional)</label>
            <textarea rows={2} value={editingQuestion.explanation || ''}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>

          {/* Difficulty & Section Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select value={editingQuestion.difficulty}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Tag</label>
              <input type="text" value={editingQuestion.section_tag || ''}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, section_tag: e.target.value })}
                placeholder="e.g. Letter Recognition"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Questions list */}
      {!editingQuestion && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <HelpCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No questions yet</p>
              <p className="text-sm mt-1">Add questions to build the question bank</p>
            </div>
          ) : (
            questions.map((q, idx) => (
              <div key={q.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.question_text}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        q.question_type === 'mcq' ? 'bg-indigo-100 text-indigo-700' :
                        q.question_type === 'true_false' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {q.question_type === 'mcq' ? 'MCQ' : q.question_type === 'true_false' ? 'T/F' : 'Short'}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        q.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{q.difficulty}</span>
                      {q.section_tag && <span className="text-xs text-gray-500">{q.section_tag}</span>}
                      <span className="text-xs text-emerald-600 font-medium">Answer: {q.correct_answer}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => setEditingQuestion(q)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
