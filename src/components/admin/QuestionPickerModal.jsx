import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { X, Search, Check } from 'lucide-react';

/**
 * Modal for picking questions from the milestone's existing test_questions bank.
 * onPick is called with an array of selected questions (full rows).
 */
export default function QuestionPickerModal({
  programId,
  milestoneIndex,
  type, // 'milestone' or 'final_exam'
  alreadyPickedIds = [],
  onPick,
  onClose,
}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchQuestions();
  }, [programId, milestoneIndex, type]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('test_questions')
        .select('id, question_text, question_type, options, difficulty, section_tag, milestone_index')
        .eq('program_id', programId);
      if (type === 'milestone') {
        query = query.eq('milestone_index', milestoneIndex);
      } else {
        // For final exam, allow picking from any milestone
        query = query.not('milestone_index', 'is', null);
      }
      const { data, error } = await query.order('milestone_index').order('id');
      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const picked = questions.filter((q) => selectedIds.includes(q.id));
    onPick(picked);
  };

  const filtered = questions.filter((q) => {
    if (alreadyPickedIds.includes(q.id)) return false;
    if (!search.trim()) return true;
    return q.question_text?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-3">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Pick from question bank</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {type === 'milestone' ? `Milestone ${milestoneIndex + 1} questions` : 'All milestone questions'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="text-center text-gray-500 py-8 text-sm">Loading questions…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              {questions.length === 0 ? 'No questions in the bank for this milestone yet.' : 'No matches.'}
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((q) => {
                const checked = selectedIds.includes(q.id);
                return (
                  <li key={q.id}>
                    <button
                      onClick={() => toggleSelect(q.id)}
                      className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                        checked ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            checked ? 'bg-orange-600 border-orange-600' : 'border-gray-300'
                          }`}
                        >
                          {checked && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900 leading-snug">{q.question_text}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {q.milestone_index != null && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                M{q.milestone_index + 1}
                              </span>
                            )}
                            {q.difficulty && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {q.difficulty}
                              </span>
                            )}
                            {q.section_tag && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {q.section_tag}
                              </span>
                            )}
                            {q.question_type && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {q.question_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {selectedIds.length} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
