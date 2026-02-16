import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X as XIcon,
  GripVertical
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';

const STATUSES = ['idea', 'planning', 'in_progress', 'done'];

const STATUS_CONFIG = {
  idea: { label: 'Idea' },
  planning: { label: 'Planning' },
  in_progress: { label: 'In Progress' },
  done: { label: 'Done' }
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

  const deletePlan = async (planId) => {
    if (!window.confirm('Delete this plan?')) return;
    setDeletingId(planId);
    try {
      const { error } = await supabase
        .from('director_plans')
        .delete()
        .eq('id', planId);
      if (error) throw error;
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

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;
    const destIndex = destination.index;

    const plansCopy = plans.map(p => ({ ...p }));
    const draggedPlan = plansCopy.find(p => p.id === draggableId);
    if (!draggedPlan) return;

    draggedPlan.status = destStatus;

    const destItems = plansCopy
      .filter(p => p.status === destStatus && p.id !== draggableId)
      .sort((a, b) => a.position - b.position);

    destItems.splice(destIndex, 0, draggedPlan);
    destItems.forEach((item, idx) => { item.position = idx; });

    if (sourceStatus !== destStatus) {
      const sourceItems = plansCopy
        .filter(p => p.status === sourceStatus && p.id !== draggableId)
        .sort((a, b) => a.position - b.position);
      sourceItems.forEach((item, idx) => { item.position = idx; });
    }

    setPlans([...plansCopy]);

    try {
      const updates = destItems.map(item => ({
        id: item.id, status: item.status, position: item.position
      }));

      if (sourceStatus !== destStatus) {
        plansCopy
          .filter(p => p.status === sourceStatus)
          .sort((a, b) => a.position - b.position)
          .forEach((item, idx) => {
            updates.push({ id: item.id, status: item.status, position: idx });
          });
      }

      await Promise.all(
        updates.map(u =>
          supabase
            .from('director_plans')
            .update({ status: u.status, position: u.position })
            .eq('id', u.id)
        )
      );
    } catch (error) {
      console.error('Error updating positions:', error);
      toast.error('Failed to save changes');
      fetchPlans();
    }
  };

  const PlanCard = ({ plan, index }) => (
    <Draggable draggableId={plan.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-white rounded-lg border p-3 group transition-shadow ${
            snapshot.isDragging
              ? 'border-gray-300 shadow-lg'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-2">
            <div
              {...provided.dragHandleProps}
              className="pt-0.5 text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm text-gray-900 leading-snug line-clamp-2">{plan.title}</h4>
              {plan.notes && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{plan.notes}</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openEditModal(plan)}
              className="p-1 rounded hover:bg-gray-100"
              title="Edit"
            >
              <Pencil className="h-3 w-3 text-gray-400" />
            </button>
            <button
              onClick={() => deletePlan(plan.id)}
              disabled={deletingId === plan.id}
              className="p-1 rounded hover:bg-gray-100"
              title="Delete"
            >
              <Trash2 className="h-3 w-3 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );

  const KanbanColumn = ({ status }) => {
    const config = STATUS_CONFIG[status];
    const columnPlans = plans
      .filter(p => p.status === status)
      .sort((a, b) => a.position - b.position);

    return (
      <div className="flex flex-col min-w-0">
        <div className="flex items-center justify-between px-1 mb-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{config.label}</h3>
          <span className="text-xs text-gray-400 tabular-nums">{columnPlans.length}</span>
        </div>
        <Droppable droppableId={status}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 flex-1 min-h-[120px] rounded-lg p-1 transition-colors ${
                snapshot.isDraggingOver ? 'bg-gray-50' : ''
              }`}
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
            >
              {columnPlans.map((plan, index) => (
                <PlanCard key={plan.id} plan={plan} index={index} />
              ))}
              {provided.placeholder}
              {columnPlans.length === 0 && !snapshot.isDraggingOver && (
                <p className="text-xs text-gray-300 text-center py-8">Empty</p>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{plans.length} plans</p>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATUSES.map(status => (
              <KanbanColumn key={status} status={status} />
            ))}
          </div>
        </DragDropContext>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => { setModalOpen(false); resetForm(); }}
        >
          <div
            className="bg-white rounded-lg w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <h3 className="text-sm font-medium text-gray-900">
                {editingPlan ? 'Edit Plan' : 'New Plan'}
              </h3>
              <button
                onClick={() => { setModalOpen(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label htmlFor="plan-title" className="block text-sm text-gray-600 mb-1">Title</label>
                <input
                  id="plan-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label htmlFor="plan-notes" className="block text-sm text-gray-600 mb-1">Notes</label>
                <textarea
                  id="plan-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Details..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!formData.title.trim() || saving}
                  className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : (editingPlan ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); resetForm(); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
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
