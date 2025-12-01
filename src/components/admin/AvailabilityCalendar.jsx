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
  Plus
} from 'lucide-react';
import { applications, classSchedules, students } from '../../services/supabase';
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

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule: ' + error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
              </Card>

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
    </div>
  );
};

export default AvailabilityCalendar;
