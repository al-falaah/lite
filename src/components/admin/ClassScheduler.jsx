import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  X as XIcon,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  Phone,
  Plus,
  BarChart3,
  Zap,
  Edit2,
  Video,
  RefreshCw
} from 'lucide-react';
import { applications, classSchedules, students } from '../../services/supabase';
import { supabase } from '../../services/supabase';
import Card from '../common/Card';
import Button from '../common/Button';
import { toast } from 'sonner';
import { PROGRAMS, PROGRAM_IDS, getProgramMilestones } from '../../config/programs';

// Calculate current milestone based on week number and program
const getCurrentMilestone = (currentWeek, programId) => {
  const milestones = getProgramMilestones(programId);

  // Fallback if no milestones defined for program
  if (!milestones || milestones.length === 0) {
    return {
      id: 1,
      name: 'Progress',
      subtitle: 'Making Progress',
      weekStart: 1,
      weekEnd: 52,
      weeksInMilestone: 52,
      weeksCompleted: currentWeek - 1,
      milestoneProgress: Math.round(((currentWeek - 1) / 52) * 100),
      isCompleted: false
    };
  }

  const milestone = milestones.find(
    m => currentWeek >= m.weekStart && currentWeek <= m.weekEnd
  );

  if (!milestone) {
    return {
      ...milestones[milestones.length - 1],
      isCompleted: true,
      weeksInMilestone: 0,
      weeksCompleted: 0,
      milestoneProgress: 100
    };
  }

  const weeksInMilestone = milestone.weekEnd - milestone.weekStart + 1;
  const weeksCompleted = currentWeek - milestone.weekStart;
  const milestoneProgress = Math.round((weeksCompleted / weeksInMilestone) * 100);

  return {
    ...milestone,
    weeksInMilestone,
    weeksCompleted,
    milestoneProgress,
    isCompleted: false
  };
};

