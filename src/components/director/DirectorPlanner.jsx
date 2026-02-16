import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  ClipboardList,
  PlayCircle,
  CheckCircle,
  X as XIcon
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';

const STATUSES = ['idea', 'planning', 'in_progress', 'done'];

const STATUS_CONFIG = {
  idea: {
    label: 'Idea',
    icon: Lightbulb,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-700'
  },
  planning: {
    label: 'Planning',
    icon: ClipboardList,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700'
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircle,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    badgeColor: 'bg-indigo-100 text-indigo-700'
  },
  done: {
    label: 'Done',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-700'
  }
};

const DirectorPlanner = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({ title: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('director_plans')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', notes: '' });
    setEditingPlan(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({ title: plan.title, notes: plan.notes || '' });
    setModalOpen(true);
  };

  const createPlan = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ideaCount = plans.filter(p => p.status === 'idea').length;
      const { error } = await supabase
        .from('director_plans')
        .insert({
          title: formData.title.trim(),
          notes: formData.notes.trim(),
          status: 'idea',
          created_by: user.id,
          position: ideaCount
        });
      if (error) throw error;
      toast.success('Plan created');
      setModalOpen(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = async () => {
    if (!formData.title.trim() || !editingPlan) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('director_plans')
        .update({
          title: formData.title.trim(),
          notes: formData.notes.trim()
        })
        .eq('id', editingPlan.id);
      if (error) throw error;
      toast.success('Plan updated');
      setModalOpen(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  const moveStatus = async (planId, newStatus) => {
    // Optimistic update
    setPlans(prev => prev.map(p =>
      p.id === planId ? { ...p, status: newStatus } : p
    ));
    try {
      const { error } = await supabase
        .from('director_plans')
        .update({ status: newStatus })
        .eq('id', planId);
      if (error) throw error;
      toast.success(`Moved to ${STATUS_CONFIG[newStatus].label}`);
    } catch (error) {
      console.error('Error moving plan:', error);
      toast.error('Failed to move plan');
      fetchPlans(); // revert on error
    }
  };

  const deletePlan = async (planId) => {
    if (!window.confirm('Delete this plan?')) return;
    setDeletingId(planId);
    try {
      const { error } = await supabase
        .from('director_plans')
        .delete()
        .eq('id', planId);
      if (error) throw error;
      toast.success('Plan deleted');
      setPlans(prev => prev.filter(p => p.id !== planId));
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPlan) {
      updatePlan();
    } else {
      createPlan();
    }
  };

  // PlanCard sub-component
  const PlanCard = ({ plan }) => {
    const statusIndex = STATUSES.indexOf(plan.status);
    const canMoveLeft = statusIndex > 0;
    const canMoveRight = statusIndex < STATUSES.length - 1;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3.5 hover:border-gray-300 hover:shadow-sm transition-all group">
        <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{plan.title}</h4>
        {plan.notes && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{plan.notes}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          {/* Move arrows */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => canMoveLeft && moveStatus(plan.id, STATUSES[statusIndex - 1])}
              disabled={!canMoveLeft}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title={canMoveLeft ? `Move to ${STATUS_CONFIG[STATUSES[statusIndex - 1]].label}` : ''}
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => canMoveRight && moveStatus(plan.id, STATUSES[statusIndex + 1])}
              disabled={!canMoveRight}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title={canMoveRight ? `Move to ${STATUS_CONFIG[STATUSES[statusIndex + 1]].label}` : ''}
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          {/* Edit/Delete */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openEditModal(plan)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5 text-gray-400" />
            </button>
            <button
              onClick={() => deletePlan(plan.id)}
              disabled={deletingId === plan.id}
              className="p-1 rounded hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // KanbanColumn sub-component
  const KanbanColumn = ({ status }) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    const columnPlans = plans.filter(p => p.status === status);

    return (
      <div className={`bg-gray-50 rounded-xl border ${config.borderColor} flex flex-col`}>
        {/* Column header */}
        <div className={`${config.bgColor} px-4 py-3 rounded-t-xl border-b ${config.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.color}`} />
              <h3 className={`font-semibold text-sm ${config.color}`}>{config.label}</h3>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badgeColor}`}>
              {columnPlans.length}
            </span>
          </div>
        </div>
        {/* Cards */}
        <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[60vh]">
          {columnPlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
          {columnPlans.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No items</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Planner Board</h3>
          <p className="text-sm text-gray-500 mt-1">{plans.length} total plans</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all shadow-sm hover:shadow-md font-semibold text-sm"
        >
          <Plus className="h-4 w-4" />
          New Plan
        </button>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.map(status => (
            <KanbanColumn key={status} status={status} />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => { setModalOpen(false); resetForm(); }}
        >
          <div
            className="bg-white rounded-xl w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-0">
              <h3 className="text-lg font-bold text-gray-900">
                {editingPlan ? 'Edit Plan' : 'New Plan'}
              </h3>
              <button
                onClick={() => { setModalOpen(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="plan-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="plan-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label htmlFor="plan-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="plan-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional details..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!formData.title.trim() || saving}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : (editingPlan ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorPlanner;
