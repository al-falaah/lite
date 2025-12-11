// Multi-program enrollment support - v2.2 - Build: 20251209-080500
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
  Filter,
  Lock,
  List,
  Grid,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminClassScheduling = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]); // For global day view
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [globalDayFilter, setGlobalDayFilter] = useState(() => DAYS_OF_WEEK[new Date().getDay()]);
  const [viewMode, setViewMode] = useState('student'); // 'student' or 'day'
  const [showStudentList, setShowStudentList] = useState(true); // For collapsible student list
  const [studentSearchQuery, setStudentSearchQuery] = useState(''); // Search students

  // Form state for individual schedule edit
  const [scheduleForm, setScheduleForm] = useState({
    academic_year: 1,
    week_number: 1,
    class_type: 'main',
    day_of_week: '',
    class_time: '',
    meeting_link: '',
    notes: '',
    program: '' // Add program field
  });

  // Form state for bulk generation - separate days for main and short classes
  const [generateForm, setGenerateForm] = useState({
    program: '', // Add program field
    main_day_of_week: '',
    short_day_of_week: '',
    main_class_time: '',
    short_class_time: '',
    meeting_link: ''
  });

  useEffect(() => {
    loadEnrolledStudents();
    loadAllSchedules(); // Load all schedules for global day view
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentSchedule(selectedStudent.id);
      loadStudentProgress(selectedStudent.id);
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (viewMode === 'day') {
      loadAllSchedules();
    }
  }, [globalDayFilter, viewMode]);

  const loadEnrolledStudents = async () => {
    console.log('🔵 AdminClassScheduling v2.2 - Build: 20251209-080500');
    try {
      // Fetch students with their enrollments
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          enrollments (
            id,
            program,
            status,
            enrolled_date,
            total_fees,
            total_paid,
            balance_remaining
          )
        `)
        .eq('status', 'enrolled')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('📊 Raw query returned:', data?.length, 'students');
      console.log('📋 All students:', data?.map(s => ({
        id: s.student_id,
        name: s.full_name,
        enrollments: s.enrollments?.length || 0,
        activeEnrollments: s.enrollments?.filter(e => e.status === 'active').length || 0
      })));

      // Filter to only students with active enrollments
      const studentsWithEnrollments = (data || []).filter(student =>
        student.enrollments && student.enrollments.length > 0 &&
        student.enrollments.some(e => e.status === 'active')
      );

      console.log('✅ After filtering:', studentsWithEnrollments.length, 'students with active enrollments');
      console.log('👥 Filtered students:', studentsWithEnrollments.map(s => `${s.student_id} - ${s.full_name}`));

      setStudents(studentsWithEnrollments);

      // Auto-select first student in student view
      if (studentsWithEnrollments.length > 0 && !selectedStudent && viewMode === 'student') {
        setSelectedStudent(studentsWithEnrollments[0]);
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

  const loadAllSchedules = async () => {
    try {
      const { data: schedulesData, error: schedError } = await supabase
        .from('class_schedules')
        .select(`
          *,
          students:student_id (
            id,
            student_id,
            full_name,
            email,
            status
          )
        `)
        .eq('day_of_week', globalDayFilter)
        .order('class_time', { ascending: true });

      if (schedError) throw schedError;
      setAllSchedules(schedulesData || []);
    } catch (error) {
      console.error('Error loading all schedules:', error);
      toast.error('Failed to load schedules');
    }
  };

  const loadStudentProgress = async (studentId) => {
    try {
      const { data, error } = await supabase
        .from('student_class_progress')
        .select('*')
        .eq('student_id', studentId);

      if (error) throw error;

      // Store all progress records (one per program)
      // If student has only one program, use that
      // If multiple, we'll show all of them
      if (data && data.length > 0) {
        setProgress(data.length === 1 ? data[0] : data);
      } else {
        setProgress(null);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      setProgress(null);
    }
  };

  const handleGenerateFullSchedule = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    if (!generateForm.program || !generateForm.main_day_of_week || !generateForm.short_day_of_week ||
        !generateForm.main_class_time || !generateForm.short_class_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    try {
      // Check if schedules already exist for this program
      const { data: existingSchedules, error: checkError } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('student_id', selectedStudent.id)
        .eq('program', generateForm.program)
        .limit(1);

      if (checkError) throw checkError;

      if (existingSchedules && existingSchedules.length > 0) {
        const programName = generateForm.program === 'tajweed' ? 'Tajweed Program' : 'Essentials Program';
        toast.error(`Schedules already exist for ${programName}. Delete existing schedules first or add classes individually.`);
        setGenerating(false);
        return;
      }

      // Determine number of weeks based on program
      const isTajweed = generateForm.program === 'tajweed';
      const totalWeeks = isTajweed ? 24 : 52; // Tajweed: 24 weeks (6 months), Essentials: 52 weeks/year
      const totalYears = isTajweed ? 1 : 2; // Tajweed: 1 year, Essentials: 2 years

      // Generate schedules
      const schedulesToCreate = [];

      for (let year = 1; year <= totalYears; year++) {
        for (let week = 1; week <= totalWeeks; week++) {
          // Main class (2 hours) - can be on different day
          schedulesToCreate.push({
            student_id: selectedStudent.id,
            program: generateForm.program,
            academic_year: year,
            week_number: week,
            class_type: 'main',
            day_of_week: generateForm.main_day_of_week,
            class_time: generateForm.main_class_time,
            meeting_link: generateForm.meeting_link || null,
            status: 'scheduled'
          });

          // Short class (30 minutes) - can be on different day
          schedulesToCreate.push({
            student_id: selectedStudent.id,
            program: generateForm.program,
            academic_year: year,
            week_number: week,
            class_type: 'short',
            day_of_week: generateForm.short_day_of_week,
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

      const totalClasses = schedulesToCreate.length;
      const programName = isTajweed ? 'Tajweed Program' : 'Essentials Program';
      toast.success(`Full schedule generated for ${programName}! (${totalClasses} classes created)`);
      setShowGenerateModal(false);
      setGenerateForm({
        program: '',
        main_day_of_week: '',
        short_day_of_week: '',
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
      loadAllSchedules();
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

      if (selectedStudent) {
        loadStudentSchedule(selectedStudent.id);
        loadStudentProgress(selectedStudent.id);
      }
      loadAllSchedules();
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
      notes: '',
      program: ''
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
        notes: schedule.notes || '',
        program: schedule.program || ''
      });
    } else {
      setEditingSchedule(null);
      resetForm();
    }
    setShowScheduleModal(true);
  };

  const openGenerateModal = async () => {
    if (!selectedStudent) return;

    // Refresh student's enrollments before opening modal
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          enrollments (
            id,
            program,
            status,
            enrolled_date,
            total_fees,
            total_paid,
            balance_remaining
          )
        `)
        .eq('id', selectedStudent.id)
        .single();

      if (error) throw error;

      // Update the selected student with fresh enrollment data
      setSelectedStudent(data);

      // Also update in the students list
      setStudents(prev => prev.map(s => s.id === data.id ? data : s));

      console.log('📋 Refreshed enrollments:', data.enrollments);
    } catch (error) {
      console.error('Error refreshing student data:', error);
      toast.error('Failed to refresh student data');
      return;
    }

    setShowGenerateModal(true);
  };

  // Get the current active week and year
  const getCurrentActiveWeekAndYear = () => {
    if (schedules.length === 0) return { year: 1, week: 1 };

    const weekMap = {};

    schedules.forEach(schedule => {
      const key = `${schedule.academic_year}-${schedule.week_number}`;
      if (!weekMap[key]) {
        weekMap[key] = [];
      }
      weekMap[key].push(schedule);
    });

    // Check Year 1 first
    for (let weekNum = 1; weekNum <= 52; weekNum++) {
      const weekClasses = weekMap[`1-${weekNum}`];
      if (!weekClasses || weekClasses.length === 0) {
        return { year: 1, week: weekNum }; // First week without classes
      }

      const allCompleted = weekClasses.every(c => c.status === 'completed');
      if (!allCompleted) {
        return { year: 1, week: weekNum }; // First incomplete week in Year 1
      }
    }

    // Year 1 complete, check Year 2
    for (let weekNum = 1; weekNum <= 52; weekNum++) {
      const weekClasses = weekMap[`2-${weekNum}`];
      if (!weekClasses || weekClasses.length === 0) {
        return { year: 2, week: weekNum };
      }

      const allCompleted = weekClasses.every(c => c.status === 'completed');
      if (!allCompleted) {
        return { year: 2, week: weekNum };
      }
    }

    return { year: 2, week: 52 }; // All complete
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const currentActive = viewMode === 'student' && schedules.length > 0
    ? getCurrentActiveWeekAndYear()
    : { year: 1, week: 1 };

  // Get current week's classes
  const currentWeekClasses = schedules.filter(
    s => s.academic_year === currentActive.year && s.week_number === currentActive.week
  );

  return (
    <div className="space-y-6">
      {/* Header with View Mode Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Scheduling</h2>
          <p className="text-gray-600">Manage student class schedules and track progress</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('student')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'student'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">By Student</span>
              <span className="sm:hidden">Student</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'day'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">By Day</span>
              <span className="sm:hidden">Day</span>
            </button>
          </div>

          {/* Action Buttons (only in By Student view) */}
          {viewMode === 'student' && selectedStudent && (
            <div className="w-full sm:w-auto flex gap-2">
              <Button onClick={openGenerateModal} variant="primary" className="w-full sm:w-auto">
                <Zap className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Generate Program Schedule</span>
                <span className="sm:hidden">Generate</span>
              </Button>
              <Button onClick={() => openScheduleModal()} variant="secondary" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Single Class</span>
                <span className="sm:hidden">Add Class</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modern Day Filter Pills (only in By Day view) */}
      {viewMode === 'day' && (
        <Card>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Select Day:</span>
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                onClick={() => setGlobalDayFilter(day)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  globalDayFilter === day
                    ? 'bg-emerald-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* By Day View - Student Cards */}
      {viewMode === 'day' && (
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Students with classes on {globalDayFilter}
            </h3>
            <p className="text-sm text-gray-600">Click on a student to view their full schedule</p>
          </div>

          {allSchedules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No students have classes scheduled for {globalDayFilter}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Group schedules by student and show unique student cards */}
              {Object.entries(
                allSchedules.reduce((acc, schedule) => {
                  const studentId = schedule.student_id;
                  if (!acc[studentId]) {
                    acc[studentId] = {
                      student: schedule.students,
                      classes: []
                    };
                  }
                  acc[studentId].classes.push(schedule);
                  return acc;
                }, {})
              ).map(([studentId, { student, classes }]) => {
                const mainClass = classes.find(c => c.class_type === 'main');
                const shortClass = classes.find(c => c.class_type === 'short');
                const hasCompletedClasses = classes.some(c => c.status === 'completed');
                const hasScheduledClasses = classes.some(c => c.status === 'scheduled');

                return (
                  <button
                    key={studentId}
                    onClick={() => {
                      setSelectedStudent(students.find(s => s.id === studentId));
                      setViewMode('student');
                    }}
                    className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-emerald-500 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-emerald-600 transition-colors">
                          {student?.full_name || 'Unknown Student'}
                        </h4>
                        <p className="text-sm text-gray-600">{student?.student_id}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </div>

                    {/* Class Times */}
                    <div className="space-y-2 mb-3">
                      {mainClass && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            {mainClass.class_time}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            2 hrs
                          </span>
                        </div>
                      )}
                      {shortClass && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-purple-900">
                            {shortClass.class_time}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            30 min
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {hasCompletedClasses && (
                        <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Has completed classes
                        </span>
                      )}
                      {hasScheduledClasses && (
                        <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          {classes.filter(c => c.status === 'scheduled').length} scheduled
                        </span>
                      )}
                    </div>

                    {/* Total Classes Count */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600">
                        {classes.length} class{classes.length !== 1 ? 'es' : ''} on {globalDayFilter}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* By Student View */}
      {viewMode === 'student' && (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Student List */}
          <div className="lg:col-span-1">
            <Card>
              {/* Header with Collapse Toggle */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Students ({students.filter(s =>
                    s.full_name?.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                    s.student_id?.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                    s.email?.toLowerCase().includes(studentSearchQuery.toLowerCase())
                  ).length})
                </h3>
                <button
                  onClick={() => setShowStudentList(!showStudentList)}
                  className="text-gray-600 hover:text-emerald-600 transition-colors p-1 rounded-lg hover:bg-emerald-50"
                  aria-label={showStudentList ? "Collapse student list" : "Expand student list"}
                >
                  {showStudentList ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Search Bar */}
              {showStudentList && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Search students..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {studentSearchQuery && (
                    <button
                      onClick={() => setStudentSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Student List */}
              {showStudentList && (
                <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                  {students
                    .filter(student => {
                      const query = studentSearchQuery.toLowerCase();
                      return (
                        student.full_name?.toLowerCase().includes(query) ||
                        student.student_id?.toLowerCase().includes(query) ||
                        student.email?.toLowerCase().includes(query)
                      );
                    })
                    .map((student) => (
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
                  {students.filter(student => {
                    const query = studentSearchQuery.toLowerCase();
                    return (
                      student.full_name?.toLowerCase().includes(query) ||
                      student.student_id?.toLowerCase().includes(query) ||
                      student.email?.toLowerCase().includes(query)
                    );
                  }).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No students found</p>
                    </div>
                  )}
                </div>
              )}
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

                  {/* Program Enrollments Section */}
                  {selectedStudent.enrollments && selectedStudent.enrollments.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Program Enrollments</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {selectedStudent.enrollments
                          .filter(e => e.status === 'active')
                          .map(enrollment => {
                            // Count schedules for this program
                            const programSchedules = schedules.filter(s => s.program === enrollment.program);
                            const hasSchedules = programSchedules.length > 0;
                            const programName = enrollment.program === 'tajweed'
                              ? 'Tajweed Program'
                              : 'Essential Islamic Studies';
                            const expectedClasses = enrollment.program === 'tajweed' ? 48 : 208;

                            return (
                              <div
                                key={enrollment.id}
                                className={`p-4 rounded-lg border-2 ${
                                  hasSchedules
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-amber-50 border-amber-200'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h5 className="font-semibold text-gray-900">{programName}</h5>
                                    <p className="text-sm text-gray-600 capitalize">{enrollment.status}</p>
                                  </div>
                                  {hasSchedules ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                  )}
                                </div>

                                {hasSchedules ? (
                                  <div className="text-sm text-gray-700">
                                    <span className="font-medium text-emerald-700">
                                      {programSchedules.length} classes scheduled
                                    </span>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm text-amber-700 mb-3">
                                      No schedule generated yet
                                    </p>
                                    <button
                                      onClick={() => {
                                        setGenerateForm({ ...generateForm, program: enrollment.program });
                                        openGenerateModal();
                                      }}
                                      className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <Zap className="h-4 w-4" />
                                      Generate Schedule ({expectedClasses} classes)
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {progress && (
                    <div className="space-y-4">
                      {/* Handle both single program (object) and multiple programs (array) */}
                      {Array.isArray(progress) ? (
                        // Multiple programs - show each separately
                        progress.map((prog, index) => {
                          const programName = prog.program === 'tajweed' ? 'Tajweed Program' : 'Essential Arabic & Islamic Studies';
                          return (
                            <div key={`${prog.student_id}-${prog.program}`} className="space-y-2">
                              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                                <span className="text-sm font-semibold text-gray-800">{programName}</span>
                                {prog.program === 'tajweed' ? (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">6 months</span>
                                ) : (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">2 years</span>
                                )}
                              </div>
                              <div className="grid md:grid-cols-3 gap-4">
                                {prog.program !== 'tajweed' && (
                                  <>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-blue-900">Year 1</span>
                                        <BarChart3 className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div className="text-2xl font-bold text-blue-900">
                                        {prog.year1_completed}/{prog.year1_total}
                                      </div>
                                      <div className="text-sm text-blue-700">{prog.year1_progress_pct}% Complete</div>
                                      <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                                        <div
                                          className="bg-blue-600 h-2 rounded-full transition-all"
                                          style={{ width: `${prog.year1_progress_pct}%` }}
                                        />
                                      </div>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-purple-900">Year 2</span>
                                        <BarChart3 className="h-4 w-4 text-purple-600" />
                                      </div>
                                      <div className="text-2xl font-bold text-purple-900">
                                        {prog.year2_completed}/{prog.year2_total}
                                      </div>
                                      <div className="text-sm text-purple-700">{prog.year2_progress_pct}% Complete</div>
                                      <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                                        <div
                                          className="bg-purple-600 h-2 rounded-full transition-all"
                                          style={{ width: `${prog.year2_progress_pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  </>
                                )}

                                <div className="bg-emerald-50 p-4 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-emerald-900">Overall</span>
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                  </div>
                                  <div className="text-2xl font-bold text-emerald-900">
                                    {prog.total_completed}/{prog.total_classes}
                                  </div>
                                  <div className="text-sm text-emerald-700">{prog.overall_progress_pct}% Complete</div>
                                  <div className="mt-2 w-full bg-emerald-200 rounded-full h-2">
                                    <div
                                      className="bg-emerald-600 h-2 rounded-full transition-all"
                                      style={{ width: `${prog.overall_progress_pct}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        // Single program - show as before with program label
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                            <span className="text-sm font-semibold text-gray-800">
                              {progress.program === 'tajweed' ? 'Tajweed Program' : 'Essential Arabic & Islamic Studies'}
                            </span>
                            {progress.program === 'tajweed' ? (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">6 months</span>
                            ) : (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">2 years</span>
                            )}
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                            {progress.program !== 'tajweed' && (
                              <>
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
                              </>
                            )}

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
                    </div>
                  )}
                </Card>

                {/* Current Week Schedule */}
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
                    {/* Current Week Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          Week {currentActive.week} of 52
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {currentActive.year === 1 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Year 1
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Year 2
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Progress</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {Math.round(((currentActive.year - 1) * 52 + currentActive.week - 1) / 104 * 100)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {(currentActive.year - 1) * 52 + currentActive.week - 1} of 104 weeks
                        </p>
                      </div>
                    </div>

                    {/* Current Week Classes */}
                    {currentWeekClasses.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No classes scheduled for this week</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Main Class */}
                        {currentWeekClasses.find(c => c.class_type === 'main') && (
                          <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <span className="text-base font-semibold text-blue-900">
                                  Main Class (2 hrs)
                                </span>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                currentWeekClasses.find(c => c.class_type === 'main').status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {currentWeekClasses.find(c => c.class_type === 'main').status}
                              </span>
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="text-sm text-blue-800">
                                <span className="font-medium">Day:</span> {currentWeekClasses.find(c => c.class_type === 'main').day_of_week}
                              </div>
                              <div className="text-sm text-blue-800">
                                <span className="font-medium">Time:</span> {currentWeekClasses.find(c => c.class_type === 'main').class_time || 'Not set'}
                              </div>
                            </div>
                            {currentWeekClasses.find(c => c.class_type === 'main').meeting_link && (
                              <a
                                href={currentWeekClasses.find(c => c.class_type === 'main').meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-blue-700 hover:text-blue-800 font-medium mb-3"
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Join Meeting
                              </a>
                            )}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-blue-200">
                              <button
                                onClick={() => openScheduleModal(currentWeekClasses.find(c => c.class_type === 'main'))}
                                className="text-sm text-blue-700 hover:text-blue-800 flex items-center font-medium"
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Reschedule
                              </button>
                              {currentWeekClasses.find(c => c.class_type === 'main').status === 'scheduled' && (
                                <button
                                  onClick={() => handleMarkCompleted(currentWeekClasses.find(c => c.class_type === 'main').id)}
                                  className="text-sm text-green-700 hover:text-green-800 flex items-center font-medium ml-auto"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark Complete
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Short Class */}
                        {currentWeekClasses.find(c => c.class_type === 'short') && (
                          <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-purple-600" />
                                <span className="text-base font-semibold text-purple-900">
                                  Short Class (30 min)
                                </span>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                currentWeekClasses.find(c => c.class_type === 'short').status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {currentWeekClasses.find(c => c.class_type === 'short').status}
                              </span>
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="text-sm text-purple-800">
                                <span className="font-medium">Day:</span> {currentWeekClasses.find(c => c.class_type === 'short').day_of_week}
                              </div>
                              <div className="text-sm text-purple-800">
                                <span className="font-medium">Time:</span> {currentWeekClasses.find(c => c.class_type === 'short').class_time || 'Not set'}
                              </div>
                            </div>
                            {currentWeekClasses.find(c => c.class_type === 'short').meeting_link && (
                              <a
                                href={currentWeekClasses.find(c => c.class_type === 'short').meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-purple-700 hover:text-purple-800 font-medium mb-3"
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Join Meeting
                              </a>
                            )}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-purple-200">
                              <button
                                onClick={() => openScheduleModal(currentWeekClasses.find(c => c.class_type === 'short'))}
                                className="text-sm text-purple-700 hover:text-purple-800 flex items-center font-medium"
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Reschedule
                              </button>
                              {currentWeekClasses.find(c => c.class_type === 'short').status === 'scheduled' && (
                                <button
                                  onClick={() => handleMarkCompleted(currentWeekClasses.find(c => c.class_type === 'short').id)}
                                  className="text-sm text-green-700 hover:text-green-800 flex items-center font-medium ml-auto"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark Complete
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Week Completion Note */}
                    {currentWeekClasses.every(c => c.status === 'completed') && currentWeekClasses.length > 0 && (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-900">Week {currentActive.week} Complete!</p>
                            <p className="text-sm text-green-700">
                              Great job! Next week will unlock automatically.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
      )}

      {/* Generate Full Schedule Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Generate Full Schedule</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {!generateForm.program
                    ? 'Select a program to see details'
                    : generateForm.program === 'tajweed'
                    ? 'Create 48 classes (24 weeks × 2 classes per week)'
                    : 'Create 208 classes (2 years × 52 weeks × 2 classes per week)'}
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
              {/* Program Selector - First field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program <span className="text-red-600">*</span>
                </label>
                <select
                  value={generateForm.program}
                  onChange={(e) => setGenerateForm({ ...generateForm, program: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select program</option>
                  {selectedStudent?.enrollments?.filter(e => e.status === 'active').map(enrollment => (
                    <option key={enrollment.program} value={enrollment.program}>
                      {enrollment.program === 'tajweed' ? 'Tajweed Program (6 months)' : 'Essential Arabic & Islamic Studies (2 years)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {generateForm.program === 'tajweed'
                    ? 'Will create 48 classes (24 weeks × 2 classes)'
                    : 'Will create 208 classes (2 years × 52 weeks × 2 classes)'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Class Day (2 hrs) <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={generateForm.main_day_of_week}
                    onChange={(e) => setGenerateForm({ ...generateForm, main_day_of_week: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select day</option>
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Class Day (30 min) <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={generateForm.short_day_of_week}
                    onChange={(e) => setGenerateForm({ ...generateForm, short_day_of_week: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select day</option>
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Class Time <span className="text-red-600">*</span>
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
                    Short Class Time <span className="text-red-600">*</span>
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
                {generateForm.program ? (
                  <>
                    <p className="text-sm text-blue-900">
                      This will create <strong>{generateForm.program === 'tajweed' ? '48 classes' : '208 classes'}</strong> for {selectedStudent?.full_name}:
                    </p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                      {generateForm.program === 'tajweed' ? (
                        <>
                          <li>24 weeks × 2 classes = 48 classes total</li>
                          <li>Program duration: 6 months</li>
                        </>
                      ) : (
                        <>
                          <li>Year 1: 52 weeks × 2 classes = 104 classes</li>
                          <li>Year 2: 52 weeks × 2 classes = 104 classes</li>
                        </>
                      )}
                      <li>Main classes on {generateForm.main_day_of_week || '[Day]'}</li>
                      <li>Short classes on {generateForm.short_day_of_week || '[Day]'}</li>
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Please select a program to see class details</p>
                )}
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
              {/* Program Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program <span className="text-red-600">*</span>
                </label>
                <select
                  value={scheduleForm.program}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, program: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={!!editingSchedule}
                  required
                >
                  <option value="">Select program</option>
                  {selectedStudent?.enrollments?.filter(e => e.status === 'active').map(enrollment => (
                    <option key={enrollment.program} value={enrollment.program}>
                      {enrollment.program === 'tajweed' ? 'Tajweed Program' : 'Essential Arabic & Islamic Studies'}
                    </option>
                  ))}
                </select>
              </div>

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
