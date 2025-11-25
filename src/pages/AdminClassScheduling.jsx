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
  Users,
  Zap,
  Filter
} from 'lucide-react';
import { supabase } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminClassScheduling = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [activeYear, setActiveYear] = useState(1);
  const [dayFilter, setDayFilter] = useState(() => DAYS_OF_WEEK[new Date().getDay()]);

  // Form state for individual schedule edit
  const [scheduleForm, setScheduleForm] = useState({
    academic_year: 1,
    week_number: 1,
    class_type: 'main',
    day_of_week: '',
    class_time: '',
    meeting_link: '',
    notes: ''
  });

  // Form state for bulk generation
  const [generateForm, setGenerateForm] = useState({
    day_of_week: '',
    main_class_time: '',
    short_class_time: '',
    meeting_link: ''
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
        .order('week_number', { ascending: true })
        .order('class_type', { ascending: false }); // main before short

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

  const handleGenerateFullSchedule = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    if (!generateForm.day_of_week || !generateForm.main_class_time || !generateForm.short_class_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    try {
      // Generate 104 weeks of schedules (52 weeks × 2 years)
      const schedulesToCreate = [];

      for (let year = 1; year <= 2; year++) {
        for (let week = 1; week <= 52; week++) {
          // Main class (2 hours)
          schedulesToCreate.push({
            student_id: selectedStudent.id,
            academic_year: year,
            week_number: week,
            class_type: 'main',
            day_of_week: generateForm.day_of_week,
            class_time: generateForm.main_class_time,
            meeting_link: generateForm.meeting_link || null,
            status: 'scheduled'
          });

          // Short class (30 minutes)
          schedulesToCreate.push({
            student_id: selectedStudent.id,
            academic_year: year,
            week_number: week,
            class_type: 'short',
            day_of_week: generateForm.day_of_week,
            class_time: generateForm.short_class_time,
            meeting_link: generateForm.meeting_link || null,
            status: 'scheduled'
          });
        }
      }

      // Insert in batches of 50 to avoid size limits
      const batchSize = 50;
      for (let i = 0; i < schedulesToCreate.length; i += batchSize) {
        const batch = schedulesToCreate.slice(i, i + batchSize);
        const { error } = await supabase
          .from('class_schedules')
          .insert(batch);

        if (error) throw error;
      }

      toast.success('Full schedule generated successfully! (208 classes created)');
      setShowGenerateModal(false);
      setGenerateForm({
        day_of_week: '',
        main_class_time: '',
        short_class_time: '',
        meeting_link: ''
      });
      loadStudentSchedule(selectedStudent.id);
      loadStudentProgress(selectedStudent.id);
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast.error(error.message || 'Failed to generate schedule');
    } finally {
      setGenerating(false);
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
        toast.success('Class rescheduled successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('class_schedules')
          .insert([scheduleData]);

        if (error) throw error;
        toast.success('Class added successfully');
      }

      setShowScheduleModal(false);
      setEditingSchedule(null);
      resetForm();
      loadStudentSchedule(selectedStudent.id);
      loadStudentProgress(selectedStudent.id);
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

  // Group schedules by week for the active year
  const getWeeklySchedules = () => {
    const yearSchedules = schedules.filter(s => s.academic_year === activeYear);

    // Filter by day if selected
    const filteredSchedules = dayFilter
      ? yearSchedules.filter(s => s.day_of_week === dayFilter)
      : yearSchedules;

    // Group by week
    const weekMap = {};
    filteredSchedules.forEach(schedule => {
      if (!weekMap[schedule.week_number]) {
        weekMap[schedule.week_number] = [];
      }
      weekMap[schedule.week_number].push(schedule);
    });

    return weekMap;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const weeklySchedules = getWeeklySchedules();
  const weekNumbers = Object.keys(weeklySchedules).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Scheduling</h2>
          <p className="text-gray-600">Manage student class schedules and track progress</p>
        </div>
        {selectedStudent && (
          <div className="flex gap-2">
            {schedules.length === 0 ? (
              <Button onClick={() => setShowGenerateModal(true)} variant="primary">
                <Zap className="h-4 w-4 mr-2" />
                Generate Full Schedule
              </Button>
            ) : (
              <Button onClick={() => openScheduleModal()} variant="secondary">
                <Plus className="h-4 w-4 mr-2" />
                Add Single Class
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Student List */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Students</h3>
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
                  <div className="text-xs text-gray-500 capitalize">{student.status}</div>
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
              {schedules.length === 0 ? (
                <Card>
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No schedule generated yet</p>
                    <p className="text-sm mb-6">Generate a full 2-year schedule with one click</p>
                    <Button onClick={() => setShowGenerateModal(true)} variant="primary">
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Full Schedule
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* Year Tabs */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveYear(1)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeYear === 1
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Year 1
                        </button>
                        <button
                          onClick={() => setActiveYear(2)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeYear === 2
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Year 2
                        </button>
                      </div>
                    </div>

                    {/* Day Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <select
                        value={dayFilter}
                        onChange={(e) => setDayFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">All Days</option>
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Weekly Schedule Cards */}
                  <div className="space-y-4">
                    {weekNumbers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No classes found for the selected filter</p>
                      </div>
                    ) : (
                      weekNumbers.map(weekNum => {
                        const weekClasses = weeklySchedules[weekNum];
                        const mainClass = weekClasses.find(c => c.class_type === 'main');
                        const shortClass = weekClasses.find(c => c.class_type === 'short');

                        return (
                          <div
                            key={`${activeYear}-${weekNum}`}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  Week {weekNum}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Year {activeYear} • {weekClasses[0]?.day_of_week || 'N/A'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {mainClass?.status === 'completed' && shortClass?.status === 'completed' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Week Complete
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-3">
                              {/* Main Class */}
                              {mainClass && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-900">
                                        Main Class (2 hrs)
                                      </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      mainClass.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {mainClass.status}
                                    </span>
                                  </div>
                                  <div className="text-sm text-blue-800 mb-2">
                                    {mainClass.class_time || 'No time set'}
                                  </div>
                                  {mainClass.meeting_link && (
                                    <a
                                      href={mainClass.meeting_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 mb-2"
                                    >
                                      <Video className="h-3 w-3 mr-1" />
                                      Join Meeting
                                    </a>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      onClick={() => openScheduleModal(mainClass)}
                                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                                    >
                                      <Edit2 className="h-3 w-3 mr-1" />
                                      Edit
                                    </button>
                                    {mainClass.status === 'scheduled' && (
                                      <button
                                        onClick={() => handleMarkCompleted(mainClass.id)}
                                        className="text-xs text-green-600 hover:text-green-700 flex items-center"
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Mark Done
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Short Class */}
                              {shortClass && (
                                <div className="bg-purple-50 p-3 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-purple-600" />
                                      <span className="text-sm font-medium text-purple-900">
                                        Short Class (30 min)
                                      </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      shortClass.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {shortClass.status}
                                    </span>
                                  </div>
                                  <div className="text-sm text-purple-800 mb-2">
                                    {shortClass.class_time || 'No time set'}
                                  </div>
                                  {shortClass.meeting_link && (
                                    <a
                                      href={shortClass.meeting_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-xs text-purple-600 hover:text-purple-700 mb-2"
                                    >
                                      <Video className="h-3 w-3 mr-1" />
                                      Join Meeting
                                    </a>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      onClick={() => openScheduleModal(shortClass)}
                                      className="text-xs text-purple-600 hover:text-purple-700 flex items-center"
                                    >
                                      <Edit2 className="h-3 w-3 mr-1" />
                                      Edit
                                    </button>
                                    {shortClass.status === 'scheduled' && (
                                      <button
                                        onClick={() => handleMarkCompleted(shortClass.id)}
                                        className="text-xs text-green-600 hover:text-green-700 flex items-center"
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Mark Done
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              )}
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

      {/* Generate Full Schedule Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Generate Full Schedule</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Create 208 classes (2 years × 52 weeks × 2 classes per week)
                </p>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week <span className="text-red-600">*</span>
                </label>
                <select
                  value={generateForm.day_of_week}
                  onChange={(e) => setGenerateForm({ ...generateForm, day_of_week: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select day</option>
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Class Time (2 hrs) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="time"
                    value={generateForm.main_class_time}
                    onChange={(e) => setGenerateForm({ ...generateForm, main_class_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Class Time (30 min) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="time"
                    value={generateForm.short_class_time}
                    onChange={(e) => setGenerateForm({ ...generateForm, short_class_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Link (Zoom/Meet)
                </label>
                <input
                  type="url"
                  value={generateForm.meeting_link}
                  onChange={(e) => setGenerateForm({ ...generateForm, meeting_link: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Same meeting link will be used for all classes
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  This will create <strong>208 classes</strong> for {selectedStudent?.full_name}:
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                  <li>Year 1: 52 weeks × 2 classes = 104 classes</li>
                  <li>Year 2: 52 weeks × 2 classes = 104 classes</li>
                  <li>All scheduled for {generateForm.day_of_week || '[Day]'}</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowGenerateModal(false)}
                disabled={generating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateFullSchedule}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Single Class Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingSchedule ? 'Reschedule Class' : 'Add Class'}
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
                    disabled={!!editingSchedule}
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
                    disabled={!!editingSchedule}
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
                  disabled={!!editingSchedule}
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
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
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
                  placeholder="Reason for rescheduling or special notes..."
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
