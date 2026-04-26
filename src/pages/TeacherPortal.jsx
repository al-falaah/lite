import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, LogOut, Users, UserX, Calendar, BarChart3, Eye, X, CheckCircle, Mail, Send, XCircle, Settings, Mic, Home } from 'lucide-react';
import { supabase, teachers, teacherAssignments, students, classSchedules } from '../services/supabase';
import { usePullToRefresh, PullIndicator } from '../hooks/usePullToRefresh.jsx';
import Button from '../components/common/Button';
import TeacherClassGuidelines from '../components/admin/TeacherClassGuidelines';
import OralTestGrading from '../components/admin/OralTestGrading';
import RecitationAssignments from '../components/admin/RecitationAssignments';
import StudentLessons from '../components/student/StudentLessons';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

export default function TeacherPortal() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Data
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [removedStudents, setRemovedStudents] = useState([]);
  const [activeView, setActiveView] = useState('assigned'); // assigned or removed
  const [teacherTab, setTeacherTab] = useState('home'); // home, students, calendar

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

  // Pull-to-refresh: reload teacher data
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
          await loadTeacherData(teacherRecord.id);
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
      setTeacher(null);
      setAssignedStudents([]);
      setRemovedStudents([]);
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    }
  };

  const loadTeacherData = async (teacherId) => {
    let progressInterval;
    try {
      setLoading(true);
      setLoadingProgress(0);

      // Simulate progress
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) return 100;
          if (prev >= 90) return prev;
          return Math.min(prev + Math.random() * 15, 100);
        });
      }, 300);

      // Load assigned students
      const { data: assigned, error: assignedError } = await teacherAssignments.getByTeacher(teacherId, 'assigned');
      if (assignedError) {
        console.error('Error loading assigned students:', assignedError);
      } else {
        setAssignedStudents((assigned || []).filter(a => a.student));
      }

      // Load removed students
      const { data: removed, error: removedError } = await teacherAssignments.getByTeacher(teacherId, 'removed');
      if (removedError) {
        console.error('Error loading removed students:', removedError);
      } else {
        setRemovedStudents((removed || []).filter(a => a.student));
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
      }
    } catch (err) {
      console.error('Error loading teacher data:', err);
      toast.error('Failed to load student data');
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoading(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Dashboard Screen
  const displayedStudents = activeView === 'assigned' ? assignedStudents : removedStudents;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet><title>Teacher Portal | The FastTrack Madrasah</title></Helmet>
      <PullIndicator pullDistance={pullDistance} isPulling={isPulling} />
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
              <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-6 w-6 sm:h-8 sm:w-8" />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-xs sm:text-base font-brand font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-xs sm:text-base font-brand font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
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

      {/* Desktop Tab Bar */}
      <div className="hidden sm:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'lessons', label: 'Lessons', icon: BookOpen },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTeacherTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  teacherTab === tab.id
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center h-14 px-1">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'lessons', label: 'Lessons', icon: BookOpen },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTeacherTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-lg transition-colors ${
                teacherTab === tab.id
                  ? 'text-emerald-700'
                  : 'text-gray-400 active:bg-gray-100'
              }`}
            >
              <tab.icon className={`h-5 w-5 ${teacherTab === tab.id ? 'text-emerald-600' : ''}`} strokeWidth={teacherTab === tab.id ? 2.5 : 1.5} />
              <span className={`text-[10px] ${teacherTab === tab.id ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>


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
                  disabled={sendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !emailMessage.trim()}
                  className="inline-flex items-center"
                >
                  {sendingEmail ? (
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
                  disabled={updatingProfile}
                  className="w-full"
                >
                  {updatingProfile ? (
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
