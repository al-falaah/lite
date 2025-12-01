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
  Zap
} from 'lucide-react';
import { applications, classSchedules, students } from '../../services/supabase';
import { supabase } from '../../services/supabase';
import Card from '../common/Card';
import { toast } from 'react-toastify';

const AvailabilityCalendar = () => {
  const [applicants, setApplicants] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showApplicantList, setShowApplicantList] = useState(true);
  const [viewMode, setViewMode] = useState('applicants'); // 'applicants' or 'students'
  const [progress, setProgress] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Scheduling modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    student_id: '',
    day_of_week: '',
    class_time: '',
    class_type: 'main', // main or makeup
    status: 'scheduled',
    academic_year: 1 // Default to year 1
  });

  // Generate Full Schedule modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
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

  // Get the current active week and year for a student
  const getCurrentActiveWeekAndYear = () => {
    if (!selectedApplicant) return { year: 1, week: 1 };

    const studentSchedules = scheduledClasses.filter(s => s.student_id === selectedApplicant.id);
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

    if (!generateForm.main_day_of_week || !generateForm.short_day_of_week ||
        !generateForm.main_class_time || !generateForm.short_class_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    try {
      // Generate 104 weeks of schedules (52 weeks × 2 years)
      const schedulesToCreate = [];

      for (let year = 1; year <= 2; year++) {
        for (let week = 1; week <= 52; week++) {
          // Main class (2 hours) - can be on different day
          schedulesToCreate.push({
            student_id: selectedApplicant.id,
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

      toast.success('Full schedule generated successfully! (208 classes created)');
      setShowGenerateModal(false);
      setGenerateForm({
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

  // Create a new class schedule
  const handleCreateSchedule = async (e) => {
    e.preventDefault();

    try {
      const response = await classSchedules.create(scheduleForm);

      if (response.error) {
        throw response.error;
      }

      toast.success('Class scheduled successfully!');
      setShowScheduleModal(false);
      loadData(); // Reload to show the new schedule
      if (selectedApplicant) {
        loadStudentProgress(selectedApplicant.id);
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule: ' + error.message);
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

      // Load applications, students, and scheduled classes
      const [appsResponse, studentsResponse, schedulesResponse] = await Promise.all([
        applications.getAll(),
        students.getAll(),
        classSchedules.getScheduled()
      ]);

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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter applicants or students based on search and view mode
  const currentList = viewMode === 'applicants' ? applicants : enrolledStudents;
  const filteredList = currentList.filter(item =>
    item.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    totalBookings: scheduledClasses.length,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-emerald-600" />
            Scheduling & Availability
          </h2>
          <p className="text-gray-600 mt-1">
            View availability, schedule classes, and manage bookings
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setViewMode('applicants');
              setSelectedApplicant(applicants[0] || null);
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'applicants'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Applicants ({stats.totalApplicants})
          </button>
          <button
            onClick={() => {
              setViewMode('students');
              setSelectedApplicant(enrolledStudents[0] || null);
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'students'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4 inline mr-1" />
            Students ({stats.totalStudents})
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {viewMode === 'applicants' ? 'Pending Applicants' : 'Enrolled Students'}
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {viewMode === 'applicants' ? stats.totalApplicants : stats.totalStudents}
              </p>
            </div>
            {viewMode === 'applicants' ? (
              <AlertCircle className="h-8 w-8 text-amber-600" />
            ) : (
              <Users className="h-8 w-8 text-emerald-600" />
            )}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Bookings</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
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
                    onClick={() => setSelectedApplicant(item)}
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
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-amber-600 text-white">
                      {selectedApplicant.status}
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {new Date(selectedApplicant.submitted_at).toLocaleDateString()}
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

                {/* Current Week Tracking (Students view only) */}
                {viewMode === 'students' && scheduledClasses.filter(s => s.student_id === selectedApplicant?.id).length > 0 && (() => {
                  const studentSchedules = scheduledClasses.filter(s => s.student_id === selectedApplicant?.id);
                  const currentActive = getCurrentActiveWeekAndYear();
                  const progressPercent = Math.round(((currentActive.year - 1) * 52 + currentActive.week - 1) / 104 * 100);

                  return (
                    <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Current Week</p>
                          <p className="text-2xl font-bold text-emerald-900">
                            Week {currentActive.week} of 52
                          </p>
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
                          <p className="text-3xl font-bold text-emerald-600">
                            {progressPercent}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {(currentActive.year - 1) * 52 + currentActive.week - 1} of 104 weeks
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Card>

              {/* Show Generate Full Schedule button if student has no schedules */}
              {viewMode === 'students' && scheduledClasses.filter(s => s.student_id === selectedApplicant?.id).length === 0 && (
                <Card>
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No schedule generated yet</p>
                    <p className="text-sm mb-6">Generate a full 2-year schedule with one click</p>
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      Generate Full Schedule
                    </button>
                  </div>
                </Card>
              )}

              {/* Weekly Calendar */}
              <Card>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    Weekly Availability Overview
                  </h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600">
                      Each cell shows exact booking times and available hours within the time slot
                    </p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 bg-emerald-200 border-2 border-emerald-500 rounded"></span>
                        <span className="text-gray-700">Applicant available</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 bg-blue-200 border-2 border-blue-500 rounded"></span>
                        <span className="text-gray-700">Currently booked</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 bg-purple-200 border-2 border-purple-500 rounded"></span>
                        <span className="text-gray-700">Conflict (check for partial availability)</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 bg-gradient-to-br from-purple-100 to-emerald-50 border-2 border-purple-400 rounded"></span>
                        <span className="text-gray-700">Partial conflict (some hours free!)</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr>
                        <th className="border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0">
                          Time
                        </th>
                        {days.map(day => (
                          <th key={day} className="border border-gray-200 bg-gray-50 px-3 py-3 text-center text-sm font-semibold text-gray-700">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {times.map(timeSlot => (
                        <tr key={timeSlot.label}>
                          <td className="border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 sticky left-0">
                            <div className="font-semibold">{timeSlot.label}</div>
                            <div className="text-xs text-gray-500">{timeSlot.range}</div>
                          </td>
                          {days.map(day => {
                            const bookedClasses = getScheduledClassesForSlot(day, timeSlot);
                            const applicantAvailable = isApplicantAvailable(day, timeSlot);
                            const otherApplicants = getApplicantsForSlot(day, timeSlot).filter(
                              app => app.id !== selectedApplicant.id
                            );
                            const utilization = getSlotUtilization(day, timeSlot, bookedClasses);
                            const hasBoth = bookedClasses.length > 0 && applicantAvailable;
                            const hasPartialAvailability = utilization.hasPartialAvailability;

                            let bgColor = 'bg-white';
                            let borderColor = 'border-gray-200';
                            let textColor = 'text-gray-400';

                            if (hasBoth) {
                              // Conflict: applicant wants this but it's booked
                              if (hasPartialAvailability) {
                                // Partial conflict - some hours free
                                bgColor = 'bg-gradient-to-br from-purple-100 to-emerald-50';
                                borderColor = 'border-purple-400';
                                textColor = 'text-purple-900';
                              } else {
                                // Full conflict - all hours booked
                                bgColor = 'bg-purple-100';
                                borderColor = 'border-purple-400';
                                textColor = 'text-purple-900';
                              }
                            } else if (applicantAvailable) {
                              if (hasPartialAvailability) {
                                // Applicant available, some hours booked
                                bgColor = 'bg-gradient-to-br from-emerald-100 to-blue-50';
                                borderColor = 'border-emerald-400';
                              } else {
                                // Applicant available, fully free
                                bgColor = 'bg-emerald-100';
                                borderColor = 'border-emerald-400';
                              }
                              textColor = 'text-emerald-900';
                            } else if (bookedClasses.length > 0) {
                              if (hasPartialAvailability) {
                                // Partially booked
                                bgColor = 'bg-blue-50';
                                borderColor = 'border-blue-300';
                              } else {
                                // Fully booked
                                bgColor = 'bg-blue-100';
                                borderColor = 'border-blue-400';
                              }
                              textColor = 'text-blue-900';
                            }

                            const canSchedule = viewMode === 'students' && selectedApplicant && utilization.freeCount > 0;

                            return (
                              <td
                                key={day}
                                onClick={() => canSchedule && openScheduleModal(day, timeSlot)}
                                className={`border-2 ${borderColor} ${bgColor} px-2 py-3 text-center text-sm transition-all relative group ${
                                  canSchedule ? 'cursor-pointer hover:ring-2 hover:ring-emerald-500 hover:ring-offset-1' : ''
                                }`}
                                title={
                                  hasBoth
                                    ? `⚠️ Conflict: ${utilization.bookedCount}h booked, ${utilization.freeCount}h free | Applicant wants this slot${canSchedule ? ' | Click to schedule' : ''}`
                                    : applicantAvailable
                                    ? `✓ Applicant available | ${utilization.freeCount}h free${otherApplicants.length > 0 ? ` | +${otherApplicants.length} others` : ''}${canSchedule ? ' | Click to schedule' : ''}`
                                    : bookedClasses.length > 0
                                    ? `${utilization.bookedCount}h booked, ${utilization.freeCount}h free${canSchedule ? ' | Click to schedule' : ''}`
                                    : 'No bookings or availability'
                                }
                              >
                                {/* Utilization bar at top */}
                                {bookedClasses.length > 0 && (
                                  <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                                    <div
                                      className="h-full bg-blue-500"
                                      style={{ width: `${utilization.utilizationPercent}%` }}
                                    />
                                  </div>
                                )}

                                {/* Schedule button on hover */}
                                {canSchedule && (
                                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-emerald-600 text-white rounded-full p-1">
                                      <Plus className="h-3 w-3" />
                                    </div>
                                  </div>
                                )}

                                {hasBoth && (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-center gap-1">
                                      <AlertCircle className="h-4 w-4 text-purple-700" />
                                      <span className="text-xs font-bold text-purple-900">CONFLICT</span>
                                    </div>
                                    {bookedClasses.map((schedule, idx) => (
                                      <div key={idx} className="text-xs bg-white/50 rounded px-1 py-0.5">
                                        <div className="font-semibold text-purple-900">
                                          {formatTime(schedule.class_time)}
                                        </div>
                                        <div className="text-purple-700 truncate">
                                          {schedule.students?.full_name?.split(' ')[0]}
                                        </div>
                                      </div>
                                    ))}
                                    {utilization.freeCount > 0 && (
                                      <div className="text-xs text-emerald-700 font-medium mt-1">
                                        ✓ {utilization.freeCount}h available
                                      </div>
                                    )}
                                  </div>
                                )}

                                {!hasBoth && applicantAvailable && (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-center gap-1">
                                      <CheckCircle className="h-4 w-4 text-emerald-700" />
                                      <span className="text-xs font-semibold text-emerald-900">Available</span>
                                    </div>
                                    {bookedClasses.length > 0 && (
                                      <div className="space-y-0.5 mt-1">
                                        {bookedClasses.map((schedule, idx) => (
                                          <div key={idx} className="text-xs bg-blue-100 rounded px-1 py-0.5">
                                            <div className="font-medium text-blue-900">
                                              {formatTime(schedule.class_time)}
                                            </div>
                                          </div>
                                        ))}
                                        <div className="text-xs text-emerald-700 font-medium">
                                          {utilization.freeCount}h free
                                        </div>
                                      </div>
                                    )}
                                    {otherApplicants.length > 0 && (
                                      <div className="text-xs text-emerald-700 mt-1">
                                        +{otherApplicants.length} others
                                      </div>
                                    )}
                                  </div>
                                )}

                                {!hasBoth && !applicantAvailable && bookedClasses.length > 0 && (
                                  <div className="space-y-1">
                                    {bookedClasses.map((schedule, idx) => (
                                      <div key={idx} className="text-xs bg-white/60 rounded px-1 py-0.5">
                                        <div className="font-bold text-blue-900">
                                          {formatTime(schedule.class_time)}
                                        </div>
                                        <div className="text-blue-700 truncate">
                                          {schedule.students?.full_name?.split(' ')[0] || 'Student'}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                          {schedule.class_type === 'main' ? '2h' : '30m'}
                                        </div>
                                      </div>
                                    ))}
                                    {utilization.freeCount > 0 && (
                                      <div className="text-xs text-blue-700 font-medium bg-white/40 rounded px-1 py-0.5">
                                        {utilization.freeCount}h available
                                      </div>
                                    )}
                                  </div>
                                )}

                                {!hasBoth && !applicantAvailable && bookedClasses.length === 0 && (
                                  <div className={`${textColor} text-xl`}>-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Applicant Preferences Summary */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferred Schedule</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Preferred Days:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplicant.preferred_days?.map(day => (
                        <span key={day} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Preferred Times:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplicant.preferred_times?.map(time => (
                        <span key={time} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
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
              <h3 className="text-xl font-bold text-gray-900">Schedule Class</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
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
                <p className="text-sm text-blue-900">
                  This will create <strong>208 classes</strong> for {selectedApplicant?.full_name}:
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                  <li>Year 1: 52 weeks × 2 classes = 104 classes</li>
                  <li>Year 2: 52 weeks × 2 classes = 104 classes</li>
                  <li>Main classes on {generateForm.main_day_of_week || '[Day]'}</li>
                  <li>Short classes on {generateForm.short_day_of_week || '[Day]'}</li>
                </ul>
              </div>
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

export default AvailabilityCalendar;
