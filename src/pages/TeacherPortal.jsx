import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, BookOpen, LogOut, Users, UserX, Calendar, BarChart3, Eye, X, Key, Edit2, CheckCircle, Mail, Send } from 'lucide-react';
import { teachers, teacherAssignments, students, classSchedules } from '../services/supabase';
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
      const { data, error } = await teachers.getByStaffId(staffId);

      if (error || !data) {
        toast.error('Invalid Staff ID or password');
        setLoading(false);
        return;
      }

      // Simple password comparison (in production, use bcrypt)
      if (data.password !== password) {
        toast.error('Invalid Staff ID or password');
        setLoading(false);
        return;
      }

      if (!data.is_active) {
        toast.error('Your account is inactive. Please contact admin.');
        setLoading(false);
        return;
      }

      // Login successful
      setTeacher(data);
      setIsAuthenticated(true);
      localStorage.setItem('teacher', JSON.stringify(data));

      // Check if first login - show password change modal
      if (data.first_login) {
        toast.info('Please change your password');
        setShowPasswordModal(true);
        setLoading(false); // Reset loading so password change button isn't stuck
      } else {
        toast.success(`Welcome, ${data.full_name}!`);
        // Load teacher data
        await loadTeacherData(data.id);
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
      // Update password and set first_login to false
      const { data, error } = await teachers.update(teacher.id, {
        password: newPassword, // TODO: Add bcrypt hashing in production
        first_login: false
      });

      if (error) {
        toast.error('Failed to update password');
        console.error(error);
        setLoading(false);
        return;
      }

      // Update teacher data in state and localStorage
      const updatedTeacher = { ...teacher, first_login: false, password: newPassword };
      setTeacher(updatedTeacher);
      localStorage.setItem('teacher', JSON.stringify(updatedTeacher));

      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');

      // Load teacher data now
      await loadTeacherData(teacher.id);
    } catch (err) {
      console.error('Password change error:', err);
      toast.error('An error occurred');
    }

    setLoading(false);
  };

  const handleLogout = () => {
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

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        {/* Header */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <a href="/" className="flex items-center gap-3 group">
                <img src="/favicon.svg" alt="Al-Falaah Academy" className="h-12 w-12 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xl font-bold text-emerald-600">Al-Falaah Academy</div>
                  <div className="text-xs text-gray-600 font-arabic"> أكاديمية الفلاح</div>
                </div>
              </a>
              <a
                href="/"
                className="text-sm text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> 
                Back to Homepage
              </a>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex items-center justify-center px-4 py-12 sm:py-20">
          <div className="max-w-md w-full">
            {/* Card */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-10 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Teacher Portal</h1>
                <p className="text-emerald-100 text-sm">Access your teaching dashboard</p>
              </div>

              {/* Form Section */}
              <div className="px-8 py-10">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="Al-Falaah Academy" className="h-10 w-10" />
              <div>
                <div className="text-xl font-bold text-emerald-600">Teacher Portal</div>
                <div className="text-xs text-gray-600">Al-Falaah Academy</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{teacher.full_name}</p>
                <p className="text-xs text-gray-600">Staff ID: {teacher.staff_id}</p>
              </div>
              <Button variant="secondary" onClick={handleLogout} className="shadow-sm">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {teacher.full_name}!</h1>
          <p className="text-gray-600">Manage your assigned students and track their progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-xl border border-emerald-400 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-100 font-medium mb-1">Assigned Students</p>
                <p className="text-4xl font-bold">{assignedStudents.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-6 rounded-2xl shadow-xl border border-gray-400 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-100 font-medium mb-1">Removed Students</p>
                <p className="text-4xl font-bold">{removedStudents.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserX className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl border border-blue-400 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100 font-medium mb-1">Total Students</p>
                <p className="text-4xl font-bold">{assignedStudents.length + removedStudents.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setActiveView('assigned')}
            className={`px-6 py-3.5 rounded-xl font-semibold transition-all shadow-md ${
              activeView === 'assigned'
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Users className="h-5 w-5 inline mr-2" />
            Assigned Students ({assignedStudents.length})
          </button>
          <button
            onClick={() => setActiveView('removed')}
            className={`px-6 py-3.5 rounded-xl font-semibold transition-all shadow-md ${
              activeView === 'removed'
                ? 'bg-gray-600 text-white shadow-gray-200'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <UserX className="h-5 w-5 inline mr-2" />
            Removed Students ({removedStudents.length})
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedStudents.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-emerald-200 transition-all transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {assignment.student.full_name}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      assignment.program === 'essentials'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                    }`}>
                      {assignment.program === 'essentials' ? 'Essentials' : 'Tajweed'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEmailModal(assignment.student, assignment.program)}
                      className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                      title="Send email"
                    >
                      <Mail className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleViewStudent(assignment)}
                      className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                      title="View details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Email:</span> {assignment.student.email}
                  </p>
                  <p>
                    <span className="font-medium">Student ID:</span> {assignment.student.student_id}
                  </p>
                  <p>
                    <span className="font-medium">Assigned:</span> {formatDate(assignment.assigned_at)}
                  </p>
                  {assignment.status === 'removed' && assignment.removed_at && (
                    <p className="text-red-600">
                      <span className="font-medium">Removed:</span> {formatDate(assignment.removed_at)}
                    </p>
                  )}
                  {assignment.notes && (
                    <p className="text-xs italic mt-2 p-2 bg-gray-50 rounded">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.full_name}</h2>
                  <p className="text-sm text-gray-600">Student ID: {selectedStudent.student_id}</p>
                </div>
                <button
                  onClick={closeStudentModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Student Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
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
                    <p className="text-gray-600">Status</p>
                    <p className="font-medium capitalize">{selectedStudent.status.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Current Week Schedule - High Level View */}
              <div className="mb-6">
                {studentSchedules.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No schedules available for this program</p>
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
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            Week {currentActive.week} of {weeksPerYear}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
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
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Progress</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {progressPercent}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {completedWeeks} of {totalWeeks} weeks
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
                          {mainClass && (
                            <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-5 w-5 text-blue-600" />
                                  <span className="text-base font-semibold text-blue-900">
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
                                  href={mainClass.meeting_link}
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
                                    disabled={loading}
                                    className="text-sm text-green-700 hover:text-green-800 flex items-center font-medium"
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
                            <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-5 w-5 text-purple-600" />
                                  <span className="text-base font-semibold text-purple-900">
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
                                  href={shortClass.meeting_link}
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
                                    disabled={loading}
                                    className="text-sm text-green-700 hover:text-green-800 flex items-center font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Send Message</h2>
                    <p className="text-sm text-gray-600">To: {emailRecipient.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailMessage('');
                    setEmailRecipient(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 rounded-full">
                  <Key className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Change Your Password</h2>
                  <p className="text-sm text-gray-600">Please set a new password to continue</p>
                </div>
              </div>

              <div className="space-y-4">
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
    </div>
  );
}
