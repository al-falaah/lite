import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  BookOpen,
  ShoppingBag,
  Shield,
  Users,
  BarChart3,
  LogOut
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

const DirectorDashboard = () => {
  const { profile } = useAuth();
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
      // Fetch total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total blog posts count
      const { count: postsCount } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true });

      // Fetch total store orders count
      const { count: ordersCount } = await supabase
        .from('store_orders')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: usersCount || 0,
        totalPosts: postsCount || 0,
        totalOrders: ordersCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const adminAreas = [
    {
      title: 'Madrasah Administration',
      description: 'Manage students, teachers, applications, and enrollments',
      icon: GraduationCap,
      href: '/admin',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Blog Administration',
      description: 'Create and manage blog posts, articles, and content',
      icon: BookOpen,
      href: '/blog/admin',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Store Administration',
      description: 'Manage products, orders, and inventory',
      icon: ShoppingBag,
      href: '/store/admin',
      color: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      title: 'User Roles Management',
      description: 'Assign and manage roles for all admin users',
      icon: Shield,
      href: '/admin/roles',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Director Dashboard | The FastTrack Madrasah</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-12 w-12 text-emerald-600" />
              <h1 className="text-4xl font-bold text-gray-900">Director Dashboard</h1>
            </div>
            <p className="text-xl text-gray-600">
              Welcome, {profile?.full_name || 'Director'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              You have full access to all administrative areas
            </p>
          </div>

          {/* Admin Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {adminAreas.map((area) => {
              const Icon = area.icon;
              return (
                <Link
                  key={area.href}
                  to={area.href}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex items-start gap-4">
                      <div className={`${area.bgLight} p-4 rounded-xl group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-8 w-8 ${area.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                          {area.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {area.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={`${area.color} ${area.hoverColor} py-3 px-8 transition-colors`}>
                    <span className="text-white text-sm font-medium">
                      Access Dashboard →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-900">Quick Overview</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/admin/roles"
                className="text-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? '...' : stats.totalUsers}
                </p>
                <p className="text-xs text-blue-500 mt-2">Click to manage →</p>
              </Link>
              <Link
                to="/blog/admin"
                className="text-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group"
              >
                <BookOpen className="h-8 w-8 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm text-gray-600 mb-1">Blog Posts</p>
                <p className="text-3xl font-bold text-orange-600">
                  {loading ? '...' : stats.totalPosts}
                </p>
                <p className="text-xs text-orange-500 mt-2">Click to manage →</p>
              </Link>
              <Link
                to="/store/admin?tab=orders"
                className="text-center p-6 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors group"
              >
                <ShoppingBag className="h-8 w-8 text-emerald-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm text-gray-600 mb-1">Store Orders</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {loading ? '...' : stats.totalOrders}
                </p>
                <p className="text-xs text-emerald-500 mt-2">Click to manage →</p>
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Link
              to="/"
              className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
            >
              ← Back to Website
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DirectorDashboard;
