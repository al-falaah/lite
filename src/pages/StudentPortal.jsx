import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import { toast } from 'sonner';
import { usePullToRefresh, PullIndicator } from '../hooks/usePullToRefresh.jsx';
import {
  Clock, Video, CheckCircle, BookOpen,
  User, LogOut, ExternalLink, CreditCard,
  DollarSign, AlertCircle, GraduationCap, X, UserCheck, Mail, Send, Settings, Gamepad2,
  Home, CalendarDays, BookMarked, TrendingUp, ArrowRight, ChevronDown, Mic
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { EmptyState, Spinner } from '../components/common/DataStates';
import StudentClassEtiquette from '../components/student/StudentClassEtiquette';
import StudentLessons from '../components/student/StudentLessons';
import StudentQuizLeaderboards from '../components/student/StudentQuizLeaderboards';
import TestProgressCard from '../components/student/TestProgressCard';
import StudentCertificateCard from '../components/student/StudentCertificateCard';
import RecitationPractice from '../components/student/RecitationPractice';
import * as M from '../design/mashq';
import HomeHero from '../components/student/mashq/HomeHero';
import { Sheet, SpecLabel } from '../components/student/mashq/Sheet';
import {
  CONTEXT_STRIP,
  CONTEXT_STRIP_LABEL,
  CONTEXT_STRIP_TEXT,
  CONTEXT_PROGRAM_PILL,
  CONTEXT_PROGRAM_PILL_ACTIVE,
  CARD_DARK,
  CARD_HEADER_DARK,
  CARD_BODY_DARK,
  HEADING_LG_DARK,
  TEXT_MUTED_DARK,
  TABLE_HEADER_CELL,
  TABLE_BODY_CELL,
  TABLE_ROW,
} from '../design/lms';
import {
  PROGRAMS,
  PROGRAM_IDS,
  getProgramName as getConfigProgramName,
  getProgramDuration as getConfigProgramDuration
} from '../config/programs';

// Get milestones from centralized config
const TAJWEED_MILESTONES = PROGRAMS[PROGRAM_IDS.TAJWEED].milestones;
const EAIS_MILESTONES = PROGRAMS[PROGRAM_IDS.ESSENTIALS].milestones;

// Helper to compute program context info for the context strip
const getProgramContextInfo = (enrollment, schedules) => {
  if (!enrollment) return null;

  const isTajweed = enrollment.program === PROGRAM_IDS.TAJWEED;
  const programConfig = PROGRAMS[enrollment.program];
  const totalYears = programConfig?.duration.years || (isTajweed ? 1 : 2);
  const totalWeeks = programConfig?.duration.weeks || (isTajweed ? 24 : 104);

  // Find the active week by checking schedules for this program
  const programSchedules = schedules.filter(s => s.program === enrollment.program);
  if (programSchedules.length === 0) {
    return {
      programName: getConfigProgramName(enrollment.program),
      currentWeek: 1,
      totalWeeks,
      milestoneName: TAJWEED_MILESTONES[0]?.name || 'Getting Started',
    };
  }

  // week_number is within the academic year; milestones span overall weeks
  // (EASI: 1–104 across 2 years), so convert to the overall week.
  const weeksPerYear = Math.ceil(totalWeeks / totalYears);
  let currentWeek = 1;
  for (const schedule of programSchedules) {
    if (schedule.status !== 'completed') {
      currentWeek = ((schedule.academic_year || 1) - 1) * weeksPerYear + schedule.week_number;
      break;
    }
  }

  const milestone = getCurrentMilestone(currentWeek, isTajweed);

  return {
    programName: getConfigProgramName(enrollment.program),
    currentWeek,
    totalWeeks,
    milestoneName: milestone?.name || 'In Progress',
  };
};

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
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [recitationPrompt, setRecitationPrompt] = useState(null); // {kind:'reviewed'|'assigned'} | null
  const [processingPayment, setProcessingPayment] = useState(null);
  const [assignedTeachers, setAssignedTeachers] = useState({});

  // Tab state
  const [activeTab, setActiveTab] = useState(() => {
    // Restore the last tab only on a genuine in-session revisit — a reload or a
    // back/forward navigation. A fresh entry (logging in and landing on
    // /student) always starts on Home, never a tab left over from before.
    try {
      const navType = performance.getEntriesByType?.('navigation')?.[0]?.type;
      const isRevisit = navType === 'reload' || navType === 'back_forward';
      if (!isRevisit) return 'home';
      let saved = sessionStorage.getItem('studentTab');
      // Migrate the retired 'practice'/'results' tabs to the merged 'progress' tab.
      if (saved === 'practice' || saved === 'results') saved = 'progress';
      if (saved && ['home', 'classes', 'lessons', 'progress'].includes(saved)) return saved;
    } catch { /* ignore */ }
    return 'home';
  });
  const [lessonsSubTab, setLessonsSubTab] = useState('lessons'); // 'lessons' | 'reading'
  // Progress tab sub-view: 'results' (test progress + certificates) | 'rankings' (drill leaderboards)
  const [progressView, setProgressView] = useState('results');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  // True while a lesson chapter is open in the reader — the portal hides its
  // chrome (nav, tab bars, context strip) for an immersive course-player view.
  const [readerOpen, setReaderOpen] = useState(false);
  // Bumped by Home's "Continue learning" — tells StudentLessons to open the
  // student's resume point. The Lessons tab itself is browse-first.
  const [resumeSignal, setResumeSignal] = useState(0);

  // Multi-enrollment program scoping: track the active program for Classes/Lessons/Results tabs
  const [activeProgram, setActiveProgram] = useState(null); // Set on mount to first active enrollment

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

  // Persist active tab to sessionStorage on change
  useEffect(() => {
    try { sessionStorage.setItem('studentTab', activeTab); } catch { /* ignore */ }
  }, [activeTab]);

  // Close the account menu on outside click or Escape
  useEffect(() => {
    if (!accountMenuOpen) return;
    const onDown = (e) => { if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) setAccountMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setAccountMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [accountMenuOpen]);

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

      // Set activeProgram to the first enrollment's program (for multi-enrollment scoping)
      if (enrollmentsData?.length > 0) {
        setActiveProgram(enrollmentsData[0].program);
      }

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

      // Certificates (for the Home snapshot + strip). Keyed by auth user id,
      // same as StudentCertificateCard's own per-program query.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: certs } = await supabase
            .from('certificates')
            .select('id, program_id, verification_code, weighted_total, created_at')
            .eq('student_id', user.id);
          setCertificates(certs || []);
        }
      } catch (e) {
        console.error('Certificates fetch failed (non-fatal):', e);
      }

      // Reading-practice status (drives the Home prompt): does the student have
      // a reviewed practice waiting to be seen, or one assigned to record?
      try {
        const { data: recs } = await supabase
          .from('recitations')
          .select('status, program_id, feedback_seen_at, updated_at')
          .eq('student_id', studentId)
          .in('status', ['assigned', 'reviewed'])
          .order('updated_at', { ascending: false });
        const reviewed = (recs || []).find(r => r.status === 'reviewed' && !r.feedback_seen_at);
        const assigned = (recs || []).find(r => r.status === 'assigned');
        setRecitationPrompt(reviewed ? { kind: 'reviewed' } : assigned ? { kind: 'assigned' } : null);
      } catch (e) {
        console.error('Recitation status fetch failed (non-fatal):', e);
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
    setProcessingPayment(true);
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
      setProcessingPayment(false);
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
      setCertificates([]);
      setRecitationPrompt(null);
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
      active: { bg: 'bg-[var(--mq-accent)]/12', text: 'text-[var(--mq-accent-deeper)]', label: 'Active' },
      completed: { bg: 'bg-[var(--mq-paper-tint)]', text: 'text-[var(--mq-ink)]', label: 'Completed' },
      withdrawn: { bg: 'bg-[var(--mq-paper-tint)]', text: 'text-[var(--mq-ink)]', label: 'Withdrawn' },
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // Redirect to login if not authenticated
  // Teacher-marked class progress per program — same calculation the Classes
  // tab cards use, so the reader footer and Classes tab always agree.
  // (Hook — must stay above the early returns below.)
  const classProgressByProgram = useMemo(() => {
    const map = {};
    enrollments.filter(e => e.status === 'active').forEach(enrollment => {
      const programSchedules = schedules.filter(s => s.program === enrollment.program);
      const programConfig = PROGRAMS[enrollment.program];
      const isTajweed = enrollment.program === PROGRAM_IDS.TAJWEED;
      const totalWeeks = programConfig?.duration.weeks || (isTajweed ? 24 : 104);
      const completed = programSchedules.filter(s => s.status === 'completed').length;
      const total = totalWeeks * 2;
      map[enrollment.program] = { completed, total, pct: total ? Math.round((completed / total) * 100) : 0 };
    });
    return map;
  }, [enrollments, schedules]);

  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  if (initialLoading || !student) {
    return (
      <div className={`${M.MASHQ_ROOT} min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-11 w-11 mx-auto mb-4" />
          <Spinner className="mx-auto" />
          <p className="mt-3 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-[0.15em] text-[var(--mq-ink-faint)]">Loading…</p>
        </div>
      </div>
    );
  }

  // Immersive course-player: while a chapter is open on the Lessons tab, the
  // reader's own top bar is the only chrome (DeepLearning.AI-style).
  const immersive = readerOpen && activeTab === 'lessons';

  const TABS = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'classes', label: 'Classes', icon: CalendarDays },
    { id: 'lessons', label: 'Lessons', icon: BookMarked },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
  ];

  return (
    <div className={`${M.MASHQ_ROOT} min-h-screen`}>
      {/* MASHQ — student portal direction contract (do not delete; audited at finish)
        THESIS: Learning is the practice of a script. The portal is a specimen sheet where
          progress renders as an Arabic letterform mastered stroke by stroke — refusing the
          LMS card-dashboard and the gold-on-green tile cliché.
        OWN-WORLD: Ink (var(--mq-ink)) on warm paper (var(--mq-paper)), one deep teal-green accent (var(--mq-accent)).
          Amiri Arabic letterforms as hero material; grotesque Latin UI; JetBrains Mono for
          specimen readouts only. Ruled hairlines, paper sheets (not app cards), scale-contrast
          hierarchy, registration ticks.
        STORY: The student lands, sees exactly where they are and the one next action (Continue),
          and their mastery reads as a living glyph inking in.
        FIRST VIEWPORT: Monumental mastery glyph on a paper sheet beside greeting + program +
          Continue (primary, accent). Tiny mono labels annotate.
        FORM: Arabic type-specimen / mashq drill sheet; grounded candidate #5; seed 3ef53fd5.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
      <Helmet><title>Student Portal | The FastTrack Madrasah</title></Helmet>
      <PullIndicator pullDistance={pullDistance} isPulling={isPulling} />

      {/* Top nav — one bar: brand · specimen section index · account */}
      <nav className={`sticky top-0 z-40 bg-[var(--mq-paper)]/85 backdrop-blur-sm border-b border-[var(--mq-rule)] ${immersive ? 'hidden' : ''}`}>
        <div className={`${M.CONTAINER} h-14 sm:h-16 flex items-center justify-between gap-4`}>
          <Link to="/" className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity mashq-focus flex-shrink-0">
            <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-xs sm:text-sm font-semibold text-[var(--mq-ink)]">The FastTrack</span>
              <span className="text-[10px] sm:text-xs font-['JetBrains_Mono',monospace] uppercase text-[var(--mq-ink-faint)]" style={{ letterSpacing: '0.28em' }}>Madrasah</span>
            </div>
          </Link>

          {/* Desktop: the ruled section index — mono specimen labels with an
              inked pen-stroke under the active one. Vertically centred in the bar. */}
          <div className="hidden sm:flex items-center h-full flex-1 justify-center gap-1" role="tablist" aria-label="Sections">
            {TABS.map((tab) => {
              const on = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={on}
                  aria-current={on ? 'page' : undefined}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative group flex flex-col items-center justify-center gap-1.5 px-4 lg:px-5 py-2 mashq-focus transition-colors ${on ? 'text-[var(--mq-ink)]' : 'text-[var(--mq-ink-faint)] hover:text-[var(--mq-ink)]'}`}
                >
                  <span className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" strokeWidth={on ? 2.1 : 1.7} />
                    <span className={`font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.14em] ${on ? 'font-semibold' : ''}`}>
                      {tab.label}
                    </span>
                  </span>
                  {/* inked pen-stroke under the active section */}
                  <span className={`pointer-events-none h-[2px] w-6 rounded-full bg-[var(--mq-accent)] origin-center transition-transform duration-300 ${on ? 'scale-x-100' : 'scale-x-0'}`} style={{ transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }} />
                </button>
              );
            })}
          </div>

          {/* Account menu — one control for Settings / Help / Logout */}
          {(() => {
            const initials = (student?.full_name || 'S').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
            return (
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setAccountMenuOpen(o => !o)}
                  className="inline-flex items-center gap-2 rounded-[3px] border border-[var(--mq-rule-strong)] pl-1 pr-2 py-1 hover:bg-[var(--mq-paper-tint)] transition-colors mashq-focus"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  aria-label="Account menu"
                >
                  <span className="h-7 w-7 rounded-[2px] bg-[var(--mq-accent)] text-[var(--mq-on-accent)] text-xs font-semibold flex items-center justify-center">{initials}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-[var(--mq-ink-faint)] transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {accountMenuOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-52 rounded-[4px] border border-[var(--mq-rule)] bg-[var(--mq-paper-raised)] mashq-sheet py-1.5 z-50">
                    <div className="px-3 py-2 border-b border-[var(--mq-rule-soft)]">
                      <p className="text-sm font-semibold text-[var(--mq-ink)] truncate">{student?.full_name || 'Student'}</p>
                      {student?.student_id && <p className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--mq-ink-faint)] mt-0.5">ID {student.student_id}</p>}
                    </div>
                    <button role="menuitem" onClick={() => { setAccountMenuOpen(false); handleOpenSettings(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--mq-ink)] hover:bg-[var(--mq-paper-tint)] transition-colors mashq-focus">
                      <Settings className="h-4 w-4 text-[var(--mq-ink-soft)]" /> Settings
                    </button>
                    <a role="menuitem" href="https://wa.me/message" target="_blank" rel="noopener noreferrer" onClick={() => setAccountMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--mq-ink)] hover:bg-[var(--mq-paper-tint)] transition-colors mashq-focus">
                      <Mail className="h-4 w-4 text-[var(--mq-ink-soft)]" /> Help &amp; support
                    </a>
                    <div className="border-t border-[var(--mq-rule-soft)] mt-1 pt-1">
                      <button role="menuitem" onClick={() => { setAccountMenuOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--mq-bad)] hover:bg-[var(--mq-bad)]/[0.06] transition-colors mashq-focus">
                        <LogOut className="h-4 w-4" /> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </nav>

      {/* Program switcher — only when enrolled in more than one program */}
      {!immersive && enrollments.length > 1 && (
        <div className="bg-[var(--mq-paper-tint)]/60 border-b border-[var(--mq-rule)]">
          <div className={`${M.CONTAINER} py-2.5 flex items-center gap-3 overflow-x-auto`}>
            <SpecLabel className="flex-shrink-0">Programs</SpecLabel>
            <div className="flex gap-2">
              {enrollments.map(enrollment => (
                <button
                  key={enrollment.id}
                  onClick={() => setActiveProgram(enrollment.program)}
                  className={
                    `px-3 py-1 rounded-[3px] text-xs font-medium transition-colors mashq-focus ` +
                    (activeProgram === enrollment.program
                      ? 'bg-[var(--mq-accent)] text-[var(--mq-on-accent)]'
                      : 'border border-[var(--mq-rule-strong)] text-[var(--mq-ink-soft)] hover:bg-[var(--mq-paper-tint)] hover:text-[var(--mq-ink)]')
                  }
                >
                  {getConfigProgramName(enrollment.program)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`${M.CONTAINER} py-6 sm:py-9 pb-28 sm:pb-12`}>
        <div className="space-y-6">
          {/* === HOME TAB === */}
          <div className={activeTab !== 'home' ? 'hidden' : ''}>

            {/* Hero — the specimen hub: mastery glyph + where-am-i + Continue */}
            {(() => {
              const enrolmentStatus = student?.status || 'active';
              const active = enrollments.filter(e => e.status === 'active');
              const resumeEnrollment = active.find(e => e.program === activeProgram) || active[0];
              const contextInfo = resumeEnrollment ? getProgramContextInfo(resumeEnrollment, schedules) : null;
              const prog = resumeEnrollment ? classProgressByProgram[resumeEnrollment.program] : null;
              const fill = prog ? prog.pct / 100 : (contextInfo && contextInfo.totalWeeks ? (contextInfo.currentWeek - 1) / contextInfo.totalWeeks : 0);
              return (
                <HomeHero
                  firstName={student?.full_name?.split(' ')[0]}
                  studentId={student?.student_id}
                  status={enrolmentStatus}
                  programName={contextInfo?.programName}
                  currentWeek={contextInfo?.currentWeek}
                  totalWeeks={contextInfo?.totalWeeks}
                  milestoneName={contextInfo?.milestoneName}
                  programId={resumeEnrollment?.program}
                  fill={fill}
                  onContinue={resumeEnrollment && contextInfo ? () => { setActiveTab('lessons'); setLessonsSubTab('lessons'); setResumeSignal(n => n + 1); } : null}
                />
              );
            })()}

            {/* Reading-practice prompt — feedback ready, or a reading to record */}
            {recitationPrompt && (
              <button
                onClick={() => { setActiveTab('lessons'); setLessonsSubTab('reading'); }}
                className={`${M.SHEET} ${M.SHEET_PAD} mb-6 w-full text-left flex items-center gap-4 hover:bg-[var(--mq-paper-hover)] transition-colors mashq-focus`}
              >
                <span className="flex-shrink-0 h-11 w-11 rounded-[6px] bg-[var(--mq-accent)]/10 flex items-center justify-center">
                  <Mic className="h-5 w-5 text-[var(--mq-accent)]" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <SpecLabel>Reading practice</SpecLabel>
                  <span className="block mt-0.5 font-sans font-semibold text-[var(--mq-ink)]">
                    {recitationPrompt.kind === 'reviewed' ? 'Your teacher has left feedback' : 'A reading is ready to record'}
                  </span>
                  <span className="block text-sm text-[var(--mq-ink-soft)] mt-0.5">
                    {recitationPrompt.kind === 'reviewed' ? 'See your grade and listen to their voice note.' : 'Record your recitation and send it to your teacher.'}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--mq-ink-faint)] flex-shrink-0" />
              </button>
            )}

            {enrollments.length === 0 ? (
              /* Enrol prompt when no programs yet — a blank sheet awaiting the first stroke */
              <Sheet className="mb-6 text-center py-12">
                <div className="mx-auto mb-4 h-16 w-16 rounded-[6px] bg-[var(--mq-paper-sunk)] border border-[var(--mq-rule)] flex items-center justify-center">
                  <span className="font-['Amiri',serif] text-3xl text-[var(--mq-rule-strong)] leading-none pb-1">ا</span>
                </div>
                <h2 className="font-sans font-semibold text-[var(--mq-ink)] text-lg">No active programs yet</h2>
                <p className="mt-1.5 text-sm text-[var(--mq-ink-soft)] max-w-sm mx-auto">
                  Once you're enrolled, your classes, lessons, and progress take their place on the sheet.
                </p>
                <Link
                  to={`/enroll-additional${student?.email ? `?email=${encodeURIComponent(student.email)}` : ''}`}
                  className={`${M.BTN_PRIMARY} mt-5`}
                >
                  Browse programs
                </Link>
              </Sheet>
            ) : (
              /* Your programs — mastery drilled stroke by stroke */
              <Sheet className="mb-6">
                <div className="flex items-baseline justify-between mb-5">
                  <SpecLabel>Mastery · by program</SpecLabel>
                  <SpecLabel>classes attended</SpecLabel>
                </div>
                <div className="space-y-6">
                  {enrollments.filter(e => e.status === 'active').map(e => {
                    const p = classProgressByProgram[e.program];
                    if (!p) return null;
                    const filled = p.total ? Math.round((p.pct / 100) * 28) : 0;
                    return (
                      <div key={e.id}>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-sm font-semibold text-[var(--mq-ink)]">
                            {getConfigProgramName(e.program)}
                          </span>
                          <span className="font-['JetBrains_Mono',monospace] text-xs tabular-nums text-[var(--mq-ink-faint)]">
                            {p.completed}/{p.total} · {p.pct}%
                          </span>
                        </div>
                        {/* drilled strokes — the mashq repetition, filling with mastery */}
                        <div className="mashq-strokes h-5" aria-hidden="true">
                          {Array.from({ length: 28 }).map((_, i) => (
                            <span
                              key={i}
                              className={`mashq-stroke ${i < filled ? 'is-done' : ''}`}
                              style={{ height: 20 * (0.5 + ((i * 29) % 50) / 100), width: 4 }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Sheet>
            )}

            {/* Certificates — shown only once earned; sealed leaves of the sheet */}
            {certificates.length > 0 && (
              <Sheet className="mb-6">
                <div className="flex items-baseline justify-between mb-4">
                  <SpecLabel>Certificates earned</SpecLabel>
                  <button onClick={() => { setActiveTab('progress'); setProgressView('results'); }} className="font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.1em] text-[var(--mq-accent)] hover:text-[var(--mq-accent-deep)] mashq-focus">
                    View all →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {certificates.map(c => (
                    <div key={c.id} className="flex items-center gap-3 rounded-[4px] border border-[var(--mq-accent)]/25 bg-[var(--mq-accent)]/[0.04] px-4 py-3">
                      <span className="flex-shrink-0 h-9 w-9 rounded-full bg-[var(--mq-accent)]/10 flex items-center justify-center">
                        <GraduationCap className="h-4.5 w-4.5 text-[var(--mq-accent)]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--mq-ink)] truncate">
                          {getConfigProgramName(c.program_id) || c.program_id}
                        </p>
                        <p className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--mq-ink-faint)]">
                          {c.weighted_total != null ? `${Number(c.weighted_total).toFixed(1)}% · ` : ''}{c.verification_code}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Sheet>
            )}

            {/* Class etiquette block (collapsible) */}
            <div className="mb-6">
              <StudentClassEtiquette />
            </div>

            {/* Install app — a marginal note on the sheet */}
            <Sheet>
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <h2 className="font-sans font-semibold text-[var(--mq-ink)]">Get the mobile app</h2>
                  <p className="text-sm text-[var(--mq-ink-soft)] mt-0.5">Runs like a native app — add it to your home screen in seconds.</p>
                </div>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-[4px] border border-[var(--mq-rule)] bg-[var(--mq-paper-sunk)] px-3.5 py-3">
                  <dt className={M.SPEC_LABEL}>iPhone</dt>
                  <dd className="text-[var(--mq-ink)] mt-1.5">Safari → <span className="text-[var(--mq-ink-soft)]">Share</span> → <strong className="font-semibold">Add to Home Screen</strong></dd>
                </div>
                <div className="rounded-[4px] border border-[var(--mq-rule)] bg-[var(--mq-paper-sunk)] px-3.5 py-3">
                  <dt className={M.SPEC_LABEL}>Android</dt>
                  <dd className="text-[var(--mq-ink)] mt-1.5">Chrome → <span className="text-[var(--mq-ink-soft)]">⋮ menu</span> → <strong className="font-semibold">Install app</strong></dd>
                </div>
              </dl>
            </Sheet>
          </div>

          {/* === CLASSES TAB === */}
          <div className={activeTab !== 'classes' ? 'hidden' : ''}>
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <SpecLabel>Timetable</SpecLabel>
                <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-[var(--mq-ink)] tracking-[-0.01em]">Your classes</h1>
              </div>
              {!isEnrolledInAllPrograms() && student?.email && (
                <Link
                  to={`/enroll-additional?email=${encodeURIComponent(student.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--mq-accent)] hover:text-[var(--mq-accent-deep)] transition-colors mashq-focus"
                >
                  + Add another program
                </Link>
              )}
            </div>

            <div className="space-y-5">
            {enrollments.length === 0 && (
              <EmptyState
                icon={Calendar}
                title="No classes yet"
                description="Your class schedule will appear here once you're enrolled in a program."
              />
            )}
            {enrollments.filter(e => enrollments.length === 1 || e.program === activeProgram).map((enrollment) => {
              const programSchedules = schedules.filter(s => s.program === enrollment.program);
              const programName = getProgramName(enrollment.program);
              const isTajweed = enrollment.program === PROGRAM_IDS.TAJWEED;
              const programConfig = PROGRAMS[enrollment.program];

              // Inactive enrolment — disabled card
              if (enrollment.status !== 'active') {
                return (
                  <div key={enrollment.id} className={`${CARD_DARK} overflow-hidden`}>
                    <div className={CARD_HEADER_DARK}>
                      <h2 className="text-base font-semibold text-[var(--mq-ink)]">{programName}</h2>
                      <p className="text-sm text-red-700 mt-0.5">
                        Enrollment {enrollment.status}
                      </p>
                    </div>
                    <div className="px-5 py-5 text-sm text-[var(--mq-ink-soft)]">
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
                  <div key={enrollment.id} className={`${CARD_DARK} overflow-hidden`}>
                    <div className={CARD_HEADER_DARK}>
                      <h2 className="text-base font-semibold text-[var(--mq-ink)]">{programName}</h2>
                    </div>
                    <EmptyState
                      icon={Calendar}
                      title="Schedule coming soon"
                      description="Your class schedule will appear here once it's been created."
                    />
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
                <div key={enrollment.id} className={`${CARD_DARK} overflow-hidden`}>
                  {/* Card header */}
                  <div className="px-5 py-4 border-b border-[var(--mq-rule-soft)] flex items-baseline justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-[var(--mq-ink)]">{programName}</h2>
                      <p className="text-xs text-[var(--mq-ink-faint)] mt-0.5">
                        Week {currentWeekNumber} of {totalWeeks} · {progressPercent}% complete
                      </p>
                    </div>
                  </div>

                  {/* Milestone */}
                  <div className="px-5 py-5">
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-sm font-semibold text-[var(--mq-ink)]">
                          {currentMilestone.name}
                        </h3>
                        <span className="text-xs text-[var(--mq-ink-faint)]">
                          Milestone {currentMilestone.id} of {totalMilestones}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--mq-ink-faint)] mt-0.5">
                        {currentMilestone.subtitle}
                      </p>
                    </div>

                    {/* Milestone timeline */}
                    <div className="relative mb-2">
                      <div className="absolute top-3 left-0 right-0 h-0.5 bg-[var(--mq-rule-soft)]" />
                      <div
                        className="absolute top-3 left-0 h-0.5 bg-[var(--mq-accent)] transition-all"
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
                                  isCurrent
                                    ? 'bg-[var(--mq-now)] text-[#231a02]'
                                    : isCompleted
                                    ? 'bg-[var(--mq-accent)] text-[var(--mq-on-accent)]'
                                    : 'bg-[var(--mq-paper-raised)] border border-[var(--mq-rule-strong)] text-[var(--mq-ink-ghost)]'
                                }`}
                                title={milestone.subtitle}
                              >
                                {isCompleted ? '✓' : milestone.id}
                              </div>
                              <span className={`mt-2 text-[10px] font-medium text-center max-w-[60px] leading-tight hidden sm:block ${
                                isCurrent ? 'text-[var(--mq-now)]' : isCompleted ? 'text-[var(--mq-ink-soft)]' : 'text-[var(--mq-ink-dim)]'
                              }`}>
                                {milestone.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-xs text-[var(--mq-ink-faint)] mt-3 sm:mt-4">
                      {currentMilestone.weeksCompleted} of {currentMilestone.weeksInMilestone} weeks · {currentMilestone.milestoneProgress}% through this milestone
                    </p>
                  </div>

                  {/* This week's classes */}
                  <div className="px-5 py-4 border-t border-[var(--mq-rule-soft)]">
                    <h3 className="text-xs font-medium text-[var(--mq-ink-faint)] uppercase tracking-wide mb-3">This week</h3>
                    {currentWeekClasses.length === 0 ? (
                      <p className="text-sm text-[var(--mq-ink-faint)] py-2">No classes scheduled this week.</p>
                    ) : (
                      <div className="divide-y divide-[var(--mq-rule-soft)]">
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
                                  <p className="text-sm font-medium text-[var(--mq-ink)]">
                                    {isMain ? 'Main class' : 'Short class'}
                                    <span className="text-[var(--mq-ink-dim)] font-normal"> · {duration}</span>
                                  </p>
                                  {(dateLabel || timeLabel) && (
                                    <p className="text-sm text-[var(--mq-ink-soft)] mt-0.5">
                                      {dateLabel}{dateLabel && timeLabel ? ' · ' : ''}{timeLabel}
                                    </p>
                                  )}
                                </div>
                                <span className={`text-xs font-medium ${completed ? 'text-[var(--mq-accent)]' : 'text-[var(--mq-ink-faint)]'}`}>
                                  {completed ? 'Completed' : 'Scheduled'}
                                </span>
                              </div>
                              {cls.meeting_link && cls.status === 'scheduled' && (
                                <a
                                  href={cls.meeting_link.startsWith('http') ? cls.meeting_link : `https://${cls.meeting_link}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${M.BTN_PRIMARY} mt-2`}
                                >
                                  <Video className="h-4 w-4" />
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
                  <div className="px-5 py-4 border-t border-[var(--mq-rule-soft)] bg-[var(--mq-paper-sunk)]">
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-xs font-medium text-[var(--mq-ink-faint)] uppercase tracking-wide">Overall progress</h3>
                      <span className="text-lg font-semibold tabular-nums text-[var(--mq-ink)]">{completionPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--mq-rule-soft)] rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[var(--mq-accent)] rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
                    </div>
                    <p className="text-xs text-[var(--mq-ink-faint)]">
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
            {/* Tab heading + sub-tabs hide in immersive reader mode too */}
            <div className={immersive ? 'hidden' : 'mb-5'}>
              <h1 className="text-xl sm:text-2xl font-semibold text-[var(--mq-ink)]">Lessons & practice</h1>
              <p className="text-sm text-[var(--mq-ink-faint)] mt-1">
                Review your chapter notes and practise reading aloud.
              </p>
            </div>

            {/* Sub-tabs */}
            <div className={`${immersive ? 'hidden' : 'flex'} gap-6 mb-6 border-b border-[var(--mq-rule)]`} role="tablist" aria-label="Lessons view">
              {[
                { id: 'lessons', label: 'Lessons' },
                { id: 'reading', label: 'Reading Practice' },
              ].map(sub => {
                const on = lessonsSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setLessonsSubTab(sub.id)}
                    className={`pb-2.5 pt-1 border-b-2 font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.14em] transition-colors mashq-focus ${
                      on ? 'border-[var(--mq-accent)] text-[var(--mq-ink)] font-semibold' : 'border-transparent text-[var(--mq-ink-faint)] hover:text-[var(--mq-ink)]'
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>

            {lessonsSubTab === 'lessons' && (
              <StudentLessons
                enrollments={enrollments}
                autoResume
                resumeSignal={resumeSignal}
                onReaderChange={setReaderOpen}
                classProgressByProgram={classProgressByProgram}
                onOpenResults={() => { setActiveTab('progress'); setProgressView('results'); }}
                currentWeekByProgram={Object.fromEntries(
                  enrollments.filter(e => e.status === 'active').map(e => {
                    const w = getActiveWeekForEnrollment(e);
                    // Overall week across years (EASI milestones span weeks 1–104)
                    return [e.program, (w.year - 1) * w.weeksPerYear + w.week];
                  })
                )}
              />
            )}

            {lessonsSubTab === 'reading' && (
              <div className="space-y-5">
                {enrollments.filter(e => e.status === 'active' && (enrollments.filter(a => a.status === 'active').length === 1 || e.program === activeProgram)).map(enrollment => (
                  student?.id && (
                    <div key={enrollment.id}>
                      {enrollments.filter(e => e.status === 'active').length > 1 && (
                        <h2 className="text-sm font-semibold text-[var(--mq-ink)] mb-3">{getProgramName(enrollment.program)}</h2>
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

          {/* === PROGRESS TAB (Results + Rankings) === */}
          <div className={activeTab !== 'progress' ? 'hidden' : ''}>
            <div className="mb-5">
              <SpecLabel>How you're doing</SpecLabel>
              <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-[var(--mq-ink)] tracking-[-0.01em]">Progress</h1>
              <p className="text-sm text-[var(--mq-ink-faint)] mt-1">
                {progressView === 'results'
                  ? "Test progress and certificates for each program you're enrolled in."
                  : 'Top scores per chapter drill, by program. Last attempt counts.'}
              </p>
            </div>

            {/* Sub-view toggle — a ruled specimen segment, not a pill */}
            <div className="mb-6 inline-flex items-stretch rounded-[3px] border border-[var(--mq-rule-strong)] overflow-hidden" role="tablist" aria-label="Progress view">
              {[['results', 'Results'], ['rankings', 'Rankings']].map(([id, label], i) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={progressView === id}
                  onClick={() => setProgressView(id)}
                  className={
                    `px-4 py-1.5 font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.12em] transition-colors mashq-focus ` +
                    (i === 1 ? 'border-l border-[var(--mq-rule-strong)] ' : '') +
                    (progressView === id
                      ? 'bg-[var(--mq-accent)] text-[var(--mq-on-accent)]'
                      : 'bg-transparent text-[var(--mq-ink-faint)] hover:bg-[var(--mq-paper-tint)] hover:text-[var(--mq-ink)]')
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {progressView === 'results' ? (
              <div className="space-y-5">
                {enrollments.filter(e => e.status === 'active').length === 0 ? (
                  <p className="text-sm text-[var(--mq-ink-faint)]">No active enrolments.</p>
                ) : enrollments.filter(e => e.status === 'active' && (enrollments.filter(a => a.status === 'active').length === 1 || e.program === activeProgram)).map(enrollment => {
                  const activeWeek = getActiveWeekForEnrollment(enrollment);
                  return (
                    <div key={enrollment.id} className="space-y-4">
                      {enrollments.filter(e => e.status === 'active').length > 1 && (
                        <h2 className="text-sm font-semibold text-[var(--mq-ink)]">{getProgramName(enrollment.program)}</h2>
                      )}
                      <TestProgressCard programId={enrollment.program} currentWeek={(activeWeek.year - 1) * activeWeek.weeksPerYear + activeWeek.week} />
                      <StudentCertificateCard programId={enrollment.program} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <StudentQuizLeaderboards enrollments={enrollments} />
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar — the specimen index, ruled along the foot */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-[var(--mq-paper)]/95 backdrop-blur-sm border-t border-[var(--mq-rule)] z-40 ${immersive ? 'hidden' : 'sm:hidden'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex justify-around items-stretch px-1">
          {TABS.map((tab) => {
            const on = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={on ? 'page' : undefined}
                className={`relative ${on ? M.BOTTOM_ITEM_ACTIVE : M.BOTTOM_ITEM_INACTIVE}`}
              >
                {/* inked pen-stroke marking the active section, echoing the desktop index */}
                <span className={`pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-7 rounded-full bg-[var(--mq-accent)] transition-opacity ${on ? 'opacity-100' : 'opacity-0'}`} />
                <tab.icon className="h-[22px] w-[22px]" strokeWidth={on ? 2.1 : 1.65} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Email modal */}
      {showEmailModal && emailRecipient && (
        <div className={M.MODAL_SCRIM} onMouseDown={() => { setShowEmailModal(false); setEmailMessage(''); setEmailRecipient(null); }}>
          <div className={`${M.MODAL_PANEL} sm:max-w-2xl`} onMouseDown={(e) => e.stopPropagation()}>
            <div className={M.MODAL_HEADER}>
              <div className="min-w-0">
                <h2 className={M.HEADING}>Message your teacher</h2>
                <p className="text-sm text-[var(--mq-ink-faint)] truncate">To {emailRecipient.name}</p>
              </div>
              <button
                onClick={() => { setShowEmailModal(false); setEmailMessage(''); setEmailRecipient(null); }}
                className="text-[var(--mq-ink-faint)] hover:text-[var(--mq-ink)] p-1.5 -mr-1.5 rounded transition-colors mashq-focus"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className={M.LABEL}>Staff ID</dt>
                  <dd className="text-[var(--mq-ink)] mt-1">{emailRecipient.staffId}</dd>
                </div>
                <div>
                  <dt className={M.LABEL}>Program</dt>
                  <dd className="text-[var(--mq-ink)] mt-1">{PROGRAMS[emailRecipient.program]?.shortName || emailRecipient.program}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className={M.LABEL}>Email</dt>
                  <dd className="text-[var(--mq-ink)] mt-1 break-all">{emailRecipient.email}</dd>
                </div>
              </dl>

              <div>
                <label htmlFor="emailMessage" className={M.LABEL}>Message</label>
                <textarea
                  id="emailMessage"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={8}
                  placeholder="Type your message…"
                  className={M.TEXTAREA}
                />
                <p className="text-xs text-[var(--mq-ink-faint)] mt-2">
                  Your teacher receives this via email and can reply to your address directly.
                </p>
              </div>
            </div>

            <div className={M.MODAL_FOOTER}>
              <button
                onClick={() => { setShowEmailModal(false); setEmailMessage(''); setEmailRecipient(null); }}
                disabled={loading}
                className={M.BTN_SECONDARY}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={loading || !emailMessage.trim()}
                className={M.BTN_PRIMARY}
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
        <div className={M.MODAL_SCRIM} onMouseDown={() => setShowSettingsModal(false)}>
          <div className={M.MODAL_PANEL} onMouseDown={(e) => e.stopPropagation()}>
            <div className={M.MODAL_HEADER}>
              <h2 className={M.HEADING}>Profile settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-[var(--mq-ink-faint)] hover:text-[var(--mq-ink)] p-1.5 -mr-1.5 rounded transition-colors mashq-focus"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div>
                <label className={M.LABEL}>Full name</label>
                <input
                  type="text"
                  value={settingsFormData.full_name}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, full_name: e.target.value })}
                  placeholder="Your full name"
                  className={M.INPUT}
                />
              </div>

              <div>
                <label className={M.LABEL}>Phone number</label>
                <input
                  type="tel"
                  value={settingsFormData.phone}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, phone: e.target.value })}
                  placeholder="+64 21 123 4567"
                  className={M.INPUT}
                />
              </div>

              <div className="rounded-[4px] border border-[var(--mq-rule)] bg-[var(--mq-paper-sunk)] px-4 py-3 text-sm">
                <p className={`${M.LABEL} mb-1`}>Note</p>
                <p className="text-[var(--mq-ink-soft)]">
                  Your email and student ID can't be changed here. Contact admin to update them.
                </p>
              </div>

              {student?.stripe_customer_id && (
                <div className="rounded-[4px] border border-[var(--mq-rule)] bg-[var(--mq-paper-sunk)] px-4 py-3">
                  <p className={`${M.LABEL} mb-2`}>Billing</p>
                  <p className="text-sm text-[var(--mq-ink-soft)] mb-3">
                    Manage your subscription, invoices, and payment methods.
                  </p>
                  <button
                    onClick={handleBillingPortal}
                    disabled={processingPayment}
                    className={`${M.BTN_SECONDARY} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processingPayment ? 'Opening…' : 'Go to billing portal'}
                  </button>
                </div>
              )}
            </div>

            <div className={M.MODAL_FOOTER}>
              <button
                onClick={() => setShowSettingsModal(false)}
                disabled={settingsLoading}
                className={M.BTN_SECONDARY}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={settingsLoading}
                className={M.BTN_PRIMARY}
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
