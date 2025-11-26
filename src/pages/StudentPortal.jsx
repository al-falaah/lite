import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'react-toastify';
import {
  Calendar, Clock, Video, CheckCircle, BookOpen, BarChart3,
  ArrowLeft, User, Mail, LogOut, ExternalLink
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const StudentPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [student, setStudent] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [progress, setProgress] = useState(null);

  // Get the current active week and year
  const getCurrentActiveWeekAndYear = () => {
    if (schedules.length === 0) return { year: 1, week: 1 };

    const weekMap = {};

    schedules.forEach(schedule => {
      const key = `${schedule.academic_year}-${schedule.week_number}`;
      if (!weekMap[key]) {
        weekMap[key] = [];
      }
      weekMap[key].push(schedule);
    });

    // Check Year 1 first
    for (let weekNum = 1; weekNum <= 52; weekNum++) {
      const weekClasses = weekMap[`1-${weekNum}`];
      if (!weekClasses || weekClasses.length === 0) {
        return { year: 1, week: weekNum };
      }

      const allCompleted = weekClasses.every(c => c.status === 'completed');
      if (!allCompleted) {
        return { year: 1, week: weekNum };
      }
    }

    // Year 1 complete, check Year 2
    for (let weekNum = 1; weekNum <= 52; weekNum++) {
      const weekClasses = weekMap[`2-${weekNum}`];
      if (!weekClasses || weekClasses.length === 0) {
        return { year: 2, week: weekNum };
      }

      const allCompleted = weekClasses.every(c => c.status === 'completed');
      if (!allCompleted) {
        return { year: 2, week: weekNum };
      }
    }

    return { year: 2, week: 52 }; // All complete
  };

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
        .eq('status', 'enrolled')
        .single();

      if (error || !data) {
        toast.error('Student not found. Please check your email or contact support.');
        setLoading(false);
        return;
      }

      setStudent(data);
      setAuthenticated(true);
      toast.success(`Welcome, ${data.full_name}!`);

      // Load schedules and progress
      await loadStudentData(data.id);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login. Please try again.');
      setLoading(false);
    }
  };

  const loadStudentData = async (studentId) => {
    try {
      // Load schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('class_schedules')
        .select('*')
        .eq('student_id', studentId)
        .order('academic_year', { ascending: true })
        .order('week_number', { ascending: true });

      if (schedulesError) throw schedulesError;
      setSchedules(schedulesData || []);

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
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setStudent(null);
    setSchedules([]);
    setProgress(null);
    setEmail('');
    toast.info('Logged out successfully');
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
              <p className="text-gray-600">Access your class schedule and track your progress</p>
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
                {loading ? 'Accessing...' : 'Access My Schedule'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Need help? Contact us at{' '}
                <a href="mailto:info@alfalaah.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  info@alfalaah.com
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentActive = schedules.length > 0
    ? getCurrentActiveWeekAndYear()
    : { year: 1, week: 1 };

  const currentWeekClasses = schedules.filter(
    s => s.academic_year === currentActive.year && s.week_number === currentActive.week
  );

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
            <p className="text-gray-600 mt-1">Student ID: {student?.student_id}</p>
          </div>

          {/* Progress Overview */}
          {progress && (
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Progress</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Year 1 */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-blue-900">Year 1</span>
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-900 mb-2">
                    {progress.year1_completed}/{progress.year1_total}
                  </div>
                  <div className="text-sm text-blue-700 mb-3">{progress.year1_progress_pct}% Complete</div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress.year1_progress_pct}%` }}
                    />
                  </div>
                </div>

                {/* Year 2 */}
                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-purple-900">Year 2</span>
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-purple-900 mb-2">
                    {progress.year2_completed}/{progress.year2_total}
                  </div>
                  <div className="text-sm text-purple-700 mb-3">{progress.year2_progress_pct}% Complete</div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress.year2_progress_pct}%` }}
                    />
                  </div>
                </div>

                {/* Overall */}
                <div className="bg-emerald-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-emerald-900">Overall</span>
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-bold text-emerald-900 mb-2">
                    {progress.total_completed}/{progress.total_classes}
                  </div>
                  <div className="text-sm text-emerald-700 mb-3">{progress.overall_progress_pct}% Complete</div>
                  <div className="w-full bg-emerald-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress.overall_progress_pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Current Week Schedule */}
          {schedules.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No schedule available yet</p>
                <p className="text-sm">Your instructor will set up your schedule soon.</p>
              </div>
            </Card>
          ) : (
            <Card>
              {/* Current Week Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Week {currentActive.week} of 52
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentActive.year === 1 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Year 1
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Year 2
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {Math.round(((currentActive.year - 1) * 52 + currentActive.week - 1) / 104 * 100)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {(currentActive.year - 1) * 52 + currentActive.week - 1} of 104 weeks
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
                  {currentWeekClasses.find(c => c.class_type === 'main') && (
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <span className="text-lg font-semibold text-blue-900">
                            Main Class (2 hrs)
                          </span>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          currentWeekClasses.find(c => c.class_type === 'main').status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {currentWeekClasses.find(c => c.class_type === 'main').status}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="text-sm text-blue-800">
                          <span className="font-medium">Day:</span> {currentWeekClasses.find(c => c.class_type === 'main').day_of_week}
                        </div>
                        <div className="text-sm text-blue-800">
                          <span className="font-medium">Time:</span> {currentWeekClasses.find(c => c.class_type === 'main').class_time || 'Not set'}
                        </div>
                      </div>
                      {currentWeekClasses.find(c => c.class_type === 'main').meeting_link && (
                        <a
                          href={currentWeekClasses.find(c => c.class_type === 'main').meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-700 hover:text-blue-800 font-medium"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Join Meeting
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Short Class */}
                  {currentWeekClasses.find(c => c.class_type === 'short') && (
                    <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-purple-600" />
                          <span className="text-lg font-semibold text-purple-900">
                            Short Class (30 min)
                          </span>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          currentWeekClasses.find(c => c.class_type === 'short').status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {currentWeekClasses.find(c => c.class_type === 'short').status}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="text-sm text-purple-800">
                          <span className="font-medium">Day:</span> {currentWeekClasses.find(c => c.class_type === 'short').day_of_week}
                        </div>
                        <div className="text-sm text-purple-800">
                          <span className="font-medium">Time:</span> {currentWeekClasses.find(c => c.class_type === 'short').class_time || 'Not set'}
                        </div>
                      </div>
                      {currentWeekClasses.find(c => c.class_type === 'short').meeting_link && (
                        <a
                          href={currentWeekClasses.find(c => c.class_type === 'short').meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-purple-700 hover:text-purple-800 font-medium"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Join Meeting
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Week Completion Note */}
              {currentWeekClasses.every(c => c.status === 'completed') && currentWeekClasses.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Week {currentActive.week} Complete!</p>
                      <p className="text-sm text-green-700">
                        Great progress! Keep up the excellent work.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
