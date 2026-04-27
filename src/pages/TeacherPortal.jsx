import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, LogOut, Users, UserX, Calendar, Eye, X, Mail, Send, Settings, Mic, Home } from 'lucide-react';
import { supabase, teachers, teacherAssignments, students, classSchedules } from '../services/supabase';
import { usePullToRefresh, PullIndicator } from '../hooks/usePullToRefresh.jsx';
import TeacherClassGuidelines from '../components/admin/TeacherClassGuidelines';
import StudentLessons from '../components/student/StudentLessons';
import { PROGRAMS } from '../config/programs';
import {
  PAGE, CARD, CARD_OVERFLOW, CARD_HEADER, CARD_BODY, CARD_FOOTER,
  BTN_PRIMARY, BTN_SECONDARY,
  INPUT, TEXTAREA,
  CONTAINER_WIDE,
  TAB_ACTIVE, TAB_INACTIVE,
  BOTTOM_TAB_ACTIVE, BOTTOM_TAB_INACTIVE,
  HEADING_LG, HEADING, LABEL, LABEL_TINY,
} from '../design/ui';

export default function TeacherPortal() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Data
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [removedStudents, setRemovedStudents] = useState([]);
  const [activeView, setActiveView] = useState('assigned'); // assigned or removed
  const [teacherTab, setTeacherTab] = useState(() => {
    // Restore last-visited tab so navigating away and back lands you in the
    // same place (e.g. clicking a student → coming back via the "My students"
    // breadcrumb should return to the Students tab, not Home).
    try {
      const saved = sessionStorage.getItem('teacherTab');
      if (saved && ['home', 'students', 'lessons', 'calendar'].includes(saved)) return saved;
    } catch { /* ignore */ }
    return 'home';
  });
  useEffect(() => {
    try { sessionStorage.setItem('teacherTab', teacherTab); } catch { /* ignore */ }
  }, [teacherTab]);

  // Pending recitation submissions (student_id → true)
  const [pendingRecitations, setPendingRecitations] = useState({});

  // Scoped action loading states (to avoid hijacking the global page spinner)
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

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

  // Session loading
  const [initialLoading, setInitialLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Pull-to-refresh: force-reload teacher data (silent=false shows the spinner)
  const { pullDistance, isPulling } = usePullToRefresh(() => {
    if (teacher?.id) {
      loadTeacherData(teacher.id);
      toast('Refreshed', { duration: 1500 });
    }
  });

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (mounted) setShouldRedirect(true);
          return;
        }

        const role = session.user.user_metadata?.role;
        if (role !== 'teacher') {
          // Double-check teachers table before redirecting
          const { data: byAuthId } = await teachers.getByAuthUserId(session.user.id);
          if (!byAuthId) {
            if (mounted) setShouldRedirect(true);
            return;
          }
        }

        // Look up teacher by auth_user_id, fall back to email
        let teacherRecord = null;
        const { data: byAuthId } = await teachers.getByAuthUserId(session.user.id);

        if (byAuthId) {
          teacherRecord = byAuthId;
        } else {
          console.warn('Teacher not found by auth_user_id, trying email lookup');
          const { data: byEmail } = await supabase
            .from('teachers')
            .select('*')
            .eq('email', session.user.email)
            .single();
          teacherRecord = byEmail;
        }

        if (!teacherRecord) {
          console.error('Teacher not found', { userId: session.user.id, email: session.user.email });
          toast.error('Teacher record not found');
          if (mounted) setShouldRedirect(true);
          return;
        }

        if (!teacherRecord.is_active) {
          toast.error('Your account is inactive. Please contact admin.');
          await supabase.auth.signOut({ scope: 'local' });
          if (mounted) setShouldRedirect(true);
          return;
        }

        if (mounted) {
          setTeacher(teacherRecord);
          // If we have cached assigned-students from a previous mount,
          // paint instantly and refresh in the background. This avoids
          // re-showing the loading spinner every time the teacher
          // navigates away from /teacher (e.g. into a student detail page)
          // and back, especially noticeable on slow networks.
          const hadCache = hydrateFromCache(teacherRecord.id);
          await loadTeacherData(teacherRecord.id, { silent: hadCache });
        }
      } catch (error) {
        console.error('Session restore error:', error);
        if (mounted) setShouldRedirect(true);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };

    restoreSession();

    // Listen for auth state changes (handles navigation from Login page only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (!mounted) return;
        if (event === 'SIGNED_OUT') {
          setShouldRedirect(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear cached teacher data so a different teacher signing in next
      // doesn't briefly see the previous account's students.
      try {
        if (teacher?.id) {
          sessionStorage.removeItem(`teacher.${teacher.id}.assigned`);
          sessionStorage.removeItem(`teacher.${teacher.id}.removed`);
          sessionStorage.removeItem(`teacher.${teacher.id}.pendingRecs`);
        }
        sessionStorage.removeItem('teacherTab');
      } catch { /* ignore */ }
      setTeacher(null);
      setAssignedStudents([]);
      setRemovedStudents([]);
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    }
  };

  // sessionStorage key prefix for caching teacher data
  const cacheKey = (teacherId, suffix) => `teacher.${teacherId}.${suffix}`;

  // Hydrate state from cache (instant paint on poor networks). Returns true
  // if any cached data was found, so the caller can suppress the loading
  // spinner and refresh in the background.
  const hydrateFromCache = (teacherId) => {
    let foundAny = false;
    try {
      const a = sessionStorage.getItem(cacheKey(teacherId, 'assigned'));
      if (a) { setAssignedStudents(JSON.parse(a)); foundAny = true; }
      const r = sessionStorage.getItem(cacheKey(teacherId, 'removed'));
      if (r) { setRemovedStudents(JSON.parse(r)); foundAny = true; }
      const p = sessionStorage.getItem(cacheKey(teacherId, 'pendingRecs'));
      if (p) { setPendingRecitations(JSON.parse(p)); foundAny = true; }
    } catch { /* ignore parse errors */ }
    return foundAny;
  };

  const loadTeacherData = async (teacherId, { silent = false } = {}) => {
    // If silent is true, don't show the full-screen spinner — keep cached
    // data on screen while we refresh in the background.
    let progressInterval;
    try {
      if (!silent) {
        setLoading(true);
        setLoadingProgress(0);
        progressInterval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 100) return 100;
            if (prev >= 90) return prev;
            return Math.min(prev + Math.random() * 15, 100);
          });
        }, 300);
      }

      // Load assigned students
      const { data: assigned, error: assignedError } = await teacherAssignments.getByTeacher(teacherId, 'assigned');
      if (assignedError) {
        console.error('Error loading assigned students:', assignedError);
      } else {
        const filtered = (assigned || []).filter(a => a.student);
        setAssignedStudents(filtered);
        try { sessionStorage.setItem(cacheKey(teacherId, 'assigned'), JSON.stringify(filtered)); } catch { /* quota */ }
      }

      // Load removed students
      const { data: removed, error: removedError } = await teacherAssignments.getByTeacher(teacherId, 'removed');
      if (removedError) {
        console.error('Error loading removed students:', removedError);
      } else {
        const filtered = (removed || []).filter(a => a.student);
        setRemovedStudents(filtered);
        try { sessionStorage.setItem(cacheKey(teacherId, 'removed'), JSON.stringify(filtered)); } catch { /* quota */ }
      }

      // Load pending recitation submissions for badge display
      const { data: pendingRecs } = await supabase
        .from('recitations')
        .select('student_id')
        .eq('teacher_id', teacherId)
        .eq('status', 'submitted');
      if (pendingRecs) {
        const map = {};
        pendingRecs.forEach(r => { map[r.student_id] = true; });
        setPendingRecitations(map);
        try { sessionStorage.setItem(cacheKey(teacherId, 'pendingRecs'), JSON.stringify(map)); } catch { /* quota */ }
      }
    } catch (err) {
      console.error('Error loading teacher data:', err);
      // Only nag the user when we don't have cached data to fall back on.
      if (!silent) toast.error('Failed to load student data');
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      if (!silent) {
        setLoadingProgress(100);
        setLoading(false);
      }
    }
  };

  // Realtime: update pending recitation badges when students submit
  useEffect(() => {
    if (!teacher?.id) return;
    const channel = supabase
      .channel(`rec-pending-${teacher.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'recitations',
        filter: `teacher_id=eq.${teacher.id}`,
      }, async () => {
        const { data: pendingRecs } = await supabase
          .from('recitations')
          .select('student_id')
          .eq('teacher_id', teacher.id)
          .eq('status', 'submitted');
        if (pendingRecs) {
          const map = {};
          pendingRecs.forEach(r => { map[r.student_id] = true; });
          setPendingRecitations(map);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [teacher?.id]);

  const handleViewStudent = (assignment) => {
    if (!assignment.student) return;
    navigate(`/teacher/students/${assignment.student.id}?program=${encodeURIComponent(assignment.program)}`);
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

    setSendingEmail(true);
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
      setSendingEmail(false);
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

    setUpdatingProfile(true);
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
      setUpdatingProfile(false);
    }
  };

  // Redirect to login if not authenticated
  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  // Loading spinner while checking session
  if (initialLoading || !teacher) {
    return (
      <div className={`${PAGE} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const displayedStudents = activeView === 'assigned' ? assignedStudents : removedStudents;

  const TABS = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'lessons', label: 'Lessons', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  return (
    <div className={PAGE}>
      <Helmet><title>Teacher Portal | The FastTrack Madrasah</title></Helmet>
      <PullIndicator pullDistance={pullDistance} isPulling={isPulling} />

      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className={`${CONTAINER_WIDE} h-14 sm:h-16 flex items-center justify-between gap-3`}>
          <Link to="/" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
            <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-xs sm:text-sm font-brand font-semibold text-slate-900">The FastTrack</span>
              <span className="text-xs sm:text-sm font-brand font-semibold text-slate-900" style={{ letterSpacing: '0.28em' }}>Madrasah</span>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 truncate max-w-[160px]">{teacher.full_name}</p>
              <p className="text-xs text-slate-500">Staff ID: {teacher.staff_id}</p>
            </div>
            <button
              onClick={handleOpenSettings}
              className="inline-flex items-center justify-center h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 hover:border-slate-400 transition-colors"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 hover:border-slate-400 transition-colors"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop tab bar */}
      <div className="hidden sm:block bg-white border-b border-slate-200">
        <div className={CONTAINER_WIDE}>
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTeacherTab(tab.id)}
                className={teacherTab === tab.id ? TAB_ACTIVE : TAB_INACTIVE}
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
        {/* === HOME TAB === */}
        <div className={teacherTab !== 'home' ? 'hidden' : ''}>
        {/* Welcome Message */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-lg sm:text-3xl font-bold text-gray-900 mb-0.5">Welcome, {teacher.full_name.split(' ')[0]}!</h1>
          <p className="text-xs sm:text-base text-gray-500">Manage students and track progress</p>
        </div>

        {/* Teaching Guidelines */}
        <div className="mb-5 sm:mb-8">
          <TeacherClassGuidelines />
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

        {/* Install App Guide */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <svg className="h-4 w-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
            <p className="text-sm font-semibold text-gray-900">Get the Mobile App</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">Runs like a native app on your phone — add it to your home screen in seconds.</p>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>iPhone:</strong> Safari → tap <svg className="inline h-5 w-5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share → <strong>Add to Home Screen</strong></p>
            <p><strong>Android:</strong> Chrome → tap <svg className="inline h-5 w-5 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg> → <strong>Install app</strong></p>
          </div>
        </div>
        </div>

        {/* === STUDENTS TAB === */}
        <div className={teacherTab !== 'students' ? 'hidden' : ''}>
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

        {/* Student List Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="relative w-24 h-24 inline-block">
              <svg className="w-24 h-24" viewBox="0 0 80 80">
                <circle
                  className="text-gray-200"
                  strokeWidth="6"
                  stroke="currentColor"
                  fill="transparent"
                  r="34"
                  cx="40"
                  cy="40"
                />
                <circle
                  className="text-emerald-600"
                  strokeWidth="6"
                  strokeDasharray={213.628}
                  strokeDashoffset={213.628 - (213.628 * loadingProgress) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="34"
                  cx="40"
                  cy="40"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-700">
                  {Math.round(loadingProgress)}%
                </span>
              </div>
            </div>
            <p className="mt-4 text-gray-600">
              {loadingProgress < 30 && 'Connecting...'}
              {loadingProgress >= 30 && loadingProgress < 60 && 'Loading students...'}
              {loadingProgress >= 60 && loadingProgress < 90 && 'Processing...'}
              {loadingProgress >= 90 && 'Almost there...'}
            </p>
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
                    {pendingRecitations[assignment.student?.id] && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                        <Mic className="h-2.5 w-2.5" /> Review
                      </span>
                    )}
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

        {/* === LESSONS TAB === */}
        <div className={teacherTab !== 'lessons' ? 'hidden' : ''}>
          <div className="mb-5 sm:mb-8">
            <h1 className="text-lg sm:text-3xl font-bold text-gray-900 mb-0.5">Lessons</h1>
            <p className="text-xs sm:text-base text-gray-500">Review lesson content for the programs you teach</p>
          </div>
          <StudentLessons
            programs={[...new Set(assignedStudents.map(a => a.program).filter(Boolean))]}
          />
        </div>

        {/* === CALENDAR TAB === */}
        <div className={teacherTab !== 'calendar' ? 'hidden' : ''}>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <iframe
              src="https://calendar.google.com/calendar/embed?showTitle=0&showPrint=0&showTabs=0&showCalendars=0&showTz=0&mode=AGENDA&wkst=1&ctz=Pacific%2FAuckland&src=ZDQ2NjdiMDUxMWI1ZDZiNTIzZmE4OGE2Y2RmZjc4MmFhYTllMTQyODlkYzc2M2QyZWE1N2U5NTRlODI4NWYwN0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=ZW4ubmV3X3plYWxhbmQjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&color=%23f4511e&color=%230b8043"
              className="w-full border-0 h-[calc(100vh-13rem)] sm:h-[600px]"
              title="School Calendar"
            />
          </div>
        </div>

      </div>

      {/* Mobile bottom tab bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex justify-around items-stretch px-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTeacherTab(tab.id)}
              className={teacherTab === tab.id ? BOTTOM_TAB_ACTIVE : BOTTOM_TAB_INACTIVE}
            >
              <tab.icon className="h-5 w-5" strokeWidth={teacherTab === tab.id ? 2.25 : 1.75} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Email modal */}
      {showEmailModal && emailRecipient && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl border border-slate-200 w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <h2 className={HEADING}>Send message</h2>
                <p className="text-sm text-slate-500 truncate">To {emailRecipient.name}</p>
              </div>
              <button
                onClick={() => { setShowEmailModal(false); setEmailMessage(''); setEmailRecipient(null); }}
                className="text-slate-400 hover:text-slate-700 p-1.5 -mr-1.5 rounded transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className={LABEL_TINY}>Student ID</dt>
                  <dd className="text-slate-900 mt-1">{emailRecipient.studentId}</dd>
                </div>
                <div>
                  <dt className={LABEL_TINY}>Program</dt>
                  <dd className="text-slate-900 mt-1">{PROGRAMS[emailRecipient.program]?.shortName || emailRecipient.program}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className={LABEL_TINY}>Email</dt>
                  <dd className="text-slate-900 mt-1 break-all">{emailRecipient.email}</dd>
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
                <p className="text-xs text-slate-500 mt-2">
                  The student receives this via email and can reply to your address directly.
                </p>
              </div>
            </div>

            <div className={`${CARD_FOOTER} flex justify-end gap-2`}>
              <button
                onClick={() => { setShowEmailModal(false); setEmailMessage(''); setEmailRecipient(null); }}
                disabled={sendingEmail}
                className={BTN_SECONDARY}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailMessage.trim()}
                className={BTN_PRIMARY}
              >
                {sendingEmail ? 'Sending…' : (
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
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl border border-slate-200 w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-baseline justify-between gap-3">
              <h2 className={HEADING}>Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 -mr-1.5 rounded transition-colors"
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
                  placeholder="Your phone number"
                  className={INPUT}
                />
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className={`${LABEL_TINY} mb-2`}>Read-only</p>
                <dl className="space-y-1 text-slate-700">
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Email</dt><dd className="text-slate-900 truncate">{teacher.email}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Staff ID</dt><dd className="text-slate-900">{teacher.staff_id}</dd></div>
                </dl>
              </div>
            </div>

            <div className={`${CARD_FOOTER} flex justify-end gap-2`}>
              <button
                onClick={() => setShowSettingsModal(false)}
                disabled={updatingProfile}
                className={BTN_SECONDARY}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={updatingProfile}
                className={BTN_PRIMARY}
              >
                {updatingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
