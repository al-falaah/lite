import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import { toast } from 'sonner';
import { usePullToRefresh, PullIndicator } from '../hooks/usePullToRefresh.jsx';
import {
  Calendar, Clock, Video, CheckCircle, BookOpen, BarChart3,
  User, LogOut, ExternalLink, CreditCard,
  DollarSign, AlertCircle, GraduationCap, X, UserCheck, Mail, Send, Settings, Gamepad2,
  Home, Trophy, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StudentClassEtiquette from '../components/student/StudentClassEtiquette';
import StudentLessons from '../components/student/StudentLessons';
import TestProgressCard from '../components/student/TestProgressCard';
import StudentCertificateCard from '../components/student/StudentCertificateCard';
import RecitationPractice from '../components/student/RecitationPractice';
import {
  PROGRAMS,
  PROGRAM_IDS,
  getProgramName as getConfigProgramName,
  getProgramDuration as getConfigProgramDuration
} from '../config/programs';

// Get milestones from centralized config
const TAJWEED_MILESTONES = PROGRAMS[PROGRAM_IDS.TAJWEED].milestones;
const EAIS_MILESTONES = PROGRAMS[PROGRAM_IDS.ESSENTIALS].milestones;

// Calculate current milestone based on week number
const getCurrentMilestone = (currentWeek, isTajweed) => {
  const milestones = isTajweed ? TAJWEED_MILESTONES : EAIS_MILESTONES;

  // Find milestone that contains the current week
  const milestone = milestones.find(
    m => currentWeek >= m.weekStart && currentWeek <= m.weekEnd
  );

  if (!milestone) {
    // If week is beyond last milestone, return last milestone as "completed"
    return {
      ...milestones[milestones.length - 1],
      isCompleted: true,
      weeksInMilestone: 0,
      weeksCompleted: 0,
      milestoneProgress: 100
    };
  }

  // Calculate progress within this milestone
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

const StudentPortal = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [assignedTeachers, setAssignedTeachers] = useState({});

  // Tab state
  const [activeTab, setActiveTab] = useState('home');

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState(null);
  const [emailMessage, setEmailMessage] = useState('');

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState({
    full_name: '',
    phone: '',
  });

  // Session loading
  const [initialLoading, setInitialLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Pull-to-refresh: reload student data
  const { pullDistance, isPulling } = usePullToRefresh(() => {
    if (student?.id) {
      loadStudentData(student.id);
      toast('Refreshed', { duration: 1500 });
    }
  });

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setShouldRedirect(true);
          return;
        }

        const role = session.user.user_metadata?.role;
        if (role !== 'student') {
          setShouldRedirect(true);
          return;
        }

        // Look up student by email
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (!studentData) {
          toast.error('Student record not found');
          setShouldRedirect(true);
          return;
        }

        setStudent(studentData);
        await loadStudentData(studentData.id);
      } catch (error) {
        console.error('Session restore error:', error);
        setShouldRedirect(true);
      } finally {
        setInitialLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loadStudentData = async (studentId) => {
    console.log('Loading student data for ID:', studentId);
    try {
      // Load enrollments (only active ones)
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'active') // Only show active enrollments
        .order('created_at', { ascending: false });

      if (enrollmentsError) {
        console.error('Enrollments error:', enrollmentsError);
        throw enrollmentsError;
      }
      console.log('Enrollments loaded:', enrollmentsData?.length || 0);
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
    const availablePrograms = Object.values(PROGRAM_IDS);
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


  const handleOpenSettings = () => {
    setSettingsFormData({
      full_name: student.full_name || '',
      phone: student.phone || '',
    });
    setShowSettingsModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!settingsFormData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSettingsLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          full_name: settingsFormData.full_name,
          phone: settingsFormData.phone,
        })
        .eq('id', student.id);

      if (error) {
        toast.error('Failed to update profile');
        console.error(error);
        setSettingsLoading(false);
        return;
      }

      // Update local state
      const updatedStudent = {
        ...student,
        full_name: settingsFormData.full_name,
        phone: settingsFormData.phone,
      };
      setStudent(updatedStudent);

      toast.success('Profile updated successfully!');
      setShowSettingsModal(false);
      setSettingsLoading(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('An error occurred');
      setSettingsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setStudent(null);
      setEnrollments([]);
      setSchedules([]);
      setProgress(null);
      navigate('/login', { replace: true });
    }
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

  // Use centralized config functions
  const getProgramName = (program) => getConfigProgramName(program);
  const getProgramDuration = (program) => getConfigProgramDuration(program);

  // Compute active week for a given enrollment (reused across tabs)
  const getActiveWeekForEnrollment = (enrollment) => {
    const programSchedules = schedules.filter(s => s.program === enrollment.program);
    const isTajweed = enrollment.program === PROGRAM_IDS.TAJWEED;
    const programConfig = PROGRAMS[enrollment.program];
    const totalYears = programConfig?.duration.years || (isTajweed ? 1 : 2);
    const totalWeeks = programConfig?.duration.weeks || (isTajweed ? 24 : 104);
    const weeksPerYear = Math.ceil(totalWeeks / totalYears);

    if (programSchedules.length === 0) return { year: 1, week: 1, weeksPerYear, totalWeeks, totalYears, programSchedules };

    const weekMap = {};
    programSchedules.forEach(schedule => {
      const key = `${schedule.academic_year}-${schedule.week_number}`;
      if (!weekMap[key]) weekMap[key] = [];
      weekMap[key].push(schedule);
    });

    for (let year = 1; year <= totalYears; year++) {
      for (let weekNum = 1; weekNum <= weeksPerYear; weekNum++) {
        const weekClasses = weekMap[`${year}-${weekNum}`];
        if (!weekClasses || weekClasses.length === 0) {
          return { year, week: weekNum, weeksPerYear, totalWeeks, totalYears, programSchedules };
        }
        if (!weekClasses.every(c => c.status === 'completed')) {
          return { year, week: weekNum, weeksPerYear, totalWeeks, totalYears, programSchedules };
        }
      }
    }

    return { year: totalYears, week: weeksPerYear, weeksPerYear, totalWeeks, totalYears, programSchedules };
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-300', label: 'Active' },
      completed: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', label: 'Completed' },
      withdrawn: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', label: 'Withdrawn' },
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // Redirect to login if not authenticated
  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  if (initialLoading || !student) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-10 w-10 mx-auto mb-4" />
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Helmet><title>Student Portal | The FastTrack Madrasah</title></Helmet>
      <PullIndicator pullDistance={pullDistance} isPulling={isPulling} />
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/favicon.svg"
                alt="The FastTrack Madrasah"
                className="h-6 w-6 sm:h-8 sm:w-8"
              />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-xs sm:text-base font-brand font-semibold text-gray-900 dark:text-white" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-xs sm:text-base font-brand font-semibold text-gray-900 dark:text-white" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-0 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium truncate max-w-[120px] sm:max-w-none">{student?.full_name}</span>
                {student?.student_id && (
                  <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm">
                    <span className="hidden sm:inline">• </span>
                    {student.student_id}
                  </span>
                )}
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center p-1.5 sm:p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                onClick={handleOpenSettings}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Tab Bar */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'classes', label: 'Classes', icon: Calendar },
              { id: 'lessons', label: 'Lessons', icon: BookOpen },
              { id: 'practice', label: 'Practice', icon: Gamepad2 },
              { id: 'results', label: 'Results', icon: Trophy },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 sm:pb-8">
        <div className="space-y-6">
          {/* === HOME TAB === */}
          <div className={activeTab !== 'home' ? 'hidden' : ''}>
          <div className="space-y-4 sm:space-y-6">
          {/* Welcome Header */}
          <div>
            <h1 className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {student?.full_name?.split(' ')[0]}!</h1>
            <p className="text-xs sm:text-base text-gray-500 dark:text-gray-400 mt-0.5">
              {student?.student_id ? `Student ID: ${student.student_id}` : 'Complete payment to receive your Student ID'}
            </p>
          </div>

          {/* Class Etiquette */}
          <StudentClassEtiquette />

          {/* Enrollments */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enrolment & Billing</h2>
            {!isEnrolledInAllPrograms() && (
              <Link
                to={`/enroll-additional?email=${encodeURIComponent(student.email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                + Add another program
              </Link>
            )}
          </div>
          {enrollments.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                <p className="text-sm font-medium mb-1">No enrollments found</p>
                <p className="text-xs">Please contact support if you believe this is an error.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => {
                const programName = getProgramName(enrollment.program);
                const programDuration = getProgramDuration(enrollment.program);
                const hasPendingPayment = enrollment.balance_remaining > 0;
                const isTajweed = enrollment.program === PROGRAM_IDS.TAJWEED;

                return (
                  <Card key={enrollment.id} className="p-4 sm:p-5">
                    {/* Enrollment Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{programName}</h2>
                          {getStatusBadge(enrollment.status)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {programDuration} · Enrolled {new Date(enrollment.enrolled_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
                      <div className="bg-white dark:bg-gray-700 p-2.5 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Total Fees</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">${enrollment.total_fees?.toFixed(2)}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-2.5 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Paid</p>
                        <p className="text-base sm:text-lg font-semibold text-emerald-600">${enrollment.total_paid?.toFixed(2)}</p>
                      </div>
                      <div className={`bg-white dark:bg-gray-700 p-2.5 sm:p-3 rounded-lg border ${hasPendingPayment ? 'border-amber-300 dark:border-amber-500/50' : 'border-gray-200 dark:border-gray-600'}`}>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Balance</p>
                        <p className={`text-base sm:text-lg font-semibold ${hasPendingPayment ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ${enrollment.balance_remaining?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Assigned Teacher */}
                    {assignedTeachers[enrollment.program] && (
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Your Teacher</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{assignedTeachers[enrollment.program].full_name}</p>
                          </div>
                          <Button
                            onClick={() => handleOpenEmailModal(assignedTeachers[enrollment.program], enrollment.program)}
                            className="inline-flex items-center text-xs shrink-0"
                            variant="secondary"
                          >
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                            Message
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Billing Portal Link */}
                    {student?.stripe_customer_id && (
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Manage Billing</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Payment methods, invoices & subscription</p>
                          </div>
                          <Button
                            onClick={handleBillingPortal}
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            disabled={loading}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
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

          {/* Install App Guide */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <svg className="h-4 w-4 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Get the Mobile App</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Runs like a native app on your phone — add it to your home screen in seconds.</p>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p><strong>iPhone:</strong> Safari → tap <svg className="inline h-5 w-5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share → <strong>Add to Home Screen</strong></p>
              <p><strong>Android:</strong> Chrome → tap <svg className="inline h-5 w-5 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg> → <strong>Install app</strong></p>
            </div>
          </div>
          </div>
          </div>

          {/* === CLASSES TAB === */}
          <div className={activeTab !== 'classes' ? 'hidden' : ''}>
          <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Class Schedule & Progress</h2>

          {/* Class Schedules - Per Program */}
          {enrollments.map((enrollment) => {
            const programSchedules = schedules.filter(s => s.program === enrollment.program);
            const programName = getProgramName(enrollment.program);
            const isTajweed = enrollment.program === PROGRAM_IDS.TAJWEED;

            // If enrollment is not active, show disabled message
            if (enrollment.status !== 'active') {
              return (
                <Card key={enrollment.id}>
                  <div className="text-center py-8 bg-red-50 dark:bg-red-900/20">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-red-400" />
                    <p className="text-lg font-semibold mb-2 text-red-800 dark:text-red-300">{programName} - Enrollment {enrollment.status}</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {enrollment.status === 'withdrawn'
                        ? 'Your enrollment has been withdrawn. Please contact admin for assistance.'
                        : enrollment.status === 'completed'
                        ? 'Congratulations! You have completed this program.'
                        : 'Your enrollment is not active. Please contact admin for assistance.'}
                    </p>
                  </div>
                </Card>
              );
            }

            if (programSchedules.length === 0) {
              return (
                <Card key={enrollment.id}>
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-lg font-medium mb-2">{programName} - Schedule Coming Soon</p>
                    <p className="text-sm">Your class schedule will appear here once it's been created by the admin.</p>
                  </div>
                </Card>
              );
            }

            // Get program config from centralized configuration
            const programConfig = PROGRAMS[enrollment.program];
            const totalYears = programConfig?.duration.years || (isTajweed ? 1 : 2);
            const totalWeeks = programConfig?.duration.weeks || (isTajweed ? 24 : 104);
            const weeksPerYear = Math.ceil(totalWeeks / totalYears);

            // Get current active week based on actual schedule data (same logic as TeacherPortal)
            const getCurrentActiveWeekAndYear = () => {
              if (programSchedules.length === 0) return { year: 1, week: 1 };

              const weekMap = {};

              programSchedules.forEach(schedule => {
                const key = `${schedule.academic_year}-${schedule.week_number}`;
                if (!weekMap[key]) {
                  weekMap[key] = [];
                }
                weekMap[key].push(schedule);
              });

              // Check each year for the first incomplete week
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

            const currentActive = getCurrentActiveWeekAndYear();
            const completedWeeks = (currentActive.year - 1) * weeksPerYear + currentActive.week - 1;
            const progressPercent = Math.round((completedWeeks / totalWeeks) * 100);

            const currentWeekClasses = programSchedules.filter(
              s => s.academic_year === currentActive.year && s.week_number === currentActive.week
            );

            const mainClass = currentWeekClasses.find(c => c.class_type === 'main');
            const shortClass = currentWeekClasses.find(c => c.class_type === 'short');

            // Calculate milestone progress
            const currentWeekNumber = (currentActive.year - 1) * weeksPerYear + currentActive.week;
            const currentMilestone = getCurrentMilestone(currentWeekNumber, isTajweed);
            const milestones = programConfig?.milestones || (isTajweed ? TAJWEED_MILESTONES : EAIS_MILESTONES);
            const totalMilestones = milestones.length;

            return (
              <Card key={enrollment.id}>
                {/* Program Header */}
                <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{programName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Week {currentActive.week} • {progressPercent}% Complete</p>
                    </div>
                  </div>
                </div>

                {/* Milestone Tracker */}
                <div className="mb-8">
                  {/* Current Milestone Info */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentMilestone.name}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Milestone {currentMilestone.id} of {totalMilestones}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentMilestone.subtitle}
                    </p>
                  </div>

                  {/* Milestone Timeline - Full Width */}
                  <div className="space-y-3">
                    {/* Progress Track */}
                    <div className="relative">
                      {/* Background Track */}
                      <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-600" />

                      {/* Progress Fill */}
                      <div
                        className="absolute top-3 left-0 h-0.5 bg-emerald-600 transition-all"
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
                                    : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 text-gray-400'
                                }`}
                                title={milestone.subtitle}
                              >
                                {isCompleted ? '✓' : milestone.id}
                              </div>

                              {/* Milestone Label - Hidden on small screens */}
                              <span className={`mt-2 text-[10px] font-medium text-center max-w-[60px] leading-tight hidden sm:block ${
                                isCurrent ? 'text-gray-900 dark:text-white' : isCompleted ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                {milestone.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Milestone Progress Info */}
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 pt-2">
                      <span>{currentMilestone.weeksCompleted} of {currentMilestone.weeksInMilestone} weeks completed</span>
                      <span>{currentMilestone.milestoneProgress}%</span>
                    </div>
                  </div>
                </div>

                {/* Current Week Classes */}
                {currentWeekClasses.length > 0 ? (
                  <div className="space-y-3">
                    {/* Main Class */}
                    {mainClass && (
                      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Video className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                Main Class
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">2 hrs</span>
                            </div>
                            {mainClass.scheduled_date && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(mainClass.scheduled_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })} • {new Date(mainClass.scheduled_date).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            mainClass.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                            mainClass.status === 'scheduled' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                            'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                          }`}>
                            {mainClass.status === 'completed' ? 'Completed' :
                             mainClass.status === 'scheduled' ? 'Scheduled' : mainClass.status}
                          </span>
                        </div>

                        {mainClass.meeting_link && mainClass.status === 'scheduled' && (
                          <a
                            href={mainClass.meeting_link.startsWith('http') ? mainClass.meeting_link : `https://${mainClass.meeting_link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-emerald-950 dark:bg-emerald-600 text-white rounded-lg hover:bg-emerald-900 dark:hover:bg-emerald-700 transition-colors text-sm font-medium"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Join Class
                          </a>
                        )}
                      </div>
                    )}

                    {/* Short Class */}
                    {shortClass && (
                      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Video className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                Short Class
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">30 min</span>
                            </div>
                            {shortClass.scheduled_date && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(shortClass.scheduled_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })} • {new Date(shortClass.scheduled_date).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            shortClass.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                            shortClass.status === 'scheduled' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                            'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                          }`}>
                            {shortClass.status === 'completed' ? 'Completed' :
                             shortClass.status === 'scheduled' ? 'Scheduled' : shortClass.status}
                          </span>
                        </div>

                        {shortClass.meeting_link && shortClass.status === 'scheduled' && (
                          <a
                            href={shortClass.meeting_link.startsWith('http') ? shortClass.meeting_link : `https://${shortClass.meeting_link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-emerald-950 dark:bg-emerald-600 text-white rounded-lg hover:bg-emerald-900 dark:hover:bg-emerald-700 transition-colors text-sm font-medium"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Join Class
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No classes scheduled for this week</p>
                  </div>
                )}

                {/* Overall Progress */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {(() => {
                    const completedClasses = programSchedules.filter(s => s.status === 'completed').length;
                    const totalClasses = totalWeeks * 2; // 2 classes per week (main + short)
                    const completionPercent = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;

                    return (
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Overall Progress</h4>
                          <span className="text-2xl font-bold text-emerald-600">{completionPercent}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-3">
                          <div
                            className="absolute top-0 left-0 h-full bg-emerald-600 rounded-full transition-all"
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>

                        {/* Class Count */}
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>{completedClasses} of {totalClasses} classes completed</span>
                          <span>{totalClasses - completedClasses} remaining</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </Card>
            );
          })}
          </div>
          </div>

          {/* === LESSONS TAB === */}
          <div className={activeTab !== 'lessons' ? 'hidden' : ''}>
            <StudentLessons enrollments={enrollments} />
          </div>

          {/* === PRACTICE TAB === */}
          <div className={activeTab !== 'practice' ? 'hidden' : ''}>
          <div className="space-y-6">
          {/* Practice Drills */}
          <Card className="border border-purple-200 dark:border-purple-800/50 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex-shrink-0">
                  <Gamepad2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Practice Drills</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Level up with interactive quizzes — earn XP, build streaks, and climb the leaderboard</p>
                </div>
              </div>
              <Link to="/drills" className="sm:flex-shrink-0">
                <Button variant="primary" className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto whitespace-nowrap">
                  Start Drilling
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recitation Practice - Per Program */}
          {enrollments.filter(e => e.status === 'active').map(enrollment => (
            student?.id && (
              <div key={enrollment.id}>
                {enrollments.filter(e => e.status === 'active').length > 1 && (
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">{getProgramName(enrollment.program)}</h3>
                )}
                <RecitationPractice
                  studentId={student.id}
                  programId={enrollment.program}
                  teacherId={assignedTeachers[enrollment.program]?.id}
                />
              </div>
            )
          ))}
          </div>
          </div>

          {/* === RESULTS TAB === */}
          <div className={activeTab !== 'results' ? 'hidden' : ''}>
          <div className="space-y-6">
          {enrollments.filter(e => e.status === 'active').map(enrollment => {
            const activeWeek = getActiveWeekForEnrollment(enrollment);
            return (
              <div key={enrollment.id} className="space-y-4">
                {enrollments.filter(e => e.status === 'active').length > 1 && (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getProgramName(enrollment.program)}</h3>
                )}
                <TestProgressCard programId={enrollment.program} currentWeek={activeWeek.week} />
                <StudentCertificateCard programId={enrollment.program} />
              </div>
            );
          })}
          </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-50 sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center h-14 px-1">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'classes', label: 'Classes', icon: Calendar },
            { id: 'lessons', label: 'Lessons', icon: BookOpen },
            { id: 'practice', label: 'Practice', icon: Gamepad2 },
            { id: 'results', label: 'Results', icon: Trophy },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-500 active:bg-gray-100 dark:active:bg-gray-700'
              }`}
            >
              <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400' : ''}`} strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
              <span className={`text-[10px] ${activeTab === tab.id ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && emailRecipient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send Message</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">To: {emailRecipient.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailMessage('');
                    setEmailRecipient(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Staff ID</p>
                      <p className="font-medium dark:text-white">{emailRecipient.staffId}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Program</p>
                      <p className="font-medium capitalize dark:text-white">
                        {PROGRAMS[emailRecipient.program]?.shortName || emailRecipient.program}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Email</p>
                      <p className="font-medium dark:text-white">{emailRecipient.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="emailMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="emailMessage"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="Type your message here..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
                    <Settings className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Update your profile information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.full_name}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, full_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settingsFormData.phone}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="+64 21 123 4567"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Note:</strong> Your email and student ID cannot be changed. Contact admin if you need to update these details.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowSettingsModal(false)}
                    disabled={settingsLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={settingsLoading}
                  >
                    {settingsLoading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentPortal;
