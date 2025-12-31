import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, BookOpen, LogOut, Users, UserX, Calendar, BarChart3, Eye, X, Key, Edit2, CheckCircle, Mail, Send, XCircle, Settings } from 'lucide-react';
import { supabase, teachers, teacherAssignments, students, classSchedules } from '../services/supabase';
import Button from '../components/common/Button';

export default function TeacherPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(false);

  // Login form
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
  const [settingsTab, setSettingsTab] = useState('password'); // password or profile
  const [settingsFormData, setSettingsFormData] = useState({
    full_name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
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

      // Get first_login status from user metadata
      const firstLogin = authData.user?.user_metadata?.first_login || false;

      // Login successful
      setTeacher(teacherRecord);
      setIsAuthenticated(true);
      localStorage.setItem('teacher', JSON.stringify(teacherRecord));

      // Check if first login - show password change modal
      if (firstLogin) {
        toast.info('Please change your password');
        setShowPasswordModal(true);
        setLoading(false); // Reset loading so password change button isn't stuck
      } else {
        toast.success(`Welcome, ${teacherRecord.full_name}!`);
        // Load teacher data
        await loadTeacherData(teacherRecord.id);
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An error occurred during login');
    }

    setLoading(false);
  };

  const handleChangePassword = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Update password using Supabase Auth and metadata in one call
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
        data: { first_login: false }
      });

      if (passwordError) {
        toast.error(`Failed to update password: ${passwordError.message}`);
        setLoading(false);
        return;
      }

      // Show success message and reload
      toast.success('Password changed successfully! Reloading...');

      // Reload immediately to avoid auth state change interference
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Password change error:', err);
      toast.error(`An error occurred: ${err.message}`);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();

    setIsAuthenticated(false);
    setTeacher(null);
    setAssignedStudents([]);
    setRemovedStudents([]);
    setSelectedStudent(null);
    setShowPasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
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

    // Determine total weeks based on program
    const isTajweed = currentAssignmentProgram === 'tajweed';
    const totalYears = isTajweed ? 1 : 2;
    const weeksPerYear = isTajweed ? 24 : 52;

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
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setSettingsTab('password');
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

  const handleUpdatePassword = async () => {
    if (!settingsFormData.newPassword || !settingsFormData.confirmNewPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (settingsFormData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (settingsFormData.newPassword !== settingsFormData.confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: settingsFormData.newPassword,
      });

      if (error) {
        toast.error(`Failed to update password: ${error.message}`);
        return;
      }

      toast.success('Password updated successfully!');
      setSettingsFormData({
        ...settingsFormData,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setShowSettingsModal(false);
    } catch (err) {
      console.error('Error updating password:', err);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        {/* Header */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 sm:h-20">
              <a href="/" className="flex items-center gap-2 sm:gap-3 group">
                <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-10 w-10 sm:h-12 sm:w-12 group-hover:scale-110 transition-transform" />
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
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 sm:px-8 py-8 sm:py-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm mb-3 sm:mb-4">
                  <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Teacher Portal</h1>
                <p className="text-emerald-100 text-xs sm:text-sm">Access your teaching dashboard</p>
              </div>

              {/* Form Section */}
              <div className="px-6 sm:px-8 py-8 sm:py-10">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label htmlFor="staffId" className="block text-sm font-semibold text-gray-700 mb-2">
                      Staff ID
                    </label>
                    <input
                      id="staffId"
                      type="text"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      placeholder="Enter your staff ID"
                      required
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      'Sign In to Portal'
                    )}
                  </Button>
                </form>

                {/* Info Box */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs text-blue-900 text-center">
                    <strong>First time login?</strong> Use the credentials provided by the administrator.
                    You'll be required to change your password on first login.
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/20">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
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
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[100px] sm:max-w-none">{teacher.full_name}</p>
                <p className="text-[10px] sm:text-xs text-gray-600 hidden sm:block">Staff ID: {teacher.staff_id}</p>
              </div>
              <Button variant="outline" onClick={handleOpenSettings} className="shadow-sm text-xs sm:text-base px-2 py-1.5 sm:px-4 sm:py-2">
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button variant="secondary" onClick={handleLogout} className="shadow-sm text-xs sm:text-base px-2 py-1.5 sm:px-4 sm:py-2">
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
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-emerald-400 text-white">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-[10px] sm:text-sm text-emerald-100 font-medium mb-0.5 sm:mb-1">Assigned</p>
                <p className="text-2xl sm:text-4xl font-bold">{assignedStudents.length}</p>
              </div>
              <div className="hidden sm:block p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-400 text-white">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-[10px] sm:text-sm text-gray-100 font-medium mb-0.5 sm:mb-1">Removed</p>
                <p className="text-2xl sm:text-4xl font-bold">{removedStudents.length}</p>
              </div>
              <div className="hidden sm:block p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserX className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-blue-400 text-white col-span-2 sm:col-span-1">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-[10px] sm:text-sm text-blue-100 font-medium mb-0.5 sm:mb-1">Total</p>
                <p className="text-2xl sm:text-4xl font-bold">{assignedStudents.length + removedStudents.length}</p>
              </div>
              <div className="hidden sm:block p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-5 sm:mb-8">
          <button
            onClick={() => setActiveView('assigned')}
            className={`flex-1 px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl text-xs sm:text-base font-semibold transition-all ${
              activeView === 'assigned'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Users className="h-3.5 w-3.5 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
            <span>Assigned ({assignedStudents.length})</span>
          </button>
          <button
            onClick={() => setActiveView('removed')}
            className={`flex-1 px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl text-xs sm:text-base font-semibold transition-all ${
              activeView === 'removed'
                ? 'bg-gray-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <UserX className="h-3.5 w-3.5 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
            <span>Removed ({removedStudents.length})</span>
          </button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
            {displayedStudents.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1.5 truncate">
                      {assignment.student.full_name}
                    </h3>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                      assignment.program === 'essentials'
                        ? 'bg-blue-600 text-white'
                        : 'bg-purple-600 text-white'
                    }`}>
                      {assignment.program === 'essentials' ? 'Essentials' : 'Tajweed'}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEmailModal(assignment.student, assignment.program)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-95"
                      title="Send email"
                    >
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => handleViewStudent(assignment)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors active:scale-95"
                      title="View details"
                    >
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] sm:text-sm text-gray-600">
                  <p className="truncate">
                    <span className="font-medium text-gray-700">Email:</span> {assignment.student.email}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">ID:</span> {assignment.student.student_id}
                  </p>
                  <p className="hidden sm:block">
                    <span className="font-medium text-gray-700">Assigned:</span> {formatDate(assignment.assigned_at)}
                  </p>
                  {assignment.status === 'removed' && assignment.removed_at && (
                    <p className="text-red-600">
                      <span className="font-medium">Removed:</span> {formatDate(assignment.removed_at)}
                    </p>
                  )}
                  {assignment.notes && (
                    <p className="text-[10px] sm:text-xs italic mt-2 p-2 bg-gray-50 rounded">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-2xl font-bold text-gray-900 truncate">{selectedStudent.full_name}</h2>
                  <p className="text-xs sm:text-sm text-gray-600">ID: {selectedStudent.student_id}</p>
                </div>
                <button
                  onClick={closeStudentModal}
                  className="text-gray-500 hover:text-gray-700 ml-2 p-2 -mr-2 active:scale-95"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">

              {/* Student Info */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium">{selectedStudent.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gender</p>
                    <p className="font-medium capitalize">{selectedStudent.gender}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Student Status</p>
                    <p className="font-medium capitalize">{selectedStudent.status.replace('_', ' ')}</p>
                  </div>
                  {studentEnrollments.length > 0 && (
                    <div className="sm:col-span-2">
                      <p className="text-gray-600">Enrollment Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          studentEnrollments[0].status === 'active' ? 'bg-green-100 text-green-800' :
                          studentEnrollments[0].status === 'withdrawn' ? 'bg-red-100 text-red-800' :
                          studentEnrollments[0].status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {studentEnrollments[0].status === 'active' ? '✓ Active' :
                           studentEnrollments[0].status === 'withdrawn' ? '⚠ Withdrawn' :
                           studentEnrollments[0].status === 'completed' ? '✓ Graduated' :
                           studentEnrollments[0].status}
                        </span>
                        {studentEnrollments[0].status !== 'active' && (
                          <span className="text-xs text-gray-500 italic">
                            (Schedule updates disabled)
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
                  <div className="text-center py-8 bg-red-50 rounded-lg border-2 border-red-200">
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
                  const isTajweed = currentAssignmentProgram === 'tajweed';
                  const weeksPerYear = isTajweed ? 24 : 52;
                  const totalWeeks = isTajweed ? 24 : 104;
                  const completedWeeks = (currentActive.year - 1) * weeksPerYear + currentActive.week - 1;
                  const progressPercent = Math.round((completedWeeks / totalWeeks) * 100);

                  // Get current week's classes
                  const currentWeekClasses = studentSchedules.filter(
                    s => s.academic_year === currentActive.year && s.week_number === currentActive.week
                  );

                  const mainClass = currentWeekClasses.find(c => c.class_type === 'main');
                  const shortClass = currentWeekClasses.find(c => c.class_type === 'short');

                  return (
                    <div>
                      {/* Week Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200 gap-3 sm:gap-0">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Week {currentActive.week} of {weeksPerYear}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            {isTajweed ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Tajweed Program (6 months)
                              </span>
                            ) : currentActive.year === 1 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Year 1 of 2 - Essentials
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Year 2 of 2 - Essentials
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex sm:flex-col sm:text-right gap-4 sm:gap-0">
                          <div className="flex-1 sm:flex-initial">
                            <p className="text-xs sm:text-sm text-gray-600">Progress</p>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                              {progressPercent}%
                            </p>
                          </div>
                          <div className="flex-1 sm:flex-initial">
                            <p className="text-xs text-gray-500">
                              {completedWeeks} of {totalWeeks} weeks
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Current Week Classes */}
                      {currentWeekClasses.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-gray-500">
                          <p className="text-sm">No classes scheduled for this week</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          {/* Main Class */}
                          {mainClass && (
                            <div className="bg-blue-50 p-4 sm:p-5 rounded-lg border-2 border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                  <span className="text-sm sm:text-base font-semibold text-blue-900">
                                    Main Class (2 hrs)
                                  </span>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  mainClass.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : mainClass.status === 'scheduled'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {mainClass.status}
                                </span>
                              </div>
                              <div className="space-y-2 mb-4">
                                <div className="text-sm text-blue-800">
                                  <span className="font-medium">Day:</span> {mainClass.day_of_week}
                                </div>
                                <div className="text-sm text-blue-800">
                                  <span className="font-medium">Time:</span> {formatTime(mainClass.class_time) || 'Not set'}
                                </div>
                              </div>
                              {mainClass.meeting_link && (
                                <a
                                  href={formatMeetingLink(mainClass.meeting_link)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-blue-700 hover:text-blue-800 font-medium mb-3"
                                >
                                  Join Class
                                </a>
                              )}
                              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-blue-200">
                                {mainClass.status === 'scheduled' && (
                                  <button
                                    onClick={() => handleMarkAsComplete(mainClass.id)}
                                    disabled={loading || (studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active')}
                                    className={`text-sm flex items-center font-medium ${
                                      studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active'
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-green-700 hover:text-green-800'
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
                            <div className="bg-purple-50 p-4 sm:p-5 rounded-lg border-2 border-purple-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                  <span className="text-sm sm:text-base font-semibold text-purple-900">
                                    Short Class (30 min)
                                  </span>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  shortClass.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : shortClass.status === 'scheduled'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {shortClass.status}
                                </span>
                              </div>
                              <div className="space-y-2 mb-4">
                                <div className="text-sm text-purple-800">
                                  <span className="font-medium">Day:</span> {shortClass.day_of_week}
                                </div>
                                <div className="text-sm text-purple-800">
                                  <span className="font-medium">Time:</span> {formatTime(shortClass.class_time) || 'Not set'}
                                </div>
                              </div>
                              {shortClass.meeting_link && (
                                <a
                                  href={formatMeetingLink(shortClass.meeting_link)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-purple-700 hover:text-purple-800 font-medium mb-3"
                                >
                                  Join Class
                                </a>
                              )}
                              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-purple-200">
                                {shortClass.status === 'scheduled' && (
                                  <button
                                    onClick={() => handleMarkAsComplete(shortClass.id)}
                                    disabled={loading || (studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active')}
                                    className={`text-sm flex items-center font-medium ${
                                      studentEnrollments.length > 0 && studentEnrollments[0].status !== 'active'
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-green-700 hover:text-green-800'
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
                            enrollment.program === 'essentials'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {enrollment.program === 'essentials' ? 'Essentials' : 'Tajweed'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-xl font-bold text-gray-900">Send Message</h2>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">To: {emailRecipient.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailMessage('');
                    setEmailRecipient(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 -mr-2 active:scale-95"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">

              <div className="mb-4 sm:mb-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Student ID</p>
                      <p className="font-medium">{emailRecipient.studentId}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Program</p>
                      <p className="font-medium capitalize">
                        {emailRecipient.program === 'essentials' ? 'Essentials' : 'Tajweed'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600 mb-1">Email</p>
                      <p className="font-medium">{emailRecipient.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="emailMessage" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="emailMessage"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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

      {/* Password Change Modal (First Login) */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-6">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-emerald-100 rounded-full flex-shrink-0">
                  <Key className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Change Your Password</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Please set a new password to continue</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password *
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Password requirements:</strong>
                    <br />• Minimum 8 characters
                    <br />• Use a strong, unique password
                  </p>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Changing Password...
                    </>
                  ) : (
                    'Change Password'
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
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 -mr-2 active:scale-95"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-4 sm:px-6">
              <div className="flex gap-2 sm:gap-4">
                <button
                  onClick={() => setSettingsTab('password')}
                  className={`py-2.5 sm:py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                    settingsTab === 'password'
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Change Password</span>
                  <span className="sm:hidden">Password</span>
                </button>
                <button
                  onClick={() => setSettingsTab('profile')}
                  className={`py-2.5 sm:py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                    settingsTab === 'profile'
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Update Profile</span>
                  <span className="sm:hidden">Profile</span>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Password Tab */}
              {settingsTab === 'password' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password *
                    </label>
                    <input
                      type="password"
                      value={settingsFormData.newPassword}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={settingsFormData.confirmNewPassword}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, confirmNewPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Re-enter your password"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Password requirements:</strong>
                      <br />• Minimum 8 characters
                      <br />• Use a strong, unique password
                    </p>
                  </div>

                  <Button
                    onClick={handleUpdatePassword}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              )}

              {/* Profile Tab */}
              {settingsTab === 'profile' && (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
