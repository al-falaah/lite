import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import { toast } from 'sonner';
import {
  Calendar, Clock, Video, CheckCircle, BookOpen, BarChart3,
  ArrowLeft, User, Mail, LogOut, ExternalLink, CreditCard,
  DollarSign, AlertCircle, GraduationCap
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const StudentPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      // Find student by email
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error || !data) {
        toast.error('Student not found. Please check your email or contact support.');
        setLoading(false);
        return;
      }

      setStudent(data);
      setAuthenticated(true);
      toast.success(`Welcome, ${data.full_name}!`);

      // Load enrollments and student data
      await loadStudentData(data.id);
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

  const handleLogout = () => {
    setAuthenticated(false);
    setStudent(null);
    setEnrollments([]);
    setSchedules([]);
    setProgress(null);
    setEmail('');
    toast.info('Logged out successfully');
  };

  const getProgramName = (program) => {
    return program === 'tajweed' ? 'Tajweed Program' : 'Essential Arabic & Islamic Studies Program';
  };

  const getProgramDuration = (program) => {
    return program === 'tajweed' ? '6 months' : '2 years';
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50/30 to-white">
        {/* Header */}
        <nav className="bg-white/98 backdrop-blur-lg shadow-sm border-b border-amber-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-amber-600 rounded-xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-emerald-600 to-amber-600 p-2 rounded-xl">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-600 bg-clip-text text-transparent">
                    Al-Falaah
                  </span>
                  <span className="text-xs text-gray-600 -mt-1 font-arabic">الفلاح - Success</span>
                </div>
              </Link>
              <Link to="/">
                <Button variant="outline" size="md">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Login Form */}
        <div className="max-w-md mx-auto px-4 py-16">
          <Card>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Portal</h1>
              <p className="text-gray-600">Access your enrollments and make payments</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Enter the email address you used during enrollment
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Accessing...' : 'Access My Portal'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Need help? Contact us at{' '}
                <a href="mailto:admin@alfalaah-academy.nz" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  admin@alfalaah-academy.nz
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-600 to-amber-600 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Al-Falaah</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span className="font-medium">{student?.full_name}</span>
                {student?.student_id && (
                  <span className="text-gray-500">• ID: {student.student_id}</span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
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
                  <Card key={enrollment.id} className="overflow-hidden">
                    {/* Enrollment Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${isTajweed ? 'bg-purple-100' : 'bg-blue-100'}`}>
                          <GraduationCap className={`h-6 w-6 ${isTajweed ? 'text-purple-600' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{programName}</h2>
                          <p className="text-sm text-gray-600 mt-1">
                            Duration: {programDuration} • Enrolled: {new Date(enrollment.enrolled_date).toLocaleDateString()}
                          </p>
                          <div className="mt-2">
                            {getStatusBadge(enrollment.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Fees</p>
                        <p className="text-2xl font-bold text-gray-900">${enrollment.total_fees?.toFixed(2)}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Paid</p>
                        <p className="text-2xl font-bold text-green-600">${enrollment.total_paid?.toFixed(2)}</p>
                      </div>
                      <div className={`p-4 rounded-lg ${hasPendingPayment ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                        <p className="text-sm text-gray-600 mb-1">Balance</p>
                        <p className={`text-2xl font-bold ${hasPendingPayment ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ${enrollment.balance_remaining?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Billing Portal Link */}
                    {student?.stripe_customer_id && (
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Manage Billing</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Update payment methods, view invoices, and manage your subscription
                            </p>
                          </div>
                          <Button
                            onClick={handleBillingPortal}
                            variant="outline"
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
                <Card key={enrollment.id} className="border-l-4" style={{ borderLeftColor: isTajweed ? '#9333ea' : '#059669' }}>
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">{programName} - Schedule Coming Soon</p>
                    <p className="text-sm">Your class schedule will appear here once it's been created by the admin.</p>
                  </div>
                </Card>
              );
            }

            // Get current week's classes for this program
            const currentWeekClasses = programSchedules.filter(
              s => s.status !== 'completed' && s.week_number === 1 // TODO: Use actual current week
            );

            return (
              <Card key={enrollment.id} className="border-l-4" style={{ borderLeftColor: isTajweed ? '#9333ea' : '#059669' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{programName}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Your weekly class schedule • {programSchedules.length} classes total
                    </p>
                  </div>
                </div>

                {/* Current Week's Schedule */}
                <div className="space-y-3">
                  {currentWeekClasses.length > 0 ? (
                    currentWeekClasses.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center gap-4 p-4 rounded-lg border"
                        style={{
                          backgroundColor: isTajweed ? '#faf5ff' : '#ecfdf5',
                          borderColor: isTajweed ? '#e9d5ff' : '#a7f3d0'
                        }}
                      >
                        <div className="flex-shrink-0">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: isTajweed ? '#9333ea' : '#059669' }}
                          >
                            <Calendar className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">{getDayName(schedule.day_of_week)}</h3>
                            <span
                              className="px-2 py-0.5 text-xs rounded-full font-medium"
                              style={{
                                backgroundColor: isTajweed ? '#e9d5ff' : '#a7f3d0',
                                color: isTajweed ? '#6b21a8' : '#065f46'
                              }}
                            >
                              Week {schedule.week_number}
                            </span>
                            <span
                              className="px-2 py-0.5 text-xs rounded-full font-medium"
                              style={{
                                backgroundColor: '#dbeafe',
                                color: '#1e40af'
                              }}
                            >
                              Year {schedule.academic_year}
                            </span>
                            <span
                              className="px-2 py-0.5 text-xs rounded-full font-medium"
                              style={{
                                backgroundColor: '#fef3c7',
                                color: '#92400e'
                              }}
                            >
                              {schedule.class_type === 'main' ? '2 hours' : '30 min'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatScheduleTime(schedule.class_time)}</span>
                            </div>
                            {schedule.meeting_link && (
                              <a
                                href={schedule.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <Video className="h-4 w-4" />
                                Join Class
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        {schedule.status === 'completed' && (
                          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
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
                <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                    <p className="text-2xl font-bold text-gray-900">{programSchedules.length}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {programSchedules.filter(s => s.status === 'completed').length}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Upcoming</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {programSchedules.filter(s => s.status === 'scheduled').length}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Apply for Another Program */}
          {!isEnrolledInAllPrograms() && (
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
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
                    <Button variant="primary" className="bg-purple-600 hover:bg-purple-700">
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
    </div>
  );
};

export default StudentPortal;