const ClassScheduler = () => {
  const [applicants, setApplicants] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showApplicantList, setShowApplicantList] = useState(true);
  const [viewMode, setViewMode] = useState('students'); // Only students view
  const [scheduleFilter, setScheduleFilter] = useState('all'); // 'all', 'with-schedules', 'without-schedules'
  const [selectedProgram, setSelectedProgram] = useState('essentials'); // 'essentials' or 'tajweed' - for viewing schedules
  const [progress, setProgress] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Scheduling modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    student_id: '',
    day_of_week: '',
    class_time: '',
    class_type: 'main', // main or makeup
    status: 'scheduled',
    academic_year: 1, // Default to year 1
    week_number: 1,
    meeting_link: ''
  });

  // Generate Full Schedule modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    program: '',
    main_day_of_week: '',
    short_day_of_week: '',
    main_class_time: '',
    short_class_time: '',
    meeting_link: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const times = [
    { label: 'Morning', range: '6:00 AM - 12:00 PM', hours: [6, 7, 8, 9, 10, 11], totalHours: 6 },
    { label: 'Afternoon', range: '12:00 PM - 5:00 PM', hours: [12, 13, 14, 15, 16], totalHours: 5 },
    { label: 'Evening', range: '5:00 PM - 9:00 PM', hours: [17, 18, 19, 20], totalHours: 4 },
    { label: 'Night', range: '9:00 PM - 12:00 AM', hours: [21, 22, 23], totalHours: 3 }
  ];

  // Helper to format time in 12-hour format
  const formatTime = (time24) => {
    if (!time24) return '';
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  // Calculate which hours are booked and which are free within a time slot
  const getSlotUtilization = (day, timeSlot, bookedClasses) => {
    const bookedHours = new Set();

    bookedClasses.forEach(schedule => {
      if (schedule.class_time) {
        const [startHour] = schedule.class_time.split(':').map(Number);
        const duration = schedule.class_type === 'main' ? 2 : 0.5; // 2 hours or 30 min

        // Mark hours as booked
        for (let i = 0; i < duration; i++) {
          bookedHours.add(startHour + i);
        }
      }
    });

    const freeHours = timeSlot.hours.filter(h => !bookedHours.has(h));
    const bookedCount = bookedHours.size;
    const freeCount = freeHours.length;
    const utilizationPercent = (bookedCount / timeSlot.totalHours) * 100;

    return {
      bookedHours: Array.from(bookedHours).sort((a, b) => a - b),
      freeHours,
      bookedCount,
      freeCount,
      utilizationPercent,
      hasPartialAvailability: freeCount > 0 && bookedCount > 0
    };
  };

  // Open scheduling modal with pre-filled data
  const openScheduleModal = (day, timeSlot) => {
    // Only allow scheduling for enrolled students
    if (viewMode !== 'students' || !selectedApplicant) {
      toast.error('Please select an enrolled student to schedule a class');
      return;
    }

    // Find a free hour in the time slot
    const bookedClasses = getScheduledClassesForSlot(day, timeSlot);
    const utilization = getSlotUtilization(day, timeSlot, bookedClasses);

    if (utilization.freeHours.length === 0) {
      toast.error('No free hours in this time slot');
      return;
    }

    // Use the first free hour
    const suggestedHour = utilization.freeHours[0];
    const suggestedTime = `${suggestedHour.toString().padStart(2, '0')}:00`;

    setScheduleForm({
      student_id: selectedApplicant.id,
      day_of_week: day,
      class_time: suggestedTime,
      class_type: 'main',
      status: 'scheduled',
      academic_year: 1
    });
    setShowScheduleModal(true);
  };

  // Load student progress
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

  // Get the current active week and year for a student (program-aware)
  const getCurrentActiveWeekAndYear = () => {
    if (!selectedApplicant) return { year: 1, week: 1 };

    // Filter by selected program
    const studentSchedules = scheduledClasses.filter(s =>
      s.student_id === selectedApplicant.id && s.program === selectedProgram
    );
    if (studentSchedules.length === 0) return { year: 1, week: 1 };

    const weekMap = {};

    studentSchedules.forEach(schedule => {
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

  // Generate full schedule for a student
  const handleGenerateFullSchedule = async () => {
    if (!selectedApplicant) {
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
        .eq('student_id', selectedApplicant.id)
        .eq('program', generateForm.program)
        .limit(1);

      if (checkError) throw checkError;

      if (existingSchedules && existingSchedules.length > 0) {
        const programConfig = PROGRAMS[generateForm.program];
        const programName = programConfig?.name || generateForm.program;
        toast.error(`Schedules already exist for ${programName}. Delete existing schedules first.`);
        setGenerating(false);
        return;
      }

      // Determine number of weeks based on program from centralized config
      const programConfig = PROGRAMS[generateForm.program];
      const totalWeeks = programConfig?.duration.weeks || 52;
      const totalYears = programConfig?.duration.years || 1;

      // Generate schedules
      const schedulesToCreate = [];

      for (let year = 1; year <= totalYears; year++) {
        for (let week = 1; week <= totalWeeks; week++) {
          // Main class (2 hours) - can be on different day
          schedulesToCreate.push({
            student_id: selectedApplicant.id,
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
            student_id: selectedApplicant.id,
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
      const programName = programConfig?.name || generateForm.program;
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
      loadData(); // Reload data
      if (selectedApplicant) {
        loadStudentProgress(selectedApplicant.id);
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast.error(error.message || 'Failed to generate schedule');
    } finally {
      setGenerating(false);
    }
  };

  // Create or update a class schedule
  const handleCreateSchedule = async (e) => {
    e.preventDefault();

    try {
      if (editingSchedule) {
        // Update existing schedule
        const { error } = await supabase
          .from('class_schedules')
          .update(scheduleForm)
          .eq('id', editingSchedule.id);

        if (error) throw error;

        // Update local state
        setScheduledClasses(prev =>
          prev.map(schedule =>
            schedule.id === editingSchedule.id
              ? { ...schedule, ...scheduleForm }
              : schedule
          )
        );

        toast.success('Class rescheduled successfully');
      } else {
        // Create new schedule
        const response = await classSchedules.create(scheduleForm);

        if (response.error) {
          throw response.error;
        }

        toast.success('Class scheduled successfully');
        loadData(); // Reload to show the new schedule
      }

      setShowScheduleModal(false);
      setEditingSchedule(null);
      if (selectedApplicant) {
        loadStudentProgress(selectedApplicant.id);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule: ' + error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedApplicant && viewMode === 'students') {
      loadStudentProgress(selectedApplicant.id);
    }
  }, [selectedApplicant, viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent infinite loading
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      // Load applications, students with enrollments, and scheduled classes
      const dataFetch = Promise.all([
        applications.getAll(),
        // Load students with their enrollments (including availability data)
        supabase
          .from('students')
          .select(`
            *,
            enrollments (
              id,
              program,
              status,
              enrolled_date,
              preferred_days,
              preferred_times,
              timezone,
              availability_notes
            )
          `)
          .order('created_at', { ascending: false }),
        classSchedules.getScheduled()
      ]);

      // Race between data fetch and timeout
      const [appsResponse, studentsResponse, schedulesResponse] = await Promise.race([dataFetch, timeout]);

      if (appsResponse.error) {
        console.error('Error loading applicants:', appsResponse.error);
      } else {
        // Filter only PENDING applicants with availability data
        const pendingApplicants = appsResponse.data.filter(
          app => app.status === 'pending' && app.preferred_days && app.preferred_days.length > 0
        );
        setApplicants(pendingApplicants);

        // Auto-select first applicant if in applicants mode
        if (viewMode === 'applicants' && pendingApplicants.length > 0 && !selectedApplicant) {
          setSelectedApplicant(pendingApplicants[0]);
        }
      }

      if (studentsResponse.error) {
        console.error('Error loading students:', studentsResponse.error);
      } else {
        // Filter enrolled students with availability data
        const studentsWithAvailability = studentsResponse.data.filter(
          student => student.status === 'enrolled' && student.preferred_days && student.preferred_days.length > 0
        );
        setEnrolledStudents(studentsWithAvailability);

        // Auto-select first student if in students mode
        if (viewMode === 'students' && studentsWithAvailability.length > 0 && !selectedApplicant) {
          setSelectedApplicant(studentsWithAvailability[0]);
        }
      }

      if (schedulesResponse.error) {
        console.error('Error loading schedules:', schedulesResponse.error);
      } else {
        setScheduledClasses(schedulesResponse.data || []);
      }

      setError(null);
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.message === 'Request timeout') {
        setError('Request timed out. Please check your connection and try again.');
        toast.error('Request timed out. Click Retry to load again.');
      } else {
        setError('An error occurred loading data');
        toast.error('An error occurred loading data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter applicants or students based on search and view mode
  const currentList = viewMode === 'applicants' ? applicants : enrolledStudents;

  // Apply search filter
  let filteredList = currentList.filter(item =>
    item.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply schedule filter (only for students view)
  if (viewMode === 'students' && scheduleFilter !== 'all') {
    filteredList = filteredList.filter(student => {
      const hasSchedule = scheduledClasses.some(schedule => schedule.student_id === student.id);

      if (scheduleFilter === 'with-schedules') {
        return hasSchedule;
      } else if (scheduleFilter === 'without-schedules') {
        return !hasSchedule;
      }
      return true;
    });
  }

  // Get scheduled classes for a specific day/time
  const getScheduledClassesForSlot = (day, timeSlot) => {
    return scheduledClasses.filter(schedule => {
      if (schedule.day_of_week !== day) return false;

      if (schedule.class_time && timeSlot.hours) {
        const [hour] = schedule.class_time.split(':').map(Number);
        return timeSlot.hours.includes(hour);
      }

      return false;
    });
  };

  // Check if selected applicant/student is available for this slot
  const isApplicantAvailable = (day, timeSlot) => {
    if (!selectedApplicant) return false;
    return (
      selectedApplicant.preferred_days?.includes(day) &&
      selectedApplicant.preferred_times?.includes(timeSlot.label)
    );
  };

  // Get all applicants/students available for a slot (for showing count)
  const getApplicantsForSlot = (day, timeSlot) => {
    return currentList.filter(
      item =>
        item.preferred_days?.includes(day) &&
        item.preferred_times?.includes(timeSlot.label)
    );
  };

  // Calculate summary statistics
  const stats = {
    totalApplicants: applicants.length,
    totalStudents: enrolledStudents.length,
    totalBookings: selectedApplicant && viewMode === 'students'
      ? scheduledClasses.filter(s => s.student_id === selectedApplicant.id).length
      : 0,  // Show 0 for applicants view or when no selection
    selectedApplicantSlots: selectedApplicant
      ? (selectedApplicant.preferred_days?.length || 0) *
        (selectedApplicant.preferred_times?.length || 0)
      : 0
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </Card>
    );
  }

  if (error && applicants.length === 0 && enrolledStudents.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
          <p className="text-gray-600 mb-6 text-center max-w-md">{error}</p>
          <Button onClick={loadData} variant="primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-emerald-600" />
            <span>Class Schedules</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Schedule classes and manage bookings
          </p>
        </div>
      </div>

      {/* Schedule Filter */}
      {(() => {
        // Calculate counts for each filter
        const studentsWithSchedules = enrolledStudents.filter(student =>
          scheduledClasses.some(schedule => schedule.student_id === student.id)
        ).length;
        const studentsWithoutSchedules = enrolledStudents.filter(student =>
          !scheduledClasses.some(schedule => schedule.student_id === student.id)
        ).length;

        return (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600 font-medium">Filter by schedule:</span>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setScheduleFilter('all')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  scheduleFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({enrolledStudents.length})
              </button>
              <button
                onClick={() => setScheduleFilter('with-schedules')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  scheduleFilter === 'with-schedules'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                With ({studentsWithSchedules})
              </button>
              <button
                onClick={() => setScheduleFilter('without-schedules')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  scheduleFilter === 'without-schedules'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Without ({studentsWithoutSchedules})
              </button>
            </div>
          </div>
        );
      })()}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {viewMode === 'applicants' ? 'Pending Applicants' : 'Enrolled Students'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-amber-600">
                {viewMode === 'applicants' ? stats.totalApplicants : stats.totalStudents}
              </p>
            </div>
            {viewMode === 'applicants' ? (
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 flex-shrink-0" />
            ) : (
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600 flex-shrink-0" />
            )}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Current Bookings</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {selectedApplicant ? `${selectedApplicant.full_name?.split(' ')[0]}'s Slots` : `Select ${viewMode === 'applicants' ? 'Applicant' : 'Student'}`}
              </p>
              <p className="text-2xl font-bold text-emerald-600">{stats.selectedApplicantSlots}</p>
            </div>
            <Clock className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
      </div>

      {/* Main Content: Split View */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left: Applicants/Students List */}
        <div className="lg:col-span-1">
          <Card>
            {/* Header with Collapse Toggle */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {viewMode === 'applicants' ? (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                ) : (
                  <Users className="h-5 w-5 text-emerald-600" />
                )}
                {viewMode === 'applicants' ? 'Applicants' : 'Students'} ({filteredList.length})
              </h3>
              <button
                onClick={() => setShowApplicantList(!showApplicantList)}
                className="text-gray-600 hover:text-emerald-600 transition-colors p-1 rounded-lg hover:bg-emerald-50"
                aria-label={showApplicantList ? 'Collapse list' : 'Expand list'}
              >
                {showApplicantList ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Search Bar */}
            {showApplicantList && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search applicants..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* List */}
            {showApplicantList && (
              <div className="space-y-2 max-h-[calc(100vh-25rem)] overflow-y-auto pr-2">
                {filteredList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedApplicant(item);
                      // Auto-select first program with schedules
                      if (viewMode === 'students' && item.enrollments) {
                        const programWithSchedules = item.enrollments.find(e =>
                          e.status === 'active' && scheduledClasses.some(s => s.student_id === item.id && s.program === e.program)
                        );
                        if (programWithSchedules) {
                          setSelectedProgram(programWithSchedules.program);
                        } else if (item.enrollments.length > 0) {
                          setSelectedProgram(item.enrollments[0].program);
                        }
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedApplicant?.id === item.id
                        ? 'bg-emerald-100 border-2 border-emerald-500 shadow-sm'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">{item.full_name}</div>
                    <div className="text-xs text-gray-600 mt-1 truncate">{item.email}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <div className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap">
                        {item.preferred_days?.length || 0} days
                      </div>
                      {viewMode === 'students' && item.student_id && (
                        <div className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 whitespace-nowrap font-mono">
                          {item.student_id}
                        </div>
                      )}
                      <div className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 whitespace-nowrap truncate max-w-[120px]" title={item.timezone || 'Pacific/Auckland'}>
                        {(item.timezone || 'Pacific/Auckland').split('/').pop()}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No {viewMode === 'applicants' ? 'applicants' : 'students'} found</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Calendar View */}
        <div className="lg:col-span-3">
          {selectedApplicant ? (
            <div className="space-y-6">
              {/* Applicant Info Card */}
              <Card>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{selectedApplicant.full_name}</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {selectedApplicant.email}
                      </div>
                      {selectedApplicant.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {selectedApplicant.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {selectedApplicant.timezone || 'Pacific/Auckland'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedApplicant.status === 'enrolled'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      {selectedApplicant.status}
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {selectedApplicant.status === 'enrolled' && selectedApplicant.enrolled_date
                        ? new Date(selectedApplicant.enrolled_date).toLocaleDateString()
                        : selectedApplicant.submitted_at
                        ? new Date(selectedApplicant.submitted_at).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                {selectedApplicant.availability_notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Availability Notes:</p>
                    <p className="text-sm text-gray-600 italic">{selectedApplicant.availability_notes}</p>
                  </div>
                )}

                {/* Progress Bars (Students view only) */}
                {viewMode === 'students' && progress && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
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
                  </div>
                )}

                {/* Current Week Schedule (Students view only) */}
                {viewMode === 'students' && scheduledClasses.filter(s => s.student_id === selectedApplicant?.id).length > 0 && (() => {
                  // Filter schedules by selected program
                  const studentSchedules = scheduledClasses.filter(s =>
                    s.student_id === selectedApplicant?.id && s.program === selectedProgram
                  );

                  // If no schedules for selected program, don't show the section
                  if (studentSchedules.length === 0) return null;

                  const currentActive = getCurrentActiveWeekAndYear();

                  // Calculate progress based on program using centralized config
                  const programConfig = PROGRAMS[selectedProgram];
                  const totalWeeks = programConfig?.duration.weeks * programConfig?.duration.years || 52;
                  const weeksPerYear = programConfig?.duration.weeks || 52;
                  const completedWeeks = (currentActive.year - 1) * weeksPerYear + currentActive.week - 1;
                  const progressPercent = Math.round((completedWeeks / totalWeeks) * 100);
                  const programMilestones = getProgramMilestones(selectedProgram);

                  // Get current week's classes
                  const currentWeekClasses = studentSchedules.filter(
                    s => s.academic_year === currentActive.year && s.week_number === currentActive.week
                  );

                  const mainClass = currentWeekClasses.find(c => c.class_type === 'main');
                  const shortClass = currentWeekClasses.find(c => c.class_type === 'short');

                  const handleMarkComplete = async (classId) => {
                    try {
                      const { error } = await supabase
                        .from('class_schedules')
                        .update({
                          status: 'completed',
                          completed_at: new Date().toISOString()
                        })
                        .eq('id', classId);

                      if (error) throw error;

                      toast.success('Class marked as completed');

                      // Reload schedules and progress to show updated week
                      const schedulesResponse = await classSchedules.getScheduled();
                      if (!schedulesResponse.error) {
                        setScheduledClasses(schedulesResponse.data || []);
                      }

                      if (selectedApplicant) {
                        loadStudentProgress(selectedApplicant.id);
                      }
                    } catch (error) {
                      console.error('Error marking complete:', error);
                      toast.error('Failed to mark as completed');
                    }
                  };

                  const openScheduleModal = (schedule = null) => {
                    if (schedule) {
                      setEditingSchedule(schedule);
                      setScheduleForm({
                        student_id: schedule.student_id,
                        academic_year: schedule.academic_year,
                        week_number: schedule.week_number,
                        class_type: schedule.class_type,
                        day_of_week: schedule.day_of_week || '',
                        class_time: schedule.class_time || '',
                        meeting_link: schedule.meeting_link || '',
                        status: schedule.status
                      });
                    }
                    setShowScheduleModal(true);
                  };

                  return (
                    <div className="mt-4">
                      <Card>
                        {/* Track Selector */}
                        {selectedApplicant?.enrollments?.filter(e => e.status === 'active').length > 1 && (
                          <div className="mb-4 pb-4 border-b border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Viewing Schedule For:
                            </label>
                            <div className="flex gap-2">
                              {selectedApplicant.enrollments.filter(e => e.status === 'active').map(enrollment => (
                                <button
                                  key={enrollment.program}
                                  onClick={() => setSelectedProgram(enrollment.program)}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    selectedProgram === enrollment.program
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {PROGRAMS[enrollment.program]?.name || enrollment.program}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Program Header */}
                        <div className="mb-6 pb-4 border-b border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                {PROGRAMS[selectedProgram]?.name || selectedProgram}
                              </h3>
                              <p className="text-sm text-gray-500 mt-0.5">Week {currentActive.week} • {progressPercent}% Complete</p>
                            </div>
                          </div>
                        </div>

                        {/* Milestone Tracker */}
                        <div className="mb-8">
                          {(() => {
                            const currentWeekNumber = (currentActive.year - 1) * weeksPerYear + currentActive.week;
                            const currentMilestone = getCurrentMilestone(currentWeekNumber, selectedProgram);
                            const totalMilestones = programMilestones.length || 1;

                            return (
                              <>
                                {/* Current Milestone Info */}
                                <div className="mb-4">
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <h4 className="text-lg font-semibold text-gray-900">
                                      {currentMilestone.name}
                                    </h4>
                                    <span className="text-xs text-gray-500">
                                      Milestone {currentMilestone.id} of {totalMilestones}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {currentMilestone.subtitle}
                                  </p>
                                </div>

                                {/* Milestone Timeline - Full Width */}
                                <div className="space-y-3">
                                  {/* Progress Track */}
                                  <div className="relative">
                                    {/* Background Track */}
                                    <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200" />

                                    {/* Progress Fill */}
                                    <div
                                      className="absolute top-3 left-0 h-0.5 bg-emerald-600 transition-all duration-500"
                                      style={{
                                        width: `${((currentMilestone.id - 1) / (totalMilestones - 1)) * 100}%`
                                      }}
                                    />

                                    {/* Milestone Nodes */}
                                    <div className="relative flex justify-between">
                                      {programMilestones.map((milestone) => {
                                        const isCompleted = currentMilestone.id > milestone.id;
                                        const isCurrent = currentMilestone.id === milestone.id;

                                        return (
                                          <div key={milestone.id} className="flex flex-col items-center">
                                            {/* Node Circle */}
                                            <div
                                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                                                isCompleted
                                                  ? 'bg-emerald-600 text-white'
                                                  : isCurrent
                                                  ? 'bg-emerald-600 text-white'
                                                  : 'bg-white border-2 border-gray-300 text-gray-400'
                                              }`}
                                              title={milestone.subtitle}
                                            >
                                              {isCompleted ? '✓' : milestone.id}
                                            </div>

                                            {/* Milestone Label - Hidden on small screens */}
                                            <span className={`mt-2 text-[10px] font-medium text-center max-w-[60px] leading-tight hidden sm:block ${
                                              isCurrent ? 'text-gray-900' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                                            }`}>
                                              {milestone.name}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Milestone Progress Info */}
                                  <div className="flex items-center justify-between text-xs text-gray-600 pt-2">
                                    <span>{currentMilestone.weeksCompleted} of {currentMilestone.weeksInMilestone} weeks completed</span>
                                    <span>{currentMilestone.milestoneProgress}%</span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Current Week Classes */}
                        {currentWeekClasses.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No classes scheduled for this week</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Main Class */}
                            {mainClass && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Clock className="h-4 w-4 text-gray-600" />
                                      <span className="text-sm font-semibold text-gray-900">
                                        Main Class
                                      </span>
                                      <span className="text-xs text-gray-500">2 hrs</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {mainClass.day_of_week} • {formatTime(mainClass.class_time) || 'Not set'}
                                    </p>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                                    mainClass.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    mainClass.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {mainClass.status === 'completed' ? 'Completed' :
                                     mainClass.status === 'scheduled' ? 'Scheduled' : mainClass.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  {mainClass.meeting_link && (
                                    <a
                                      href={mainClass.meeting_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-gray-600 hover:text-gray-900 font-medium inline-flex items-center"
                                    >
                                      <Video className="h-4 w-4 mr-1" />
                                      Join Meeting
                                    </a>
                                  )}
                                  <button
                                    onClick={() => openScheduleModal(mainClass)}
                                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center font-medium"
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Reschedule
                                  </button>
                                  {mainClass.status === 'scheduled' && (
                                    <button
                                      onClick={() => handleMarkComplete(mainClass.id)}
                                      className="text-sm text-emerald-700 hover:text-emerald-800 flex items-center font-medium ml-auto"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Mark Complete
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Short Class */}
                            {shortClass && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Clock className="h-4 w-4 text-gray-600" />
                                      <span className="text-sm font-semibold text-gray-900">
                                        Short Class
                                      </span>
                                      <span className="text-xs text-gray-500">30 min</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {shortClass.day_of_week} • {formatTime(shortClass.class_time) || 'Not set'}
                                    </p>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                                    shortClass.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    shortClass.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {shortClass.status === 'completed' ? 'Completed' :
                                     shortClass.status === 'scheduled' ? 'Scheduled' : shortClass.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  {shortClass.meeting_link && (
                                    <a
                                      href={shortClass.meeting_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-gray-600 hover:text-gray-900 font-medium inline-flex items-center"
                                    >
                                      <Video className="h-4 w-4 mr-1" />
                                      Join Meeting
                                    </a>
                                  )}
                                  <button
                                    onClick={() => openScheduleModal(shortClass)}
                                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center font-medium"
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Reschedule
                                  </button>
                                  {shortClass.status === 'scheduled' && (
                                    <button
                                      onClick={() => handleMarkComplete(shortClass.id)}
                                      className="text-sm text-emerald-700 hover:text-emerald-800 flex items-center font-medium ml-auto"
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

                        {/* Overall Progress Tracker */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          {(() => {
                            const completedClasses = studentSchedules.filter(
                              s => s.program === selectedProgram && s.status === 'completed'
                            ).length;
                            const totalClasses = totalWeeks * 2; // 2 classes per week (main + short)
                            const completionPercent = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;

                            return (
                              <div>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-semibold text-gray-700">Overall Progress</h4>
                                  <span className="text-2xl font-bold text-emerald-600">{completionPercent}%</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                                  <div
                                    className="absolute top-0 left-0 h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${completionPercent}%` }}
                                  />
                                </div>

                                {/* Class Count */}
                                <div className="flex items-center justify-between text-xs text-gray-600">
                                  <span>{completedClasses} of {totalClasses} classes completed</span>
                                  <span>{totalClasses - completedClasses} remaining</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </Card>
                    </div>
                  );
                })()}
              </Card>

              {/* Show Generate Full Schedule button only if student has unscheduled programs */}
              {viewMode === 'students' && selectedApplicant && (() => {
                // Get active enrollments
                const activeEnrollments = selectedApplicant.enrollments?.filter(e => e.status === 'active') || [];

                if (activeEnrollments.length === 0) return null;

                // Check which programs have schedules
                const studentSchedules = scheduledClasses.filter(s => s.student_id === selectedApplicant.id);
                const scheduledPrograms = new Set(studentSchedules.map(s => s.program));

                // Find programs without schedules
                const unscheduledPrograms = activeEnrollments.filter(e => !scheduledPrograms.has(e.program));

                // Only show button if there are unscheduled programs
                if (unscheduledPrograms.length === 0) return null;

                return (
                  <Card>
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-emerald-600" />
                      <p className="text-lg font-medium mb-2 text-gray-900">Generate Track Schedule</p>
                      <p className="text-sm mb-6 text-gray-600">
                        {unscheduledPrograms.length === 1
                          ? `${PROGRAMS[unscheduledPrograms[0].program]?.shortName || unscheduledPrograms[0].program} Track needs scheduling`
                          : `${unscheduledPrograms.length} tracks need scheduling`}
                      </p>
                      <button
                        onClick={() => setShowGenerateModal(true)}
                        className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                      >
                        <Zap className="h-5 w-5 mr-2" />
                        Generate Full Schedule
                      </button>
                    </div>
                  </Card>
                );
              })()}

              {/* Weekly Availability Overview sections removed - using Google Calendar instead.
                  Availability info still shown in Generate Full Schedule modal. */}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Select an applicant to view their availability</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Scheduling Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingSchedule ? 'Reschedule Class' : 'Schedule Class'}
              </h3>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingSchedule(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              {/* Student Info */}
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm font-medium text-emerald-900">
                  {selectedApplicant?.full_name}
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  {selectedApplicant?.email}
                </p>
                {selectedApplicant?.student_id && (
                  <p className="text-xs text-emerald-700">
                    ID: {selectedApplicant.student_id}
                  </p>
                )}
              </div>

              {/* Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week
                </label>
                <select
                  value={scheduleForm.day_of_week}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Time
                </label>
                <input
                  type="time"
                  value={scheduleForm.class_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, class_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Main classes are 2 hours long</p>
              </div>

              {/* Class Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Type
                </label>
                <select
                  value={scheduleForm.class_type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, class_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="main">Main Class (2 hours)</option>
                  <option value="makeup">Makeup Class (30 min)</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Schedule Class
                </button>
              </div>
            </form>
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
              {/* Track Selector - Only show tracks student is enrolled in WITHOUT schedules */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Track <span className="text-red-600">*</span>
                </label>
                <select
                  value={generateForm.program}
                  onChange={(e) => setGenerateForm({ ...generateForm, program: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select track</option>
                  {(() => {
                    // Get active enrollments
                    const activeEnrollments = selectedApplicant?.enrollments?.filter(e => e.status === 'active') || [];

                    // Get programs that already have schedules
                    const studentSchedules = scheduledClasses.filter(s => s.student_id === selectedApplicant?.id);
                    const scheduledPrograms = new Set(studentSchedules.map(s => s.program));

                    // Filter to only show unscheduled programs
                    const unscheduledEnrollments = activeEnrollments.filter(e => !scheduledPrograms.has(e.program));

                    return unscheduledEnrollments.map(enrollment => {
                      const config = PROGRAMS[enrollment.program];
                      const duration = config?.duration.display || '';
                      return (
                        <option key={enrollment.program} value={enrollment.program}>
                          {config?.name || enrollment.program} ({duration})
                        </option>
                      );
                    });
                  })()}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {generateForm.program ? (() => {
                    const config = PROGRAMS[generateForm.program];
                    if (!config) return 'Choose a track to continue';
                    const totalClasses = config.duration.weeks * config.duration.years * 2;
                    return `Will create ${totalClasses} classes (${config.duration.years} year${config.duration.years > 1 ? 's' : ''} × ${config.duration.weeks} weeks × 2 classes)`;
                  })() : 'Choose a track to continue'}
                </p>
              </div>

              {/* Show student's preferred availability for selected program */}
              {generateForm.program && (() => {
                const selectedEnrollment = selectedApplicant?.enrollments?.find(e => e.program === generateForm.program);

                // Fall back to student-level availability if enrollment doesn't have it
                const preferredDays = selectedEnrollment?.preferred_days || selectedApplicant?.preferred_days;
                const preferredTimes = selectedEnrollment?.preferred_times || selectedApplicant?.preferred_times;
                const availabilityNotes = selectedEnrollment?.availability_notes || selectedApplicant?.availability_notes;
                const timezone = selectedEnrollment?.timezone || selectedApplicant?.timezone;

                if (!preferredDays && !preferredTimes) {
                  return null;
                }

                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Student's Preferred Availability</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {preferredDays && preferredDays.length > 0 && (
                        <div>
                          <span className="font-medium text-blue-800">Preferred Days:</span>
                          <p className="text-blue-700 capitalize">{preferredDays.join(', ')}</p>
                        </div>
                      )}
                      {preferredTimes && preferredTimes.length > 0 && (
                        <div>
                          <span className="font-medium text-blue-800">Preferred Times:</span>
                          <p className="text-blue-700 capitalize">{preferredTimes.join(', ')}</p>
                        </div>
                      )}
                    </div>
                    {timezone && (
                      <div className="mt-2">
                        <span className="font-medium text-blue-800 text-sm">Timezone:</span>
                        <p className="text-blue-700 text-sm">{timezone}</p>
                      </div>
                    )}
                    {availabilityNotes && (
                      <div className="mt-2">
                        <span className="font-medium text-blue-800 text-sm">Notes:</span>
                        <p className="text-blue-700 text-sm">{availabilityNotes}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

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

              {generateForm.program && (() => {
                const config = PROGRAMS[generateForm.program];
                if (!config) return null;
                const totalClasses = config.duration.weeks * config.duration.years * 2;
                const classesPerYear = config.duration.weeks * 2;

                return (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-900">
                      This will create <strong>{totalClasses} classes</strong> for {selectedApplicant?.full_name}:
                    </p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                      {Array.from({ length: config.duration.years }, (_, i) => (
                        <li key={i}>Year {i + 1}: {config.duration.weeks} weeks × 2 classes = {classesPerYear} classes</li>
                      ))}
                      <li>Main classes on {generateForm.main_day_of_week || '[Day]'}</li>
                      <li>Short classes on {generateForm.short_day_of_week || '[Day]'}</li>
                    </ul>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={generating}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateFullSchedule}
                disabled={generating}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 inline-flex items-center"
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
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassScheduler;
