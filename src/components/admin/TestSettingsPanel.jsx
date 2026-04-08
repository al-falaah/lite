import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Save, Settings, Clock, Award, RotateCcw, Eye, EyeOff, MessageSquare, Mic, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { PROGRAMS } from '../../config/programs';

export default function TestSettingsPanel({ settings, onSettingsUpdate }) {
  const [saving, setSaving] = useState(null); // program_id being saved

  const handleChange = (programId, field, value) => {
    const updated = settings.map(s =>
      s.program_id === programId ? { ...s, [field]: value } : s
    );
    onSettingsUpdate(updated);
  };

  const handleTestModeChange = (programId, key, mode) => {
    const setting = settings.find(s => s.program_id === programId);
    if (!setting) return;
    const modes = { ...(setting.milestone_test_modes || {}) };
    if (mode === 'online') {
      delete modes[key]; // online is default, no need to store
    } else {
      modes[key] = mode;
    }
    handleChange(programId, 'milestone_test_modes', modes);
  };

  const handleSave = async (programId) => {
    const setting = settings.find(s => s.program_id === programId);
    if (!setting) return;

    // Validate weights sum to 100
    if (setting.milestone_test_weight + setting.final_exam_weight !== 100) {
      toast.error('Milestone weight + Final exam weight must equal 100%');
      return;
    }

    setSaving(programId);
    try {
      const { error } = await supabase
        .from('program_test_settings')
        .update({
          milestone_test_weight: setting.milestone_test_weight,
          final_exam_weight: setting.final_exam_weight,
          pass_mark: setting.pass_mark,
          milestone_question_count: setting.milestone_question_count,
          exam_question_count: setting.exam_question_count,
          milestone_time_limit: setting.milestone_time_limit,
          exam_time_limit: setting.exam_time_limit,
          allow_exam_retake: setting.allow_exam_retake,
          max_exam_retakes: setting.max_exam_retakes,
          show_correct_answers: setting.show_correct_answers,
          show_wrong_answers: setting.show_wrong_answers,
          show_explanations: setting.show_explanations,
          milestone_test_modes: setting.milestone_test_modes || {},
        })
        .eq('program_id', programId);

      if (error) throw error;
      toast.success(`Settings saved for ${PROGRAMS[programId]?.shortName || programId}`);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  if (!settings || settings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Settings className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {settings.map((setting) => {
        const program = PROGRAMS[setting.program_id];
        if (!program) return null;

        return (
          <div key={setting.program_id} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{program.name}</h3>
                <p className="text-sm text-gray-500">{program.shortName} · {program.milestones.length} milestones</p>
              </div>
              <button
                onClick={() => handleSave(setting.program_id)}
                disabled={saving === setting.program_id}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {saving === setting.program_id ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Weights & Pass Mark */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                  <Award className="h-3.5 w-3.5" /> Milestone Weight (%)
                </label>
                <input
                  type="number" min="0" max="100"
                  value={setting.milestone_test_weight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    handleChange(setting.program_id, 'milestone_test_weight', val);
                    handleChange(setting.program_id, 'final_exam_weight', 100 - val);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                  <Award className="h-3.5 w-3.5" /> Final Exam Weight (%)
                </label>
                <input
                  type="number" min="0" max="100"
                  value={setting.final_exam_weight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    handleChange(setting.program_id, 'final_exam_weight', val);
                    handleChange(setting.program_id, 'milestone_test_weight', 100 - val);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                  <Award className="h-3.5 w-3.5" /> Pass Mark (%)
                </label>
                <input
                  type="number" min="0" max="100"
                  value={setting.pass_mark}
                  onChange={(e) => handleChange(setting.program_id, 'pass_mark', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Question Counts & Time Limits */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Milestone Tests</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Questions per test</label>
                    <input
                      type="number" min="1"
                      value={setting.milestone_question_count}
                      onChange={(e) => handleChange(setting.program_id, 'milestone_question_count', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" /> Time limit (mins)
                    </label>
                    <input
                      type="number" min="1"
                      value={setting.milestone_time_limit}
                      onChange={(e) => handleChange(setting.program_id, 'milestone_time_limit', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Final Exam</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Questions per exam</label>
                    <input
                      type="number" min="1"
                      value={setting.exam_question_count}
                      onChange={(e) => handleChange(setting.program_id, 'exam_question_count', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" /> Time limit (mins)
                    </label>
                    <input
                      type="number" min="1"
                      value={setting.exam_time_limit}
                      onChange={(e) => handleChange(setting.program_id, 'exam_time_limit', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Retake & Review Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Retake Policy
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={setting.allow_exam_retake}
                      onChange={(e) => handleChange(setting.program_id, 'allow_exam_retake', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600"
                    />
                    Allow final exam retake
                  </label>
                  {setting.allow_exam_retake && (
                    <div className="ml-6">
                      <label className="text-xs text-gray-500">Max retakes</label>
                      <input
                        type="number" min="1" max="5"
                        value={setting.max_exam_retakes}
                        onChange={(e) => handleChange(setting.program_id, 'max_exam_retakes', parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm ml-2"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Review Settings
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={setting.show_wrong_answers}
                      onChange={(e) => handleChange(setting.program_id, 'show_wrong_answers', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600"
                    />
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                    Show wrong answers
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={setting.show_correct_answers}
                      onChange={(e) => handleChange(setting.program_id, 'show_correct_answers', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600"
                    />
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                    Show correct answers
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={setting.show_explanations}
                      onChange={(e) => handleChange(setting.program_id, 'show_explanations', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600"
                    />
                    <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                    Show explanations
                  </label>
                </div>
              </div>
            </div>

            {/* Test Mode per Milestone/Exam */}
            <div className="mt-5 bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5" /> Test Mode (Online / Oral)
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Oral tests are graded by the teacher. Online tests are taken by the student on the platform.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {program.milestones.map((milestone, idx) => {
                  const mode = (setting.milestone_test_modes || {})[String(idx)] || 'online';
                  return (
                    <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <span className="text-xs font-medium text-gray-700 truncate mr-2">M{idx + 1}</span>
                      <select
                        value={mode}
                        onChange={(e) => handleTestModeChange(setting.program_id, String(idx), e.target.value)}
                        className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white"
                      >
                        <option value="online">Online</option>
                        <option value="oral">Oral</option>
                      </select>
                    </div>
                  );
                })}
                {/* Final Exam mode */}
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-xs font-medium text-gray-700 truncate mr-2">Final Exam</span>
                  <select
                    value={(setting.milestone_test_modes || {})['final_exam'] || 'online'}
                    onChange={(e) => handleTestModeChange(setting.program_id, 'final_exam', e.target.value)}
                    className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white"
                  >
                    <option value="online">Online</option>
                    <option value="oral">Oral</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
