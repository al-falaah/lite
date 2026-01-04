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
  ArrowRight
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get session for auth token
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      if (!accessToken) {
        console.error('No access token available');
        setLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Fetch counts using REST API for reliability
      const [usersRes, postsRes, ordersRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'count=exact'
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/blog_posts?select=id&limit=1`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'count=exact'
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/store_orders?select=id&limit=1`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'count=exact'
          }
        })
      ]);

      const usersCount = parseInt(usersRes.headers.get('content-range')?.split('/')[1] || '0');
      const postsCount = parseInt(postsRes.headers.get('content-range')?.split('/')[1] || '0');
      const ordersCount = parseInt(ordersRes.headers.get('content-range')?.split('/')[1] || '0');

      setStats({
        totalUsers: usersCount,
        totalPosts: postsCount,
        totalOrders: ordersCount
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
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Blog Administration',
      description: 'Create and manage blog posts',
      icon: BookOpen,
      href: '/blog/admin',
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Store Administration',
      description: 'Manage products and orders',
      icon: ShoppingBag,
      href: '/store/admin',
      color: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'User Roles',
      description: 'Manage user roles and permissions',
      icon: Shield,
      href: '/admin/roles',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  const quickStats = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      href: '/admin/roles',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Blog Posts',
      value: stats.totalPosts,
      icon: BookOpen,
      href: '/blog/admin',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Store Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      href: '/store/admin?tab=orders',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
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
                <h1 className="text-lg font-semibold text-gray-900">Director Dashboard</h1>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Visit Website
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
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
              You have full access to all administrative areas
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  to={stat.href}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                      <p className={`text-3xl font-bold ${stat.color}`}>
                        {loading ? '...' : stat.value.toLocaleString()}
                      </p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Admin Areas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Areas</h3>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default DirectorDashboard;
