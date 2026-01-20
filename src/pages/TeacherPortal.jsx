import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, BookOpen, LogOut, Users, UserX, Calendar, BarChart3, Eye, X, CheckCircle, Mail, Send, XCircle, Settings } from 'lucide-react';
import { supabase, teachers, teacherAssignments, students, classSchedules } from '../services/supabase';
import Button from '../components/common/Button';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

// Get milestones from centralized config
const TAJWEED_MILESTONES = PROGRAMS[PROGRAM_IDS.TAJWEED].milestones;
const EAIS_MILESTONES = PROGRAMS[PROGRAM_IDS.ESSENTIALS].milestones;

// Calculate current milestone based on week number
const getCurrentMilestone = (currentWeek, isTajweed) => {
  const milestones = isTajweed ? TAJWEED_MILESTONES : EAIS_MILESTONES;

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

export default function TeacherPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(false);

  // Login form
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');

  // Password change modal

  // Data
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [removedStudents, setRemovedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSchedules, setStudentSchedules] = useState([]);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [activeView, setActiveView] = useState('assigned'); // assigned or removed

  // Schedule editing
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editedScheduleData, setEditedScheduleData] = useState({});

  // Current assignment program (for filtering)
  const [currentAssignmentProgram, setCurrentAssignmentProgram] = useState(null);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState(null);
  const [emailMessage, setEmailMessage] = useState('');

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    const savedTeacher = localStorage.getItem('teacher');
    if (savedTeacher) {
      const teacherData = JSON.parse(savedTeacher);
      setTeacher(teacherData);
      setIsAuthenticated(true);
      loadTeacherData(teacherData.id);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine if staffId is an email or staff ID
      const isEmail = staffId.includes('@');
      let teacherEmail = staffId;

      // If it's a staff ID, look up the teacher to get their email
      if (!isEmail) {
        const { data: teacherData, error: teacherError } = await teachers.getByStaffId(staffId);

        if (teacherError || !teacherData) {
          toast.error('Invalid Staff ID or password');
          setLoading(false);
          return;
        }

        if (!teacherData.is_active) {
          toast.error('Your account is inactive. Please contact admin.');
          setLoading(false);
          return;
        }

        teacherEmail = teacherData.email;
      }

      // Authenticate with Supabase Auth using email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: teacherEmail,
        password: password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast.error('Invalid credentials or password');
        setLoading(false);
        return;
      }

      // Get teacher record using auth_user_id
      const { data: teacherRecord, error: teacherRecordError } = await teachers.getByAuthUserId(authData.user.id);

      if (teacherRecordError || !teacherRecord) {
        toast.error('Teacher account not found');
        setLoading(false);
        return;
      }

      if (!teacherRecord.is_active) {
        toast.error('Your account is inactive. Please contact admin.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Login successful
      setTeacher(teacherRecord);
      setIsAuthenticated(true);
      localStorage.setItem('teacher', JSON.stringify(teacherRecord));

      toast.success(`Welcome, ${teacherRecord.full_name}!`);
      // Load teacher data
      await loadTeacherData(teacherRecord.id);
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An error occurred during login');
    }

    setLoading(false);
  };


  const handleLogout = async () => {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();

    setIsAuthenticated(false);
    setTeacher(null);
    setAssignedStudents([]);
    setRemovedStudents([]);
    setSelectedStudent(null);
    localStorage.removeItem('teacher');
    toast.success('Logged out successfully');
  };

  const loadTeacherData = async (teacherId) => {
    setLoading(true);

    try {
      // Load assigned students
      const { data: assigned, error: assignedError } = await teacherAssignments.getByTeacher(teacherId, 'assigned');
      if (assignedError) {
        console.error('Error loading assigned students:', assignedError);
      } else {
        setAssignedStudents(assigned || []);
      }

      // Load removed students
      const { data: removed, error: removedError } = await teacherAssignments.getByTeacher(teacherId, 'removed');
      if (removedError) {
        console.error('Error loading removed students:', removedError);
      } else {
        setRemovedStudents(removed || []);
      }
    } catch (err) {
      console.error('Error loading teacher data:', err);
      toast.error('Failed to load student data');
    }

    setLoading(false);
  };

  const handleViewStudent = async (assignment) => {
    setLoading(true);
    setSelectedStudent(assignment.student);
    setCurrentAssignmentProgram(assignment.program); // Save the program for filtering

    try {
      // Load student schedules - filter by the program the teacher is assigned to teach
      const { data: schedulesData, error: schedulesError } = await classSchedules.getByStudentId(assignment.student.id);
      if (schedulesError) {
        console.error('Error loading schedules:', schedulesError);
        setStudentSchedules([]);
      } else {
        // Filter schedules to only show those for the program this teacher is assigned to
        const filteredSchedules = (schedulesData || []).filter(
          schedule => schedule.program === assignment.program
        );
        setStudentSchedules(filteredSchedules);
      }

      // Load student enrollments with progress
      const { data: studentData, error: studentError } = await students.getById(assignment.student.id);
      if (studentError) {
        console.error('Error loading student enrollments:', studentError);
        setStudentEnrollments([]);
      } else {
        // Filter enrollments to only show the program this teacher is assigned to
        const filteredEnrollments = (studentData?.enrollments || []).filter(
          enrollment => enrollment.program === assignment.program
        );
        setStudentEnrollments(filteredEnrollments);
      }

      setShowStudentModal(true);
    } catch (err) {
      console.error('Error loading student details:', err);
      toast.error('Failed to load student details');
    }

    setLoading(false);
  };

  // Get current active week for the student (program-aware)
  const getCurrentActiveWeekAndYear = () => {
    if (!currentAssignmentProgram || studentSchedules.length === 0) return { year: 1, week: 1 };

    const weekMap = {};

    studentSchedules.forEach(schedule => {
      const key = `${schedule.academic_year}-${schedule.week_number}`;
      if (!weekMap[key]) {
        weekMap[key] = [];
      }
      weekMap[key].push(schedule);
    });

    // Get program config from centralized configuration
    const programConfig = PROGRAMS[currentAssignmentProgram];
    const isTajweed = currentAssignmentProgram === PROGRAM_IDS.TAJWEED;
    const totalYears = programConfig?.duration.years || (isTajweed ? 1 : 2);
    const totalProgramWeeks = programConfig?.duration.weeks || (isTajweed ? 24 : 104);
    const weeksPerYear = Math.ceil(totalProgramWeeks / totalYears);

    // Check each year
    for (let year = 1; year <= totalYears; year++) {
      for (let weekNum = 1; weekNum <= weeksPerYear; weekNum++) {
        const weekClasses = weekMap[`${year}-${weekNum}`];
        if (!weekClasses || weekClasses.length === 0) {
          return { year, week: weekNum }; // First week without classes
        }

        const allCompleted = weekClasses.every(c => c.status === 'completed');
        if (!allCompleted) {
          return { year, week: weekNum }; // First incomplete week
        }
      }
    }

    return { year: totalYears, week: weeksPerYear }; // All complete
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
    setStudentSchedules([]);
    setStudentEnrollments([]);
    setEditingSchedule(null);
    setEditedScheduleData({});
  };

  const handleEditSchedule = (schedule) => {
    // Check if enrollment is active before allowing edit mode
    if (studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active') {
      toast.error('Cannot edit schedule - student enrollment is not active');
      return;
    }

    setEditingSchedule(schedule.id);
    setEditedScheduleData({
      day_of_week: schedule.day_of_week,
      class_time: schedule.class_time,
      meeting_link: schedule.meeting_link || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setEditedScheduleData({});
  };

  const handleSaveSchedule = async (scheduleId) => {
    // Check if enrollment is active before allowing updates
    if (studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active') {
      toast.error('Cannot update schedule - student enrollment is not active');
      return;
    }

    setLoading(true);
    try {
      const { error } = await classSchedules.update(scheduleId, editedScheduleData);

      if (error) {
        toast.error('Failed to update schedule');
        console.error(error);
        return;
      }

      toast.success('Schedule updated successfully!');
      setEditingSchedule(null);
      setEditedScheduleData({});

      // Reload schedules with program filter
      const { data: schedulesData, error: schedulesError } = await classSchedules.getByStudentId(selectedStudent.id);
      if (!schedulesError) {
        const filteredSchedules = (schedulesData || []).filter(
          schedule => schedule.program === currentAssignmentProgram
        );
        setStudentSchedules(filteredSchedules);
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsComplete = async (scheduleId) => {
    // Check if enrollment is active before allowing updates
    if (studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active') {
      toast.error('Cannot mark complete - student enrollment is not active');
      return;
    }

    setLoading(true);
    try {
      const { error } = await classSchedules.update(scheduleId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      if (error) {
        toast.error('Failed to mark schedule as complete');
        console.error(error);
        return;
      }

      toast.success('Schedule marked as complete!');

      // Reload schedules with program filter
      const { data: schedulesData, error: schedulesError } = await classSchedules.getByStudentId(selectedStudent.id);
      if (!schedulesError) {
        const filteredSchedules = (schedulesData || []).filter(
          schedule => schedule.program === currentAssignmentProgram
        );
        setStudentSchedules(filteredSchedules);
      }
    } catch (err) {
      console.error('Error marking schedule as complete:', err);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDayName = (dayNumber) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || 'N/A';
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-NZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatMeetingLink = (link) => {
    if (!link) return null;
    // Add https:// if the link doesn't already have a protocol
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      return `https://${link}`;
    }
    return link;
  };

  const handleOpenEmailModal = (student, program) => {
    setEmailRecipient({
      name: student.full_name,
      email: student.email,
      studentId: student.student_id,
      program: program
    });
    setEmailMessage('');
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!emailMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-message-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageData: {
              senderName: teacher.full_name,
              senderEmail: teacher.email,
              recipientName: emailRecipient.name,
              recipientEmail: emailRecipient.email,
              message: emailMessage,
              program: emailRecipient.program
            },
            recipientType: 'student'
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success('Message sent successfully!');
        setShowEmailModal(false);
        setEmailMessage('');
        setEmailRecipient(null);
      } else {
        toast.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = () => {
    setSettingsFormData({
      full_name: teacher.full_name || '',
      phone: teacher.phone || '',
    });
    setShowSettingsModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!settingsFormData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await teachers.update(teacher.id, {
        full_name: settingsFormData.full_name,
        phone: settingsFormData.phone,
      });

      if (error) {
        toast.error('Failed to update profile');
        console.error(error);
        return;
      }

      // Update local state and localStorage
      const updatedTeacher = {
        ...teacher,
        full_name: settingsFormData.full_name,
        phone: settingsFormData.phone,
      };
      setTeacher(updatedTeacher);
      localStorage.setItem('teacher', JSON.stringify(updatedTeacher));

      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 sm:h-20">
              <a href="/" className="flex items-center gap-2 sm:gap-3 group">
                <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-10 w-10 sm:h-12 sm:w-12 transition-colors" />
                <div className="flex flex-col leading-none -space-y-1">
                  <span className="text-sm sm:text-base font-brand font-bold text-emerald-600" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                  <span className="text-sm sm:text-base font-brand font-bold text-emerald-600" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                  {/* <div className="text-xs text-gray-600 font-arabic hidden sm:block"> أكاديمية الفلاح</div> */}
                </div>
              </a>
              <a
                href="/"
                className="text-xs sm:text-sm text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Homepage</span>
                <span className="sm:hidden">Back</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex items-center justify-center px-4 py-8 sm:py-12 md:py-20">
          <div className="max-w-md w-full">
            {/* Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Form Section */}
              <div className="px-6 sm:px-8 py-8 sm:py-10">
                <div className="text-center mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Teacher Portal</h1>
                  <p className="text-gray-600 text-sm sm:text-base">Sign in to access your dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-2">
                      Staff ID
                    </label>
                    <input
                      id="staffId"
                      type="text"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Enter your staff ID"
                      required
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <a
                      href="/forgot-password"
                      className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-2.5 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                {/* Info Box */}
                <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-700 text-center">
                    Need help? Contact <a href="mailto:admin@tftmadrasah.nz" className="text-emerald-600 hover:text-emerald-700">admin@tftmadrasah.nz</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Text */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Authentic Islamic Education Rooted in the Qur'an and Sunnah
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Screen
  const displayedStudents = activeView === 'assigned' ? assignedStudents : removedStudents;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-6 w-6 sm:h-8 sm:w-8" />
              <div className="flex flex-col">
                <div className="text-sm sm:text-xl font-bold text-emerald-600">Teacher Portal</div>
                <div className="text-[10px] sm:text-xs text-gray-600 hidden sm:flex sm:flex-col leading-tight">
                  <span style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                  <span style={{letterSpacing: "0.28em"}}>Madrasah</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-4">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">{teacher.full_name}</p>
                <p className="text-[10px] sm:text-xs text-gray-600 hidden sm:block">Staff ID: {teacher.staff_id}</p>
              </div>
              <Button variant="outline" onClick={handleOpenSettings} className="text-xs sm:text-base px-2 py-1.5 sm:px-4 sm:py-2">
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button variant="secondary" onClick={handleLogout} className="text-xs sm:text-base px-2 py-1.5 sm:px-4 sm:py-2">
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome Message */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1">Welcome, {teacher.full_name.split(' ')[0]}!</h1>
          <p className="text-xs sm:text-base text-gray-600">Manage students and track progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mb-5 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Assigned Students</p>
                <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{assignedStudents.length}</p>
              </div>
              <div className="hidden sm:block">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Removed</p>
                <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{removedStudents.length}</p>
              </div>
              <div className="hidden sm:block">
                <UserX className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{assignedStudents.length + removedStudents.length}</p>
              </div>
              <div className="hidden sm:block">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveView('assigned')}
              className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'assigned'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2 -mt-0.5" />
              Assigned ({assignedStudents.length})
            </button>
            <button
              onClick={() => setActiveView('removed')}
              className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'removed'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <UserX className="h-4 w-4 inline mr-2 -mt-0.5" />
              Removed ({removedStudents.length})
            </button>
          </div>
        </div>

        {/* Students List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <p className="mt-2 text-gray-600">Loading students...</p>
          </div>
        ) : displayedStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            {activeView === 'assigned' ? (
              <>
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No assigned students yet</p>
              </>
            ) : (
              <>
                <UserX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No removed students</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {displayedStudents.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5 truncate">
                      {assignment.student.full_name}
                    </h3>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {PROGRAMS[assignment.program]?.shortName || assignment.program}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEmailModal(assignment.student, assignment.program)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Send email"
                    >
                      <Mail className="h-4 w-4 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => handleViewStudent(assignment)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs sm:text-sm text-gray-600">
                  <p className="truncate">
                    <span className="text-gray-500">Email:</span> {assignment.student.email}
                  </p>
                  <p>
                    <span className="text-gray-500">ID:</span> {assignment.student.student_id}
                  </p>
                  <p className="hidden sm:block">
                    <span className="text-gray-500">Assigned:</span> {formatDate(assignment.assigned_at)}
                  </p>
                  {assignment.status === 'removed' && assignment.removed_at && (
                    <p className="text-red-600">
                      <span className="font-medium">Removed:</span> {formatDate(assignment.removed_at)}
                    </p>
                  )}
                  {assignment.notes && (
                    <p className="text-xs italic mt-2 p-2 bg-gray-50 rounded border border-gray-100">
                      {assignment.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-lg sm:rounded-lg border border-gray-200 w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-xl font-semibold text-gray-900 truncate">{selectedStudent.full_name}</h2>
                  <p className="text-xs sm:text-sm text-gray-600">ID: {selectedStudent.student_id}</p>
                </div>
                <button
                  onClick={closeStudentModal}
                  className="text-gray-400 hover:text-gray-600 ml-2 p-2 -mr-2 transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">

              {/* Student Info */}
              <div className="mb-4 sm:mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Email</p>
                    <p className="text-gray-900">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Phone</p>
                    <p className="text-gray-900">{selectedStudent.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Gender</p>
                    <p className="text-gray-900 capitalize">{selectedStudent.gender}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Student Status</p>
                    <p className="text-gray-900 capitalize">{selectedStudent.status.replace('_', ' ')}</p>
                  </div>
                  {studentEnrollments.length > 0 && (
                    <div className="sm:col-span-2">
                      <p className="text-gray-500 text-xs mb-1">Enrollment Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          studentEnrollments[0].status === 'active' ? 'bg-green-100 text-green-700' :
                          studentEnrollments[0].status === 'withdrawn' ? 'bg-red-100 text-red-700' :
                          studentEnrollments[0].status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {studentEnrollments[0].status === 'active' ? 'Active' :
                           studentEnrollments[0].status === 'withdrawn' ? 'Withdrawn' :
                           studentEnrollments[0].status === 'completed' ? 'Graduated' :
                           studentEnrollments[0].status}
                        </span>
                        {studentEnrollments[0].status !== 'active' && (
                          <span className="text-xs text-gray-500">
                            Schedule updates disabled
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Week Schedule - High Level View */}
              <div className="mb-4 sm:mb-6">
                {/* Check if enrollment is not active - hide schedule completely */}
                {studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active' ? (
                  <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                    <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                    <p className="text-red-800 font-semibold mb-2">Schedule Access Disabled</p>
                    <p className="text-red-600 text-sm">
                      This student's enrollment is {studentEnrollments[0].status}. Schedule management is not available.
                    </p>
                  </div>
                ) : studentSchedules.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                    <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-xs sm:text-sm">No schedules available for this program</p>
                  </div>
                ) : (() => {
                  const currentActive = getCurrentActiveWeekAndYear();
                  const programConfig = PROGRAMS[currentAssignmentProgram];
                  const isTajweed = currentAssignmentProgram === PROGRAM_IDS.TAJWEED;
                  const totalYears = programConfig?.duration.years || (isTajweed ? 1 : 2);
                  const totalWeeks = programConfig?.duration.weeks || (isTajweed ? 24 : 104);
                  const weeksPerYear = Math.ceil(totalWeeks / totalYears);
                  const completedWeeks = (currentActive.year - 1) * weeksPerYear + currentActive.week - 1;
                  const progressPercent = Math.round((completedWeeks / totalWeeks) * 100);

                  // Get current week's classes
                  const currentWeekClasses = studentSchedules.filter(
                    s => s.academic_year === currentActive.year && s.week_number === currentActive.week
                  );

                  const mainClass = currentWeekClasses.find(c => c.class_type === 'main');
                  const shortClass = currentWeekClasses.find(c => c.class_type === 'short');

                  // Calculate milestone progress
                  const currentWeekNumber = (currentActive.year - 1) * weeksPerYear + currentActive.week;
                  const currentMilestone = getCurrentMilestone(currentWeekNumber, isTajweed);
                  const milestones = programConfig?.milestones || (isTajweed ? TAJWEED_MILESTONES : EAIS_MILESTONES);
                  const totalMilestones = milestones.length;
                  const programName = programConfig?.name || (isTajweed ? 'Tajweed Mastery Program' : 'Essential Arabic & Islamic Studies');

                  return (
                    <div>
                      {/* Program Header */}
                      <div className="mb-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{programName}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Week {currentActive.week} • {progressPercent}% Complete</p>
                          </div>
                        </div>
                      </div>

                      {/* Milestone Tracker */}
                      <div className="mb-8">
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
                              {(isTajweed ? TAJWEED_MILESTONES : EAIS_MILESTONES).map((milestone) => {
                                const isCompleted = currentMilestone.id > milestone.id;
                                const isCurrent = currentMilestone.id === milestone.id;

                                return (
                                  <div key={milestone.id} className="flex flex-col items-center">
                                    {/* Node Circle */}
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                                        isCompleted
                                          ? 'bg-emerald-600 text-white'
                                          : isCurrent
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-white border border-gray-300 text-gray-400'
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
                                    <Calendar className="h-4 w-4 text-gray-600" />
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
                                    href={formatMeetingLink(mainClass.meeting_link)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                                  >
                                    Join Class →
                                  </a>
                                )}
                                {mainClass.status === 'scheduled' && (
                                  <button
                                    onClick={() => handleMarkAsComplete(mainClass.id)}
                                    disabled={loading || (studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active')}
                                    className={`text-sm flex items-center font-medium ${
                                      studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active'
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-emerald-700 hover:text-emerald-800'
                                    }`}
                                    title={studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active' ? 'Cannot mark complete - student enrollment is not active' : ''}
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
                                    <Calendar className="h-4 w-4 text-gray-600" />
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
                                    href={formatMeetingLink(shortClass.meeting_link)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                                  >
                                    Join Class →
                                  </a>
                                )}
                                {shortClass.status === 'scheduled' && (
                                  <button
                                    onClick={() => handleMarkAsComplete(shortClass.id)}
                                    disabled={loading || (studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active')}
                                    className={`text-sm flex items-center font-medium ${
                                      studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active'
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-emerald-700 hover:text-emerald-800'
                                    }`}
                                    title={studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active' ? 'Cannot mark complete - student enrollment is not active' : ''}
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
                          const completedClasses = studentSchedules.filter(s => s.status === 'completed').length;
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
                              <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                                <div
                                  className="absolute top-0 left-0 h-full bg-emerald-600 rounded-full transition-all"
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
                    </div>
                  );
                })()}
              </div>


              {/* Progress
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Progress
                </h3>
                {studentEnrollments.length === 0 ? (
                  <p className="text-gray-600 text-sm">No enrollment data available</p>
                ) : (
                  <div className="space-y-3">
                    {studentEnrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            enrollment.program === PROGRAM_IDS.ESSENTIALS
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {PROGRAMS[enrollment.program]?.shortName || enrollment.program}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {enrollment.current_level || 'Level 1'}
                          </span>
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{enrollment.progress_percentage || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full transition-all"
                              style={{ width: `${enrollment.progress_percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        {enrollment.notes && (
                          <p className="text-xs text-gray-600 mt-2">
                            <span className="font-medium">Notes:</span> {enrollment.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div> */}

              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={closeStudentModal}
                  fullWidth
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && emailRecipient && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-lg sm:rounded-lg border border-gray-200 w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Send Message</h2>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">To: {emailRecipient.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailMessage('');
                    setEmailRecipient(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 -mr-2 transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">

              <div className="mb-4 sm:mb-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Student ID</p>
                      <p className="text-gray-900">{emailRecipient.studentId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Program</p>
                      <p className="text-gray-900 capitalize">
                        {PROGRAMS[emailRecipient.program]?.shortName || emailRecipient.program}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 text-xs mb-1">Email</p>
                      <p className="text-gray-900">{emailRecipient.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="emailMessage" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="emailMessage"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Type your message here..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    The student will receive this message via email and can reply directly to your email address.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailMessage('');
                    setEmailRecipient(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={loading || !emailMessage.trim()}
                  className="inline-flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-lg sm:rounded-lg border border-gray-200 w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 -mr-2 transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.full_name}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, full_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settingsFormData.phone}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Your phone number"
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Read-only Information:</strong>
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p><strong>Email:</strong> {teacher.email}</p>
                    <p><strong>Staff ID:</strong> {teacher.staff_id}</p>
                  </div>
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Updating Profile...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
