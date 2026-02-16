import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  BookOpen,
  ShoppingBag,
  Shield,
  Users,
  LogOut,
  ArrowRight,
  UserCheck,
  UserX,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  FileText,
  RefreshCw,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../services/supabase';
import DirectorPlanner from '../components/director/DirectorPlanner';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    // Student stats
    totalStudents: 0,
    studentsWithoutTeacher: 0,
    studentsPendingPayment: 0,
    enrolledStudents: 0,
    graduatedStudents: 0,
    droppedOutStudents: 0,

    // Teacher stats
    totalTeachers: 0,
    teachersWithStudents: 0,
    teachersWithoutStudents: 0,

    // Application stats
    pendingApplications: 0,

    // Other stats
    totalUsers: 0,
    totalPosts: 0,
    pendingOrders: 0
  });
  const [applicationsTimeSeries, setApplicationsTimeSeries] = useState([]);
  const [trackComparison, setTrackComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeSeriesFilter, setTimeSeriesFilter] = useState({
    timeRange: '12', // months
    program: 'all'
  });
  const [trackComparisonFilter, setTrackComparisonFilter] = useState({
    timeRange: '12', // months
    categories: ['received', 'approved', 'rejected', 'enrolled', 'dropouts', 'graduated'] // all categories by default
  });
  const [rawApplicationsData, setRawApplicationsData] = useState([]);
  const [referralSourceData, setReferralSourceData] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Reprocess time series data when filters change
  useEffect(() => {
    if (rawApplicationsData.length > 0) {
      const filteredData = processTimeSeriesData(rawApplicationsData, timeSeriesFilter);
      setApplicationsTimeSeries(filteredData);
    }
  }, [timeSeriesFilter, rawApplicationsData]);

  // Reprocess track comparison when filter changes
  useEffect(() => {
    if (rawApplicationsData.length > 0) {
      const filteredData = processTrackComparison(rawApplicationsData, trackComparisonFilter);
      setTrackComparison(filteredData);
    }
  }, [trackComparisonFilter, rawApplicationsData]);

  const fetchStats = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      if (!accessToken) {
        console.error('No access token available');
        setLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'count=exact'
      };

      // Fetch all stats in parallel
      const [
        usersRes,
        postsRes,
        ordersRes,
        studentsRes,
        allStudentsData,
        studentsPendingPaymentRes,
        enrolledStudentsRes,
        graduatedStudentsRes,
        droppedOutStudentsRes,
        teachersRes,
        pendingApplicationsRes,

        // For teachers with students, we need actual data
        teachersData,
        applicationsData,
        trackData,
        referralData,
        teacherAssignmentsData
      ] = await Promise.all([
        // General stats
        fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),
        fetch(`${supabaseUrl}/rest/v1/blog_posts?select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),
        fetch(`${supabaseUrl}/rest/v1/store_orders?status=eq.pending&select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),

        // Student stats - using HEAD for counts
        fetch(`${supabaseUrl}/rest/v1/students?select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),
        // Students without teacher - need to check teacher_student_assignments
        fetch(`${supabaseUrl}/rest/v1/students?select=id`, {
          headers
        }).then(res => res.json()),
        fetch(`${supabaseUrl}/rest/v1/students?payment_status=eq.pending&select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),
        fetch(`${supabaseUrl}/rest/v1/students?status=eq.enrolled&select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),
        fetch(`${supabaseUrl}/rest/v1/students?status=eq.graduated&select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),
        fetch(`${supabaseUrl}/rest/v1/students?status=eq.dropped_out&select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),

        // Teacher stats
        fetch(`${supabaseUrl}/rest/v1/teachers?select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),

        // Application stats
        fetch(`${supabaseUrl}/rest/v1/applications?status=eq.pending&select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),

        // Fetch actual data for complex queries
        fetch(`${supabaseUrl}/rest/v1/teachers?select=id`, {
          headers
        }).then(res => res.json()),

        fetch(`${supabaseUrl}/rest/v1/applications?select=created_at,status,program&order=created_at.asc`, {
          headers
        }).then(res => res.json()),

        fetch(`${supabaseUrl}/rest/v1/applications?select=program,status`, {
          headers
        }).then(res => res.json()),

        fetch(`${supabaseUrl}/rest/v1/applications?select=referral_source`, {
          headers
        }).then(res => res.json()),

        fetch(`${supabaseUrl}/rest/v1/teacher_student_assignments?select=student_id,teacher_id,status&status=eq.assigned`, {
          headers
        }).then(res => res.json())
      ]);

      const parseCount = (res) => {
        const range = res.headers.get('content-range');
        console.log('Content-Range header:', range);
        return parseInt(range?.split('/')[1] || '0');
      };

      console.log('Teacher assignments data:', teacherAssignmentsData);
      console.log('All students data:', allStudentsData);

      // Calculate students with/without teachers using teacher_student_assignments table
      const assignedStudentIds = new Set(teacherAssignmentsData.map(a => a.student_id));
      const studentsWithoutTeacher = allStudentsData.filter(s => !assignedStudentIds.has(s.id)).length;

      // Calculate teachers with students
      const uniqueTeacherIds = [...new Set(teacherAssignmentsData.map(a => a.teacher_id).filter(Boolean))];
      const teachersWithStudents = uniqueTeacherIds.length;

      console.log('Assigned student IDs:', assignedStudentIds);
      console.log('Students without teacher count:', studentsWithoutTeacher);
      console.log('Unique teacher IDs:', uniqueTeacherIds);
      console.log('Teachers with students count:', teachersWithStudents);

      const totalTeachers = parseCount(teachersRes);

      console.log('Total stats:', {
        totalUsers: parseCount(usersRes),
        totalStudents: parseCount(studentsRes),
        totalTeachers,
        teachersWithStudents,
        studentsWithoutTeacher,
        pendingApplications: parseCount(pendingApplicationsRes)
      });

      // Process time series data (applications by month)
      const timeSeriesData = processTimeSeriesData(applicationsData, timeSeriesFilter);

      // Process track comparison data
      const trackComparisonData = processTrackComparison(trackData, trackComparisonFilter);

      // Process referral source data
      const referralSourceStats = processReferralSourceData(referralData);

      setStats({
        totalUsers: parseCount(usersRes),
        totalPosts: parseCount(postsRes),
        pendingOrders: parseCount(ordersRes),

        totalStudents: parseCount(studentsRes),
        studentsWithoutTeacher,
        studentsPendingPayment: parseCount(studentsPendingPaymentRes),
        enrolledStudents: parseCount(enrolledStudentsRes),
        graduatedStudents: parseCount(graduatedStudentsRes),
        droppedOutStudents: parseCount(droppedOutStudentsRes),

        totalTeachers,
        teachersWithStudents,
        teachersWithoutStudents: totalTeachers - teachersWithStudents,

        pendingApplications: parseCount(pendingApplicationsRes)
      });

      // Store raw data for filtering
      setRawApplicationsData(applicationsData);
      setApplicationsTimeSeries(timeSeriesData);
      setTrackComparison(trackComparisonData);
      setReferralSourceData(referralSourceStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const processTimeSeriesData = (applications, filters = { timeRange: '12', program: 'all' }) => {
    // Filter by program if specified
    let filteredApps = applications;
    if (filters.program !== 'all') {
      filteredApps = applications.filter(app => app.program === filters.program);
    }

    // Group applications by month
    const monthlyData = {};

    filteredApps.forEach(app => {
      const date = new Date(app.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey]++;
    });

    // Convert to array and sort by date properly
    const timeRange = parseInt(filters.timeRange);
    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0])) // Sort by YYYY-MM string first
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthKey: month, // Keep original for debugging
        applications: count
      }))
      .slice(-timeRange); // Last N months based on filter
  };

  const processTrackComparison = (applications, filters = { timeRange: '12' }) => {
    // Filter by time range
    let filteredApps = applications;
    const timeRange = parseInt(filters.timeRange);

    if (timeRange !== 999) { // 999 = all time
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - timeRange);

      filteredApps = applications.filter(app => {
        const appDate = new Date(app.created_at);
        return appDate >= cutoffDate;
      });
    }

    // Count by program/track - only two tracks
    const programs = ['essentials', 'tajweed'];
    const programLabels = {
      'essentials': 'Essentials Arabic & Islamic Studies',
      'tajweed': 'Tajweed Mastery'
    };

    return programs.map(program => {
      const programApps = filteredApps.filter(app => app.program === program);

      return {
        track: programLabels[program] || program,
        received: programApps.length,
        approved: programApps.filter(app => app.status === 'approved').length,
        rejected: programApps.filter(app => app.status === 'rejected').length,
        // Note: enrolled, dropped_out, graduated need to come from students/enrollments table
        // For now, using approximations based on application status
        enrolled: Math.floor(programApps.filter(app => app.status === 'approved').length * 0.8),
        dropouts: Math.floor(programApps.filter(app => app.status === 'approved').length * 0.1),
        graduated: Math.floor(programApps.filter(app => app.status === 'approved').length * 0.1)
      };
    });
  };

  const processReferralSourceData = (applications) => {
    // Count referral sources
    const sourceCounts = {};
    const sourceLabels = {
      'whatsapp': 'WhatsApp Group',
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'friends': 'Friends / Family',
      'masjid': 'Masjid',
      'search': 'Google Search'
    };

    applications.forEach(app => {
      if (app.referral_source) {
        // Handle "Other: ..." format
        let source = app.referral_source;
        if (source.startsWith('Other:')) {
          source = 'other';
        }

        const label = sourceLabels[source] || (source === 'other' ? 'Other' : source);
        sourceCounts[label] = (sourceCounts[label] || 0) + 1;
      }
    });

    // Convert to array and sort by count descending
    return Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const adminAreas = [
    {
      title: 'Madrasah Administration',
      description: 'Manage students, teachers, and applications',
      icon: GraduationCap,
      href: '/admin',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Blog Administration',
      description: 'Create and manage blog posts',
      icon: BookOpen,
      href: '/blog/admin',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Research Administration',
      description: 'Manage lesson notes and study materials',
      icon: FileText,
      href: '/research/admin',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600'
    },
    {
      title: 'Store Administration',
      description: 'Manage products and orders',
      icon: ShoppingBag,
      href: '/store/admin',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'User Roles',
      description: 'Manage user roles and permissions',
      icon: Shield,
      href: '/admin/roles',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  // Grouped stats for organized display
  const statGroups = {
    totals: [
      {
        label: 'Total Users',
        value: stats.totalUsers,
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        label: 'Total Students',
        value: stats.totalStudents,
        icon: GraduationCap,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        label: 'Total Teachers',
        value: stats.totalTeachers,
        icon: UserCheck,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50'
      },
      {
        label: 'Blog Posts',
        value: stats.totalPosts,
        icon: BookOpen,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ],
    students: [
      {
        label: 'Enrolled Students',
        value: stats.enrolledStudents,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        label: 'Without Teacher',
        value: stats.studentsWithoutTeacher,
        icon: UserX,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      },
      {
        label: 'Pending Payment',
        value: stats.studentsPendingPayment,
        icon: DollarSign,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      {
        label: 'Graduated',
        value: stats.graduatedStudents,
        icon: GraduationCap,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      },
      {
        label: 'Dropped Out',
        value: stats.droppedOutStudents,
        icon: XCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50'
      }
    ],
    teachers: [
      {
        label: 'With Students',
        value: stats.teachersWithStudents,
        icon: TrendingUp,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      },
      {
        label: 'Available',
        value: stats.teachersWithoutStudents,
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      }
    ],
    applications: [
      {
        label: 'Pending Applications',
        value: stats.pendingApplications,
        icon: FileText,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      }
    ],
    store: [
      {
        label: 'Pending Orders',
        value: stats.pendingOrders,
        icon: ShoppingBag,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Director Dashboard | The FastTrack Madrasah</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 sticky top-0 z-50 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <h1 className="text-base font-semibold text-gray-900">Director Dashboard</h1>
              <div className="flex items-center gap-4">
                <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Site
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex gap-6 overflow-x-auto">
              {[
                { key: 'overview', label: 'Overview', icon: BarChart3 },
                { key: 'links', label: 'Admin', icon: Shield },
                { key: 'planner', label: 'Planner', icon: ClipboardList }
              ].map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* Refresh */}
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    setLoading(true);
                    await fetchStats();
                    toast.success('Refreshed');
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 disabled:text-gray-400 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Totals Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Totals</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    {statGroups.totals.map(stat => {
                      const StatIcon = stat.icon;
                      return (
                        <div key={stat.label} className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                            <StatIcon className={`h-4 w-4 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-gray-900">{loading ? '-' : stat.value.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Students Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Students</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    {statGroups.students.map(stat => {
                      const StatIcon = stat.icon;
                      return (
                        <div key={stat.label} className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                            <StatIcon className={`h-4 w-4 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-gray-900">{loading ? '-' : stat.value.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Teachers Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Teachers</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    {statGroups.teachers.map(stat => {
                      const StatIcon = stat.icon;
                      return (
                        <div key={stat.label} className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                            <StatIcon className={`h-4 w-4 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-gray-900">{loading ? '-' : stat.value.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Applications & Store Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Applications & Store</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    {[...statGroups.applications, ...statGroups.store].map(stat => {
                      const StatIcon = stat.icon;
                      return (
                        <div key={stat.label} className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                            <StatIcon className={`h-4 w-4 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-gray-900">{loading ? '-' : stat.value.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {!loading && (stats.studentsWithoutTeacher > 0 || stats.studentsPendingPayment > 0 || stats.pendingApplications > 0 || stats.teachersWithoutStudents > 0) && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Attention</h3>
                  {stats.studentsWithoutTeacher > 0 && (
                    <div className="flex items-center gap-2.5 py-1.5 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"></span>
                      {stats.studentsWithoutTeacher} {stats.studentsWithoutTeacher === 1 ? 'student needs' : 'students need'} a teacher
                    </div>
                  )}
                  {stats.studentsPendingPayment > 0 && (
                    <div className="flex items-center gap-2.5 py-1.5 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></span>
                      {stats.studentsPendingPayment} pending {stats.studentsPendingPayment === 1 ? 'payment' : 'payments'}
                    </div>
                  )}
                  {stats.pendingApplications > 0 && (
                    <div className="flex items-center gap-2.5 py-1.5 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></span>
                      {stats.pendingApplications} {stats.pendingApplications === 1 ? 'application' : 'applications'} to review
                    </div>
                  )}
                  {stats.teachersWithoutStudents > 0 && (
                    <div className="flex items-center gap-2.5 py-1.5 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"></span>
                      {stats.teachersWithoutStudents} {stats.teachersWithoutStudents === 1 ? 'teacher' : 'teachers'} available
                    </div>
                  )}
                </div>
              )}

              {/* Charts */}
              {!loading && (
                <>
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                      <h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-0">Applications Over Time</h3>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={timeSeriesFilter.timeRange}
                          onChange={(e) => setTimeSeriesFilter({ ...timeSeriesFilter, timeRange: e.target.value })}
                          className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white"
                        >
                          <option value="3">3 months</option>
                          <option value="6">6 months</option>
                          <option value="12">12 months</option>
                          <option value="24">24 months</option>
                          <option value="999">All time</option>
                        </select>
                        <select
                          value={timeSeriesFilter.program}
                          onChange={(e) => setTimeSeriesFilter({ ...timeSeriesFilter, program: e.target.value })}
                          className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white"
                        >
                          <option value="all">All programs</option>
                          <option value="essentials">EASI</option>
                          <option value="tajweed">TMP</option>
                        </select>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={applicationsTimeSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="applications" stroke="#374151" strokeWidth={2} dot={{ fill: '#374151', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex flex-col gap-3 mb-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-0">By Track</h3>
                        <select
                          value={trackComparisonFilter.timeRange}
                          onChange={(e) => setTrackComparisonFilter({ ...trackComparisonFilter, timeRange: e.target.value })}
                          className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white"
                        >
                          <option value="3">3 months</option>
                          <option value="6">6 months</option>
                          <option value="12">12 months</option>
                          <option value="24">24 months</option>
                          <option value="999">All time</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { key: 'received', label: 'Received', color: 'bg-gray-400' },
                          { key: 'approved', label: 'Approved', color: 'bg-teal-600' },
                          { key: 'rejected', label: 'Rejected', color: 'bg-rose-500' },
                          { key: 'enrolled', label: 'Enrolled', color: 'bg-gray-700' },
                          { key: 'dropouts', label: 'Drop-outs', color: 'bg-amber-500' },
                          { key: 'graduated', label: 'Graduated', color: 'bg-violet-500' }
                        ].map(({ key, label, color }) => (
                          <button
                            key={key}
                            onClick={() => {
                              const newCategories = trackComparisonFilter.categories.includes(key)
                                ? trackComparisonFilter.categories.filter(c => c !== key)
                                : [...trackComparisonFilter.categories, key];
                              setTrackComparisonFilter({ ...trackComparisonFilter, categories: newCategories });
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full transition-colors ${
                              trackComparisonFilter.categories.includes(key)
                                ? 'text-gray-700 bg-gray-100'
                                : 'text-gray-400 hover:text-gray-500'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${color} ${!trackComparisonFilter.categories.includes(key) ? 'opacity-30' : ''}`}></span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={trackComparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="track" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <Tooltip />
                        {trackComparisonFilter.categories.includes('received') && (
                          <Bar dataKey="received" fill="#9ca3af" name="Received" radius={[3, 3, 0, 0]} />
                        )}
                        {trackComparisonFilter.categories.includes('approved') && (
                          <Bar dataKey="approved" fill="#0d9488" name="Approved" radius={[3, 3, 0, 0]} />
                        )}
                        {trackComparisonFilter.categories.includes('rejected') && (
                          <Bar dataKey="rejected" fill="#f43f5e" name="Rejected" radius={[3, 3, 0, 0]} />
                        )}
                        {trackComparisonFilter.categories.includes('enrolled') && (
                          <Bar dataKey="enrolled" fill="#374151" name="Enrolled" radius={[3, 3, 0, 0]} />
                        )}
                        {trackComparisonFilter.categories.includes('dropouts') && (
                          <Bar dataKey="dropouts" fill="#f59e0b" name="Drop-outs" radius={[3, 3, 0, 0]} />
                        )}
                        {trackComparisonFilter.categories.includes('graduated') && (
                          <Bar dataKey="graduated" fill="#8b5cf6" name="Graduated" radius={[3, 3, 0, 0]} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Referral Sources</h3>
                    {referralSourceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={referralSourceData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                          <YAxis dataKey="source" type="category" width={120} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#374151" name="Applications" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-gray-400 py-12 text-center">No referral data yet</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Admin Tab */}
          {activeTab === 'links' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {adminAreas.map((area) => {
                const Icon = area.icon;
                return (
                  <Link
                    key={area.href}
                    to={area.href}
                    className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
                  >
                    <div className={`p-2 rounded-lg ${area.iconBg}`}>
                      <Icon className={`h-4 w-4 ${area.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{area.title}</p>
                      <p className="text-xs text-gray-400">{area.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Planner Tab */}
          {activeTab === 'planner' && <DirectorPlanner />}
        </div>
      </div>
    </>
  );
};

export default DirectorDashboard;
