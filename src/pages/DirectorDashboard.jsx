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
  BarChart3
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

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

    // Other stats
    totalUsers: 0,
    totalPosts: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

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
        studentsNoTeacherRes,
        studentsPendingPaymentRes,
        enrolledStudentsRes,
        graduatedStudentsRes,
        droppedOutStudentsRes,
        teachersRes,
        teachersWithStudentsRes
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

        // Student stats
        fetch(`${supabaseUrl}/rest/v1/students?select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),
        fetch(`${supabaseUrl}/rest/v1/students?teacher_id=is.null&select=id&limit=1`, {
          method: 'HEAD',
          headers
        }),
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
        fetch(`${supabaseUrl}/rest/v1/teachers?select=id&students!inner(id)&limit=1`, {
          method: 'HEAD',
          headers
        })
      ]);

      const parseCount = (res) => parseInt(res.headers.get('content-range')?.split('/')[1] || '0');

      const totalTeachers = parseCount(teachersRes);
      const teachersWithStudents = parseCount(teachersWithStudentsRes);

      setStats({
        totalUsers: parseCount(usersRes),
        totalPosts: parseCount(postsRes),
        pendingOrders: parseCount(ordersRes),

        totalStudents: parseCount(studentsRes),
        studentsWithoutTeacher: parseCount(studentsNoTeacherRes),
        studentsPendingPayment: parseCount(studentsPendingPaymentRes),
        enrolledStudents: parseCount(enrolledStudentsRes),
        graduatedStudents: parseCount(graduatedStudentsRes),
        droppedOutStudents: parseCount(droppedOutStudentsRes),

        totalTeachers,
        teachersWithStudents,
        teachersWithoutStudents: totalTeachers - teachersWithStudents
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
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

  // Overview stats for first tab
  const overviewStats = [
    // Student Stats
    {
      label: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: null
    },
    {
      label: 'Students Without Teacher',
      value: stats.studentsWithoutTeacher,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: null
    },
    {
      label: 'Pending Payment',
      value: stats.studentsPendingPayment,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: null
    },
    {
      label: 'Enrolled Students',
      value: stats.enrolledStudents,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: null
    },
    {
      label: 'Graduated Students',
      value: stats.graduatedStudents,
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: null
    },
    {
      label: 'Dropped Out',
      value: stats.droppedOutStudents,
      icon: XCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: null
    },

    // Teacher Stats
    {
      label: 'Total Teachers',
      value: stats.totalTeachers,
      icon: UserCheck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      change: null
    },
    {
      label: 'Teachers With Students',
      value: stats.teachersWithStudents,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: null
    },
    {
      label: 'Teachers Without Students',
      value: stats.teachersWithoutStudents,
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      change: null
    },

    // Other Stats
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: null
    },
    {
      label: 'Blog Posts',
      value: stats.totalPosts,
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: null
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ShoppingBag,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: null
    }
  ];

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
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
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
                className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
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
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Director'}
            </h2>
            <p className="text-gray-600">
              {activeTab === 'overview'
                ? 'Overview of all madrasah statistics and metrics'
                : 'Quick access to all administrative areas'}
            </p>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {overviewStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
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
                })}
              </div>

              {/* Quick Insights */}
              {!loading && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {stats.pendingOrders > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <ShoppingBag className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-emerald-900 mb-1">Store Orders</h4>
                          <p className="text-sm text-emerald-700">
                            {stats.pendingOrders} {stats.pendingOrders === 1 ? 'order is' : 'orders are'} waiting for processing
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
