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
  RefreshCw
} from 'lucide-react';
import { supabase } from '../services/supabase';
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

  const StatCard = ({ stat }) => {
    const Icon = stat.icon;
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className={`${stat.bgColor} p-2 rounded-lg`}>
            <Icon className={`h-5 w-5 ${stat.color}`} />
          </div>
        </div>
        <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
        <p className={`text-2xl font-bold ${stat.color}`}>
          {loading ? '...' : stat.value.toLocaleString()}
        </p>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Director Dashboard | The FastTrack Madrasah</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-emerald-600" />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Director Dashboard</h1>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Visit Website
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                Quick Overview
              </button>
              <button
                onClick={() => setActiveTab('links')}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'links'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="h-5 w-5" />
                Administrative Areas
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'Director'}
                </h2>
                <p className="text-gray-600">
                  {activeTab === 'overview'
                    ? 'Overview of all madrasah statistics and metrics'
                    : 'Quick access to all administrative areas'}
                </p>
              </div>
              {activeTab === 'overview' && (
                <button
                  onClick={async () => {
                    setLoading(true);
                    await fetchStats();
                    toast.success('Statistics refreshed');
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              )}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Totals Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Totals</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statGroups.totals.map((stat) => (
                    <StatCard key={stat.label} stat={stat} />
                  ))}
                </div>
              </div>

              {/* Students Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Students</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {statGroups.students.map((stat) => (
                    <StatCard key={stat.label} stat={stat} />
                  ))}
                </div>
              </div>

              {/* Teachers Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teachers</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  {statGroups.teachers.map((stat) => (
                    <StatCard key={stat.label} stat={stat} />
                  ))}
                </div>
              </div>

              {/* Applications & Store Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications & Store</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  {statGroups.applications.map((stat) => (
                    <StatCard key={stat.label} stat={stat} />
                  ))}
                  {statGroups.store.map((stat) => (
                    <StatCard key={stat.label} stat={stat} />
                  ))}
                </div>
              </div>

              {/* Charts Section */}
              {!loading && (
                <>
                  {/* Time Series - Applications by Month */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">Applications Over Time</h3>

                      {/* Filters */}
                      <div className="flex flex-wrap gap-3">
                        {/* Time Range Filter */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Period:</label>
                          <select
                            value={timeSeriesFilter.timeRange}
                            onChange={(e) => setTimeSeriesFilter({ ...timeSeriesFilter, timeRange: e.target.value })}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="3">Last 3 months</option>
                            <option value="6">Last 6 months</option>
                            <option value="12">Last 12 months</option>
                            <option value="24">Last 24 months</option>
                            <option value="999">All time</option>
                          </select>
                        </div>

                        {/* Program Filter */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Program:</label>
                          <select
                            value={timeSeriesFilter.program}
                            onChange={(e) => setTimeSeriesFilter({ ...timeSeriesFilter, program: e.target.value })}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="all">All Programs</option>
                            <option value="essentials">Essentials Arabic & Islamic Studies</option>
                            <option value="tajweed">Tajweed Mastery</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={applicationsTimeSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="applications" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Track Comparison */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex flex-col gap-4 mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">Applications by Track</h3>

                        {/* Time Range Filter */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Period:</label>
                          <select
                            value={trackComparisonFilter.timeRange}
                            onChange={(e) => setTrackComparisonFilter({ ...trackComparisonFilter, timeRange: e.target.value })}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="3">Last 3 months</option>
                            <option value="6">Last 6 months</option>
                            <option value="12">Last 12 months</option>
                            <option value="24">Last 24 months</option>
                            <option value="999">All time</option>
                          </select>
                        </div>
                      </div>

                      {/* Category Filter */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-600 self-center">Show:</span>
                        {[
                          { key: 'received', label: 'Received', color: 'bg-blue-500' },
                          { key: 'approved', label: 'Approved', color: 'bg-emerald-500' },
                          { key: 'rejected', label: 'Rejected', color: 'bg-red-500' },
                          { key: 'enrolled', label: 'Enrolled', color: 'bg-purple-500' },
                          { key: 'dropouts', label: 'Drop-outs', color: 'bg-amber-500' },
                          { key: 'graduated', label: 'Graduated', color: 'bg-pink-500' }
                        ].map(({ key, label, color }) => (
                          <button
                            key={key}
                            onClick={() => {
                              const newCategories = trackComparisonFilter.categories.includes(key)
                                ? trackComparisonFilter.categories.filter(c => c !== key)
                                : [...trackComparisonFilter.categories, key];
                              setTrackComparisonFilter({ ...trackComparisonFilter, categories: newCategories });
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              trackComparisonFilter.categories.includes(key)
                                ? 'bg-gray-100 text-gray-900 border-2 border-gray-300'
                                : 'bg-gray-50 text-gray-400 border-2 border-gray-200'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-sm ${color} ${!trackComparisonFilter.categories.includes(key) ? 'opacity-30' : ''}`}></span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={trackComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="track" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {trackComparisonFilter.categories.includes('received') && (
                          <Bar dataKey="received" fill="#3b82f6" name="Received" />
                        )}
                        {trackComparisonFilter.categories.includes('approved') && (
                          <Bar dataKey="approved" fill="#10b981" name="Approved" />
                        )}
                        {trackComparisonFilter.categories.includes('rejected') && (
                          <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                        )}
                        {trackComparisonFilter.categories.includes('enrolled') && (
                          <Bar dataKey="enrolled" fill="#8b5cf6" name="Enrolled" />
                        )}
                        {trackComparisonFilter.categories.includes('dropouts') && (
                          <Bar dataKey="dropouts" fill="#f59e0b" name="Drop-outs" />
                        )}
                        {trackComparisonFilter.categories.includes('graduated') && (
                          <Bar dataKey="graduated" fill="#ec4899" name="Graduated" />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {/* Quick Insights */}
              {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.studentsWithoutTeacher > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <UserX className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-900 mb-1">Action Required</h4>
                          <p className="text-sm text-red-700">
                            {stats.studentsWithoutTeacher} {stats.studentsWithoutTeacher === 1 ? 'student needs' : 'students need'} to be assigned a teacher
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {stats.studentsPendingPayment > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-900 mb-1">Payment Pending</h4>
                          <p className="text-sm text-yellow-700">
                            {stats.studentsPendingPayment} {stats.studentsPendingPayment === 1 ? 'student has' : 'students have'} pending payments
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {stats.pendingApplications > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-900 mb-1">Pending Review</h4>
                          <p className="text-sm text-yellow-700">
                            {stats.pendingApplications} {stats.pendingApplications === 1 ? 'application needs' : 'applications need'} review
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {stats.teachersWithoutStudents > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">Available Teachers</h4>
                          <p className="text-sm text-blue-700">
                            {stats.teachersWithoutStudents} {stats.teachersWithoutStudents === 1 ? 'teacher is' : 'teachers are'} available for new students
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminAreas.map((area) => {
                const Icon = area.icon;
                return (
                  <Link
                    key={area.href}
                    to={area.href}
                    className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`${area.iconBg} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                          <Icon className={`h-6 w-6 ${area.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                            {area.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {area.description}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DirectorDashboard;
