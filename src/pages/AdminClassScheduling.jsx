import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  Plus,
  Edit2,
  Save,
  X as XIcon,
  ChevronRight,
  BarChart3,
  ExternalLink,
  Users
} from 'lucide-react';
import { supabase } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const AdminClassScheduling = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form state for schedule
  const [scheduleForm, setScheduleForm] = useState({
    academic_year: 1,
    week_number: 1,
    class_type: 'main',
    day_of_week: '',
    class_time: '',
    meeting_link: '',
    notes: ''
  });

  useEffect(() => {
    loadEnrolledStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentSchedule(selectedStudent.id);
      loadStudentProgress(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadEnrolledStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .in('status', ['enrolled', 'graduated', 'dropout'])
        .order('enrolled_date', { ascending: false });

      if (error) throw error;
      setStudents(data || []);

      // Auto-select first student
      if (data && data.length > 0 && !selectedStudent) {
        setSelectedStudent(data[0]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentSchedule = async (studentId) => {
    try {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('*')
        .eq('student_id', studentId)
        .order('academic_year', { ascending: true })
        .order('week_number', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast.error('Failed to load schedule');
    }
  };

  const loadStudentProgress = async (studentId) => {
    try {
      const { data, error } = await supabase
        .from('student_class_progress')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      if (!selectedStudent) {
        toast.error('Please select a student');
        return;
      }

      const scheduleData = {
        student_id: selectedStudent.id,
        ...scheduleForm
      };

      if (editingSchedule) {
        // Update existing
        const { error } = await supabase
          .from('class_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);

        if (error) throw error;
        toast.success('Schedule updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('class_schedules')
          .insert([scheduleData]);

        if (error) throw error;
        toast.success('Schedule created successfully');
      }

      setShowScheduleModal(false);
      setEditingSchedule(null);
      resetForm();
      loadStudentSchedule(selectedStudent.id);
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error(error.message || 'Failed to save schedule');
    }
  };

  const handleMarkCompleted = async (scheduleId) => {
    try {
      const { error } = await supabase
        .from('class_schedules')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (error) throw error;
      toast.success('Class marked as completed');
      loadStudentSchedule(selectedStudent.id);
      loadStudentProgress(selectedStudent.id);
    } catch (error) {
      console.error('Error marking complete:', error);
      toast.error('Failed to mark as completed');
    }
  };

  const resetForm = () => {
    setScheduleForm({
      academic_year: 1,
      week_number: 1,
      class_type: 'main',
      day_of_week: '',
      class_time: '',
      meeting_link: '',
      notes: ''
    });
  };

  const openScheduleModal = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setScheduleForm({
        academic_year: schedule.academic_year,
        week_number: schedule.week_number,
        class_type: schedule.class_type,
        day_of_week: schedule.day_of_week || '',
        class_time: schedule.class_time || '',
        meeting_link: schedule.meeting_link || '',
        notes: schedule.notes || ''
      });
    } else {
      setEditingSchedule(null);
      resetForm();
    }
    setShowScheduleModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Scheduling</h2>
          <p className="text-gray-600">Manage student class schedules and track progress</p>
        </div>
        {selectedStudent && (
          <Button onClick={() => openScheduleModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Student List */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Enrolled Students</h3>
            <div className="space-y-2">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedStudent?.id === student.id
                      ? 'bg-emerald-100 border-2 border-emerald-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="font-medium text-gray-900">{student.full_name}</div>
                  <div className="text-sm text-gray-600">{student.student_id}</div>
                  <div className="text-xs text-gray-500">{student.email}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Schedule & Progress */}
        <div className="lg:col-span-3 space-y-6">
          {selectedStudent ? (
            <>
              {/* Student Info & Progress */}
              <Card>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedStudent.full_name}</h3>
                    <p className="text-gray-600">{selectedStudent.student_id} • {selectedStudent.email}</p>
                  </div>
                </div>

                {progress && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-900">Year 1</span>
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {progress.year1_completed}/{progress.year1_total}
                        </div>
                        <div className="text-sm text-blue-700">{progress.year1_progress_pct}% Complete</div>
                        <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress.year1_progress_pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-900">Year 2</span>
                          <BarChart3 className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-900">
                          {progress.year2_completed}/{progress.year2_total}
                        </div>
                        <div className="text-sm text-purple-700">{progress.year2_progress_pct}% Complete</div>
                        <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress.year2_progress_pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-emerald-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-emerald-900">Overall</span>
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-900">
                          {progress.total_completed}/{progress.total_classes}
                        </div>
                        <div className="text-sm text-emerald-700">{progress.overall_progress_pct}% Complete</div>
                        <div className="mt-2 w-full bg-emerald-200 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress.overall_progress_pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Schedule List */}
              <Card>
                <h3 className="font-semibold text-gray-900 mb-4">Class Schedule</h3>
                <div className="space-y-2">
                  {schedules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No classes scheduled yet</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-4"
                        onClick={() => openScheduleModal()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Class
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year/Week</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meeting Link</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {schedules.map((schedule) => (
                            <tr key={schedule.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                Year {schedule.academic_year} - Week {schedule.week_number}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  schedule.class_type === 'main'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {schedule.class_type === 'main' ? '2 Hours' : '30 Min'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {schedule.day_of_week && schedule.class_time ? (
                                  <div>
                                    <div className="font-medium">{schedule.day_of_week}</div>
                                    <div className="text-gray-500">{schedule.class_time}</div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Not scheduled</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {schedule.meeting_link ? (
                                  <a
                                    href={schedule.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
                                  >
                                    <Video className="h-4 w-4 mr-1" />
                                    Join
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                ) : (
                                  <span className="text-gray-400">No link</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  schedule.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : schedule.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {schedule.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right space-x-2">
                                <button
                                  onClick={() => openScheduleModal(schedule)}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                {schedule.status === 'scheduled' && (
                                  <button
                                    onClick={() => handleMarkCompleted(schedule.id)}
                                    className="text-green-600 hover:text-green-700"
                                    title="Mark as completed"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">Select a student to view and manage their schedule</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingSchedule ? 'Edit Class' : 'Add Class'}
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <select
                    value={scheduleForm.academic_year}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, academic_year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Week Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={scheduleForm.week_number}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, week_number: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Type
                </label>
                <select
                  value={scheduleForm.class_type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, class_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="main">Main Class (2 hours)</option>
                  <option value="short">Short Class (30 minutes)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week
                  </label>
                  <select
                    value={scheduleForm.day_of_week}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.class_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, class_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Link (Zoom/Meet)
                </label>
                <input
                  type="url"
                  value={scheduleForm.meeting_link}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveSchedule}>
                <Save className="h-4 w-4 mr-2" />
                {editingSchedule ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClassScheduling;
