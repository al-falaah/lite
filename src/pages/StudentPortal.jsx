import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import { toast } from 'sonner';
import {
  Calendar, Clock, Video, CheckCircle, BookOpen, BarChart3,
  ArrowLeft, User, LogOut, ExternalLink, CreditCard,
  DollarSign, AlertCircle, GraduationCap, Key, X, UserCheck, Mail, Send
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const StudentPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [assignedTeachers, setAssignedTeachers] = useState({});

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState(null);
  const [emailMessage, setEmailMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!studentId || !password) {
      toast.error('Please enter your student ID and password');
      return;
    }

    // Validate student ID format (6 digits)
    if (!/^\d{6}$/.test(studentId)) {
      toast.error('Student ID must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      // Find student by student_id
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', studentId.trim())
        .single();

      if (error || !data) {
        toast.error('Invalid Student ID or password');
        setLoading(false);
        return;
      }

      // Check password
      if (data.password !== password) {
        toast.error('Invalid Student ID or password');
        setLoading(false);
        return;
      }

      setStudent(data);
      setAuthenticated(true);

      // Check if first login - show password change modal
      if (data.first_login) {
        toast.info('Please change your password');
        setShowPasswordModal(true);
        setLoading(false); // Reset loading so password change button isn't stuck
      } else {
        toast.success(`Welcome, ${data.full_name}!`);
        // Load enrollments and student data
        await loadStudentData(data.id);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login. Please try again.');
      setLoading(false);
    }
  };

  const loadStudentData = async (studentId) => {
    try {
      // Load enrollments (only active ones)
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'active') // Only show active enrollments
        .order('created_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;
      setEnrollments(enrollmentsData || []);

      // Get the programs for active enrollments
      const activePrograms = (enrollmentsData || []).map(e => e.program);

      // Load schedules only for active enrollments
      // Only show schedules if student has active enrollment in that program
      let schedulesData = [];
      if (activePrograms.length > 0) {
        const { data, error: schedulesError } = await supabase
          .from('class_schedules')
          .select('*')
          .eq('student_id', studentId)
          .in('program', activePrograms)
          .order('academic_year', { ascending: true })
          .order('week_number', { ascending: true });

        if (schedulesError) {
          console.error('Schedules error:', schedulesError);
        } else {
          schedulesData = data || [];
        }
      }

      setSchedules(schedulesData);

      // Load progress
      const { data: progressData, error: progressError } = await supabase
        .from('student_class_progress')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (progressError) {
        console.error('Progress error:', progressError);
      } else {
        setProgress(progressData);
      }

      // Load assigned teachers
      const { data: teacherAssignments, error: teacherError } = await supabase
        .from('teacher_student_assignments')
        .select(`
          program,
          teacher:teachers(id, full_name, staff_id, email)
        `)
        .eq('student_id', studentId)
        .eq('status', 'assigned');

      if (teacherError) {
        console.error('Teacher assignments error:', teacherError);
      } else {
        // Group by program
        const teachersByProgram = {};
        (teacherAssignments || []).forEach(assignment => {
          if (assignment.program && assignment.teacher) {
            teachersByProgram[assignment.program] = assignment.teacher;
          }
        });
        setAssignedTeachers(teachersByProgram);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-billing-portal`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: student.stripe_customer_id
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to access billing portal');
      }

      // Open Stripe Billing Portal in new tab
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Billing portal error:', error);
      toast.error(error.message || 'Failed to access billing portal');
    } finally {
      setLoading(false);
    }
  };

  const isEnrolledInAllPrograms = () => {
    const availablePrograms = ['essentials', 'tajweed'];
    const enrolledPrograms = enrollments.map(e => e.program);
    return availablePrograms.every(program => enrolledPrograms.includes(program));
  };

  const formatScheduleTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum] || `Day ${dayNum}`;
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
      console.log('Updating password for student ID:', student.id);

      // Update password and set first_login to false
      const { data, error } = await supabase
        .from('students')
        .update({
          password: newPassword, // TODO: Add bcrypt hashing in production
          first_login: false
        })
        .eq('id', student.id)
        .select();

      console.log('Update response:', { data, error });

      if (error) {
        toast.error(`Failed to update password: ${error.message}`);
        console.error('Password update error:', error);
        setLoading(false);
        return;
      }

      // Update student data in state and localStorage
      const updatedStudent = { ...student, first_login: false, password: newPassword };
      setStudent(updatedStudent);
      localStorage.setItem('student', JSON.stringify(updatedStudent));

      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');

      // Load student data now
      await loadStudentData(student.id);
      // Note: loadStudentData will call setLoading(false) in its finally block
    } catch (err) {
      console.error('Password change error:', err);
      toast.error('An error occurred while changing password');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setStudent(null);
    setEnrollments([]);
    setSchedules([]);
    setProgress(null);
    setStudentId('');
    setPassword('');
    setShowPasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
    toast.info('Logged out successfully');
  };

  const handleOpenEmailModal = (teacher, program) => {
    setEmailRecipient({
      name: teacher.full_name,
      email: teacher.email,
      staffId: teacher.staff_id,
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
        `${supabaseUrl}/functions/v1/send-message-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageData: {
              senderName: student.full_name,
              senderEmail: student.email,
              recipientName: emailRecipient.name,
              recipientEmail: emailRecipient.email,
              message: emailMessage,
              program: emailRecipient.program
            },
            recipientType: 'teacher'
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

  const getProgramName = (program) => {
    return program === 'tajweed' ? 'Tajweed Program' : 'Essential Arabic & Islamic Studies Program';
  };

  const getProgramDuration = (program) => {
    return program === 'tajweed' ? '6 months' : '2 years';
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Active' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Completed' },
      withdrawn: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Withdrawn' },
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img
                  src="/favicon.svg"
                  alt="Al-Falaah Logo"
                  className="h-8 w-8"
                />
                <div className="flex flex-col leading-none -space-y-1">
                  <span className="text-sm sm:text-base font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                  {/* <span className="text-xs text-gray-500 font-arabic"> أكاديمية الفلاح</span> */}
                </div>
              </Link>
              <Link to="/">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 rounded-lg hover:bg-gray-50 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Login Form */}
        <div className="flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <User className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Portal</h1>
              <p className="text-gray-600">Access your enrollment and class schedule</p>
            </div>

            <Card>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    pattern="\d{6}"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                    autoComplete="current-password"
                  />
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    If this is your first time logging in, use the temporary password provided in your welcome email.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading ? 'Accessing...' : 'Access Portal'}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Need help? Contact{' '}
                  <a href="mailto:admin@tftmadrasah.nz" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    admin@tftmadrasah.nz
                  </a>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/favicon.svg"
                alt="Al-Falaah Logo"
                className="h-6 w-6 sm:h-8 sm:w-8"
              />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-xs sm:text-base font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-xs sm:text-base font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-0 sm:gap-2 text-xs sm:text-sm text-gray-700">
                <span className="font-medium truncate max-w-[120px] sm:max-w-none">{student?.full_name}</span>
                {student?.student_id && (
                  <span className="text-gray-500 text-[10px] sm:text-sm">
                    <span className="hidden sm:inline">• </span>
                    {student.student_id}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Welcome Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {student?.full_name}!</h1>
            <p className="text-gray-600 mt-1">
              {student?.student_id ? `Student ID: ${student.student_id}` : 'Complete payment to receive your Student ID'}
            </p>
          </div>

          {/* Enrollments */}
          {enrollments.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No enrollments found</p>
                <p className="text-sm">Please contact support if you believe this is an error.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {enrollments.map((enrollment) => {
                const programName = getProgramName(enrollment.program);
                const programDuration = getProgramDuration(enrollment.program);
                const hasPendingPayment = enrollment.balance_remaining > 0;
                const isTajweed = enrollment.program === 'tajweed';

                return (
                  <Card key={enrollment.id}>
                    {/* Enrollment Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                        <div className="p-2 md:p-3 rounded-lg flex-shrink-0 bg-emerald-100">
                          <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl md:text-2xl font-bold text-gray-900 break-words">{programName}</h2>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs md:text-sm text-gray-600 mt-1">
                            <span className="whitespace-nowrap">Duration: {programDuration}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="whitespace-nowrap">Enrolled: {new Date(enrollment.enrolled_date).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2">
                            {getStatusBadge(enrollment.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Total Fees</p>
                        <p className="text-2xl font-bold text-gray-900">${enrollment.total_fees?.toFixed(2)}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                        <p className="text-sm text-gray-600 mb-1">Paid</p>
                        <p className="text-2xl font-bold text-emerald-600">${enrollment.total_paid?.toFixed(2)}</p>
                      </div>
                      <div className={`p-4 rounded-lg border ${hasPendingPayment ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <p className="text-sm text-gray-600 mb-1">Balance</p>
                        <p className={`text-2xl font-bold ${hasPendingPayment ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ${enrollment.balance_remaining?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Assigned Teacher */}
                    {assignedTeachers[enrollment.program] && (
                      <div className="border-t border-gray-200 pt-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-emerald-600" />
                          Your Teacher
                        </h3>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <User className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {assignedTeachers[enrollment.program].full_name}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Staff ID: {assignedTeachers[enrollment.program].staff_id}
                              </p>
                              {assignedTeachers[enrollment.program].email && (
                                <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                                  <Mail className="h-4 w-4" />
                                  <a
                                    href={`mailto:${assignedTeachers[enrollment.program].email}`}
                                    className="text-emerald-600 hover:text-emerald-700 hover:underline"
                                  >
                                    {assignedTeachers[enrollment.program].email}
                                  </a>
                                </div>
                              )}
                              <div className="mt-3">
                                <Button
                                  onClick={() => handleOpenEmailModal(assignedTeachers[enrollment.program], enrollment.program)}
                                  className="inline-flex items-center text-sm"
                                  variant="secondary"
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Message
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Billing Portal Link */}
                    {student?.stripe_customer_id && (
                      <div className="border-t border-gray-200 pt-6 mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Manage Billing</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Update payment methods, view invoices, and manage your subscription
                            </p>
                          </div>
                          <Button
                            onClick={handleBillingPortal}
                            variant="outline"
                            size="md"
                            className="w-full sm:w-auto"
                            disabled={loading}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Billing Portal
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Class Schedules - Per Program */}
          {enrollments.map((enrollment) => {
            const programSchedules = schedules.filter(s => s.program === enrollment.program);
            const programName = getProgramName(enrollment.program);
            const isTajweed = enrollment.program === 'tajweed';

            if (programSchedules.length === 0) {
              return (
                <Card key={enrollment.id} className="border-l-4 border-l-emerald-600">
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">{programName} - Schedule Coming Soon</p>
                    <p className="text-sm">Your class schedule will appear here once it's been created by the admin.</p>
                  </div>
                </Card>
              );
            }

            // Get program-specific progress to determine current week
            const programProgress = programSchedules.find(s => s.status === 'scheduled');
            const currentWeek = progress?.current_week || programProgress?.week_number || 1;
            const currentYear = progress?.current_year || programProgress?.academic_year || 1;

            // Get current week's classes for this program - filter by both week AND year
            const currentWeekClasses = programSchedules.filter(
              s => s.status !== 'completed' &&
                   s.week_number === currentWeek &&
                   s.academic_year === currentYear
            );

            return (
              <Card key={enrollment.id} className="border-l-4 border-l-emerald-600">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{programName}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Your weekly class schedule • {programSchedules.length} classes total
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sm text-gray-600">Current Week</p>
                    <p className="text-xl font-bold text-emerald-600">
                      Year {currentYear}, Week {currentWeek}
                    </p>
                  </div>
                </div>

                {/* Current Week's Schedule */}
                <div className="space-y-3">
                  {currentWeekClasses.length > 0 ? (
                    currentWeekClasses.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-100">
                            <Calendar className="h-6 w-6 text-emerald-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 whitespace-nowrap">{getDayName(schedule.day_of_week)}</h3>
                            <span className="px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap bg-emerald-100 text-emerald-700">
                              Wk {schedule.week_number}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap bg-gray-100 text-gray-700">
                              Yr {schedule.academic_year}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap bg-gray-100 text-gray-700">
                              {schedule.class_type === 'main' ? '2 hrs' : '30 min'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span>{formatScheduleTime(schedule.class_time)}</span>
                            </div>
                            {schedule.meeting_link && (
                              <a
                                href={schedule.meeting_link.startsWith('http') ? schedule.meeting_link : `https://${schedule.meeting_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap"
                              >
                                <Video className="h-4 w-4 flex-shrink-0" />
                                <span>Join Class</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>
                        {schedule.status === 'completed' && (
                          <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm">No upcoming classes this week</p>
                    </div>
                  )}
                </div>

                {/* Schedule Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                    <p className="text-2xl font-bold text-gray-900">{programSchedules.length}</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {programSchedules.filter(s => s.status === 'completed').length}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {programSchedules.filter(s => s.status === 'scheduled').length}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Apply for Another Program */}
          {!isEnrolledInAllPrograms() && (
            <Card className="border-2 border-emerald-200 bg-emerald-50">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Expand Your Learning</h3>
                  <p className="text-gray-600 mb-4">
                    Interested in enrolling in additional programs? We offer specialized courses to enhance your Islamic education.
                  </p>
                  <Link
                    to={`/enroll-additional?email=${encodeURIComponent(student.email)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Apply for Another Program
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

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
                      <p className="text-gray-600 mb-1">Staff ID</p>
                      <p className="font-medium">{emailRecipient.staffId}</p>
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
                    Your teacher will receive this message via email and can reply directly to your email address.
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
};

export default StudentPortal;
