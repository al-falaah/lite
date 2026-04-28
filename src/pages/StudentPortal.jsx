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
import StudentQuizLeaderboards from '../components/student/StudentQuizLeaderboards';
import TestProgressCard from '../components/student/TestProgressCard';
import StudentCertificateCard from '../components/student/StudentCertificateCard';
import RecitationPractice from '../components/student/RecitationPractice';
import {
  PAGE,
  CARD_FOOTER,
  BTN_PRIMARY, BTN_SECONDARY,
  INPUT, TEXTAREA,
  CONTAINER_WIDE,
  TAB_ACTIVE, TAB_INACTIVE,
  BOTTOM_TAB_ACTIVE, BOTTOM_TAB_INACTIVE,
  HEADING, LABEL, LABEL_TINY,
} from '../design/ui';
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
  const [lessonsSubTab, setLessonsSubTab] = useState('lessons'); // 'lessons' | 'reading'

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
      <div className={`${PAGE} dark:bg-gray-900 flex items-center justify-center`}>
        <div className="text-center">
          <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-10 w-10 mx-auto mb-4 dark:hidden" />
          <img src="/favicon-white.svg" alt="The FastTrack Madrasah" className="h-10 w-10 mx-auto mb-4 hidden dark:block" />
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'classes', label: 'Classes', icon: Calendar },
    { id: 'lessons', label: 'Lessons', icon: BookOpen },
    { id: 'practice', label: 'Leaderboard', icon: Trophy },
    { id: 'results', label: 'Results', icon: Trophy },
  ];

  return (
    <div className={`${PAGE} dark:bg-gray-900`}>
      <Helmet><title>Student Portal | The FastTrack Madrasah</title></Helmet>
      <PullIndicator pullDistance={pullDistance} isPulling={isPulling} />

      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
        <div className={`${CONTAINER_WIDE} h-14 sm:h-16 flex items-center justify-between gap-3`}>
          <Link to="/" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
            <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 dark:hidden" />
            <img src="/favicon-white.svg" alt="The FastTrack Madrasah" className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 hidden dark:block" />
            <div className="flex flex-col leading-none">
              <span className="text-xs sm:text-sm font-brand font-semibold text-slate-900 dark:text-white">The FastTrack</span>
              <span className="text-xs sm:text-sm font-brand font-semibold text-slate-900 dark:text-white" style={{ letterSpacing: '0.28em' }}>Madrasah</span>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center h-9 w-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={handleOpenSettings}
              className="inline-flex items-center justify-center h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 hover:border-slate-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 hover:border-slate-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop tab bar */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
        <div className={CONTAINER_WIDE}>
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? TAB_ACTIVE : TAB_INACTIVE}
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

            {/* Greeting card */}
            {(() => {
              const name = student?.full_name || '';
              const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'S';
              const enrolmentStatus = student?.status || 'active';
              return (
                <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm p-5 sm:p-6 mb-5 flex items-center gap-4 sm:gap-5">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-lg sm:text-xl font-semibold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                      As-salāmu ʿalaykum, {student?.full_name?.split(' ')[0]}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                      {student?.student_id
                        ? <>ID {student.student_id} · <span className={enrolmentStatus === 'active' ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-700 dark:text-gray-300'}>
                            {enrolmentStatus === 'active' ? 'Active' : enrolmentStatus}
                          </span></>
                        : 'Complete payment to receive your Student ID'
                      }
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { id: 'classes', label: 'My classes', icon: Calendar },
                { id: 'lessons', label: 'My lessons', icon: BookOpen },
                { id: 'practice', label: 'Leaderboard', icon: Trophy },
                { id: 'results', label: 'Results', icon: Trophy },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm hover:border-slate-300 hover:shadow transition-all p-4 flex items-center gap-3 text-left"
                >
                  <div className="h-9 w-9 rounded-md bg-slate-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4.5 w-4.5 text-slate-700 dark:text-gray-200" />
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Overall progress card */}
            {(() => {
              let completedClasses = 0;
              let totalClasses = 0;
              enrollments.filter(e => e.status === 'active').forEach(enrollment => {
                const programSchedules = schedules.filter(s => s.program === enrollment.program);
                const programConfig = PROGRAMS[enrollment.program];
                const isTajweed = enrollment.program === PROGRAM_IDS.TAJWEED;
                const totalWeeks = programConfig?.duration.weeks || (isTajweed ? 24 : 104);
                const completed = programSchedules.filter(s => s.status === 'completed').length;
                completedClasses += completed;
                totalClasses += totalWeeks * 2;
              });
              const percent = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;
              return (
                <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm p-5 mb-5">
                  <div className="flex items-baseline justify-between mb-2">
                    <h2 className={`${HEADING} dark:text-white`}>Overall progress</h2>
                    <span className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{percent}<span className="text-sm text-slate-500 dark:text-gray-400">%</span></span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                    {completedClasses} of {totalClasses} classes completed across your active programs
                  </p>
                </div>
              );
            })()}

            {/* Class etiquette block (collapsible card) */}
            <div className="mb-5">
              <StudentClassEtiquette />
            </div>

            {/* Install app card */}
            <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-700">
                <h2 className={`${HEADING} dark:text-white`}>Get the mobile app</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                  Runs like a native app — add it to your home screen in seconds.
                </p>
              </div>
              <div className="px-5 py-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 px-3 py-2.5">
                    <dt className={LABEL_TINY}>iPhone</dt>
                    <dd className="text-slate-900 dark:text-white mt-1">
                      Safari → <span className="text-slate-700 dark:text-gray-300">Share</span> → <strong>Add to Home Screen</strong>
                    </dd>
                  </div>
                  <div className="rounded-md border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 px-3 py-2.5">
                    <dt className={LABEL_TINY}>Android</dt>
                    <dd className="text-slate-900 dark:text-white mt-1">
                      Chrome → <span className="text-slate-700 dark:text-gray-300">⋮ menu</span> → <strong>Install app</strong>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* === CLASSES TAB === */}
          <div className={activeTab !== 'classes' ? 'hidden' : ''}>
            <div className="flex items-baseline justify-between mb-5">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">Your classes</h1>
              {!isEnrolledInAllPrograms() && student?.email && (
                <Link
                  to={`/enroll-additional?email=${encodeURIComponent(student.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-colors"
                >
                  + Add another program
                </Link>
              )}
            </div>

            <div className="space-y-5">
            {enrollments.map((enrollment) => {
              const programSchedules = schedules.filter(s => s.program === enrollment.program);
              const programName = getProgramName(enrollment.program);
              const isTajweed = enrollment.program === PROGRAM_IDS.TAJWEED;
              const programConfig = PROGRAMS[enrollment.program];

              // Inactive enrolment — disabled card
              if (enrollment.status !== 'active') {
                return (
                  <div key={enrollment.id} className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-700">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{programName}</h2>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
                        Enrollment {enrollment.status}
                      </p>
                    </div>
                    <div className="px-5 py-5 text-sm text-slate-700 dark:text-gray-300">
                      {enrollment.status === 'withdrawn'
                        ? 'Your enrollment has been withdrawn. Please contact admin for assistance.'
                        : enrollment.status === 'completed'
                        ? 'Congratulations! You have completed this program.'
                        : 'Your enrollment is not active. Please contact admin for assistance.'}
                    </div>
                  </div>
                );
              }

              // No schedule yet
              if (programSchedules.length === 0) {
                return (
                  <div key={enrollment.id} className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-700">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{programName}</h2>
                    </div>
                    <div className="px-5 py-8 text-center">
                      <Calendar className="h-8 w-8 text-slate-300 dark:text-gray-600 mx-auto mb-3" strokeWidth={1.5} />
                      <p className="text-sm font-medium text-slate-700 dark:text-gray-300">Schedule coming soon</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                        Your class schedule will appear here once it's been created.
                      </p>
                    </div>
                  </div>
                );
              }

              // Active with schedule — render full card
              const totalYears = programConfig?.duration.years || (isTajweed ? 1 : 2);
              const totalWeeks = programConfig?.duration.weeks || (isTajweed ? 24 : 104);
              const weeksPerYear = Math.ceil(totalWeeks / totalYears);

              const getCurrentActiveWeekAndYear = () => {
                const weekMap = {};
                programSchedules.forEach(s => {
                  const key = `${s.academic_year}-${s.week_number}`;
                  if (!weekMap[key]) weekMap[key] = [];
                  weekMap[key].push(s);
                });
                for (let year = 1; year <= totalYears; year++) {
                  for (let weekNum = 1; weekNum <= weeksPerYear; weekNum++) {
                    const weekClasses = weekMap[`${year}-${weekNum}`];
                    if (!weekClasses || weekClasses.length === 0) return { year, week: weekNum };
                    if (!weekClasses.every(c => c.status === 'completed')) return { year, week: weekNum };
                  }
                }
                return { year: totalYears, week: weeksPerYear };
              };

              const currentActive = getCurrentActiveWeekAndYear();
              const completedWeeks = (currentActive.year - 1) * weeksPerYear + currentActive.week - 1;
              const progressPercent = Math.round((completedWeeks / totalWeeks) * 100);
              const currentWeekClasses = programSchedules.filter(
                s => s.academic_year === currentActive.year && s.week_number === currentActive.week
              );
              const mainClass = currentWeekClasses.find(c => c.class_type === 'main');
              const shortClass = currentWeekClasses.find(c => c.class_type === 'short');
              const currentWeekNumber = (currentActive.year - 1) * weeksPerYear + currentActive.week;
              const currentMilestone = getCurrentMilestone(currentWeekNumber, isTajweed);
              const milestones = programConfig?.milestones || (isTajweed ? TAJWEED_MILESTONES : EAIS_MILESTONES);
              const totalMilestones = milestones.length;
              const completedClasses = programSchedules.filter(s => s.status === 'completed').length;
              const totalClasses = totalWeeks * 2;
              const completionPercent = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;

              return (
                <div key={enrollment.id} className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-700 flex items-baseline justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{programName}</h2>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                        Week {currentWeekNumber} of {totalWeeks} · {progressPercent}% complete
                      </p>
                    </div>
                  </div>

                  {/* Milestone */}
                  <div className="px-5 py-5">
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {currentMilestone.name}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-gray-400">
                          Milestone {currentMilestone.id} of {totalMilestones}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                        {currentMilestone.subtitle}
                      </p>
                    </div>

                    {/* Milestone timeline */}
                    <div className="relative mb-2">
                      <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-200 dark:bg-gray-700" />
                      <div
                        className="absolute top-3 left-0 h-0.5 bg-emerald-600 transition-all"
                        style={{ width: `${((currentMilestone.id - 1) / Math.max(totalMilestones - 1, 1)) * 100}%` }}
                      />
                      <div className="relative flex justify-between">
                        {(isTajweed ? TAJWEED_MILESTONES : EAIS_MILESTONES).map((milestone) => {
                          const isCompleted = currentMilestone.id > milestone.id;
                          const isCurrent = currentMilestone.id === milestone.id;
                          return (
                            <div key={milestone.id} className="flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                                  isCompleted || isCurrent
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 text-slate-400 dark:text-gray-500'
                                }`}
                                title={milestone.subtitle}
                              >
                                {isCompleted ? '✓' : milestone.id}
                              </div>
                              <span className={`mt-2 text-[10px] font-medium text-center max-w-[60px] leading-tight hidden sm:block ${
                                isCurrent ? 'text-slate-900 dark:text-white' : isCompleted ? 'text-slate-700 dark:text-gray-300' : 'text-slate-400 dark:text-gray-500'
                              }`}>
                                {milestone.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-3 sm:mt-4">
                      {currentMilestone.weeksCompleted} of {currentMilestone.weeksInMilestone} weeks · {currentMilestone.milestoneProgress}% through this milestone
                    </p>
                  </div>

                  {/* This week's classes */}
                  <div className="px-5 py-4 border-t border-slate-100 dark:border-gray-700">
                    <h3 className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">This week</h3>
                    {currentWeekClasses.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-gray-400 py-2">No classes scheduled this week.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-gray-700">
                        {[mainClass, shortClass].filter(Boolean).map(cls => {
                          const isMain = cls.class_type === 'main';
                          const duration = isMain
                            ? programConfig?.schedule?.session1?.duration
                            : programConfig?.schedule?.session2?.duration;
                          const completed = cls.status === 'completed';
                          const dateLabel = cls.scheduled_date ? new Date(cls.scheduled_date).toLocaleDateString('en-NZ', {
                            weekday: 'short', month: 'short', day: 'numeric',
                          }) : null;
                          const timeLabel = cls.scheduled_date ? new Date(cls.scheduled_date).toLocaleTimeString('en-NZ', {
                            hour: '2-digit', minute: '2-digit',
                          }) : null;
                          return (
                            <div key={cls.id} className="py-3 first:pt-0 last:pb-0">
                              <div className="flex items-baseline justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {isMain ? 'Main class' : 'Short class'}
                                    <span className="text-slate-400 dark:text-gray-500 font-normal"> · {duration}</span>
                                  </p>
                                  {(dateLabel || timeLabel) && (
                                    <p className="text-sm text-slate-600 dark:text-gray-300 mt-0.5">
                                      {dateLabel}{dateLabel && timeLabel ? ' · ' : ''}{timeLabel}
                                    </p>
                                  )}
                                </div>
                                <span className={`text-xs font-medium ${completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-400'}`}>
                                  {completed ? 'Completed' : 'Scheduled'}
                                </span>
                              </div>
                              {cls.meeting_link && cls.status === 'scheduled' && (
                                <a
                                  href={cls.meeting_link.startsWith('http') ? cls.meeting_link : `https://${cls.meeting_link}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center mt-2 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                                >
                                  <Video className="h-4 w-4 mr-1.5" />
                                  Join class
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Overall program progress */}
                  <div className="px-5 py-4 border-t border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/30">
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide">Overall progress</h3>
                      <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{completionPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      {completedClasses} of {totalClasses} classes completed
                    </p>
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* === LESSONS TAB (with sub-tabs) === */}
          <div className={activeTab !== 'lessons' ? 'hidden' : ''}>
            {/* Sub-tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'lessons', label: 'Lessons' },
                { id: 'reading', label: 'Reading Practice' },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setLessonsSubTab(sub.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    lessonsSubTab === sub.id
                      ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {lessonsSubTab === 'lessons' && (
              <StudentLessons enrollments={enrollments} />
            )}

            {lessonsSubTab === 'reading' && (
              <div className="space-y-6">
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
            )}
          </div>

          {/* === LEADERBOARD TAB (renamed from Practice) === */}
          <div className={activeTab !== 'practice' ? 'hidden' : ''}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Leaderboard
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Top scores per chapter drill, by program. Last attempt counts.
              </p>
            </div>
            <StudentQuizLeaderboards enrollments={enrollments} />
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

      {/* Mobile bottom tab bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 z-40 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex justify-around items-stretch px-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? BOTTOM_TAB_ACTIVE : BOTTOM_TAB_INACTIVE}
            >
              <tab.icon className="h-5 w-5" strokeWidth={activeTab === tab.id ? 2.25 : 1.75} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Email modal */}
      {showEmailModal && emailRecipient && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-slate-100 dark:border-gray-700 px-5 py-4 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <h2 className={HEADING}>Message your teacher</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 truncate">To {emailRecipient.name}</p>
              </div>
              <button
                onClick={() => { setShowEmailModal(false); setEmailMessage(''); setEmailRecipient(null); }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 p-1.5 -mr-1.5 rounded transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className={LABEL_TINY}>Staff ID</dt>
                  <dd className="text-slate-900 dark:text-white mt-1">{emailRecipient.staffId}</dd>
                </div>
                <div>
                  <dt className={LABEL_TINY}>Program</dt>
                  <dd className="text-slate-900 dark:text-white mt-1">{PROGRAMS[emailRecipient.program]?.shortName || emailRecipient.program}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className={LABEL_TINY}>Email</dt>
                  <dd className="text-slate-900 dark:text-white mt-1 break-all">{emailRecipient.email}</dd>
                </div>
              </dl>

              <div>
                <label htmlFor="emailMessage" className={LABEL}>Message</label>
                <textarea
                  id="emailMessage"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={8}
                  placeholder="Type your message…"
                  className={TEXTAREA}
                />
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                  Your teacher receives this via email and can reply to your address directly.
                </p>
              </div>
            </div>

            <div className={`${CARD_FOOTER} flex justify-end gap-2`}>
              <button
                onClick={() => { setShowEmailModal(false); setEmailMessage(''); setEmailRecipient(null); }}
                disabled={loading}
                className={BTN_SECONDARY}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={loading || !emailMessage.trim()}
                className={BTN_PRIMARY}
              >
                {loading ? 'Sending…' : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Send message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-slate-100 dark:border-gray-700 px-5 py-4 flex items-baseline justify-between gap-3">
              <h2 className={HEADING}>Profile settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 p-1.5 -mr-1.5 rounded transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div>
                <label className={LABEL}>Full name</label>
                <input
                  type="text"
                  value={settingsFormData.full_name}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, full_name: e.target.value })}
                  placeholder="Your full name"
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL}>Phone number</label>
                <input
                  type="tel"
                  value={settingsFormData.phone}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, phone: e.target.value })}
                  placeholder="+64 21 123 4567"
                  className={INPUT}
                />
              </div>

              <div className="rounded-md border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 px-4 py-3 text-sm">
                <p className={`${LABEL_TINY} mb-1`}>Note</p>
                <p className="text-slate-600 dark:text-gray-300">
                  Your email and student ID can't be changed here. Contact admin to update them.
                </p>
              </div>
            </div>

            <div className={`${CARD_FOOTER} flex justify-end gap-2`}>
              <button
                onClick={() => setShowSettingsModal(false)}
                disabled={settingsLoading}
                className={BTN_SECONDARY}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={settingsLoading}
                className={BTN_PRIMARY}
              >
                {settingsLoading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentPortal;
