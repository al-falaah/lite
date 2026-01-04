import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  LogOut,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../services/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const StoreAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const headers = {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      };

      if (token) {
        const authData = JSON.parse(token);
        if (authData?.currentSession?.access_token) {
          headers['Authorization'] = `Bearer ${authData.currentSession.access_token}`;
        }
      }

      // Fetch products stats
      const productsResponse = await fetch(`${supabaseUrl}/rest/v1/store_products?select=is_active`, { headers });
      const products = await productsResponse.json();

      // Fetch orders stats
      const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/store_orders?select=status,total_nzd`, { headers });
      const orders = await ordersResponse.json();

      // Calculate stats
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.is_active).length;
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const paidOrders = orders.filter(o => ['paid', 'shipped', 'delivered'].includes(o.status)).length;
      const totalRevenue = orders
        .filter(o => ['paid', 'shipped', 'delivered'].includes(o.status))
        .reduce((sum, o) => sum + parseFloat(o.total_nzd || 0), 0);

      setStats({
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        paidOrders,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Store Admin Dashboard | The FastTrack Madrasah</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-8 w-8 text-emerald-600" />
                <h1 className="text-2xl font-bold text-gray-900">Store Admin</h1>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Store Admin</h2>
            <p className="text-gray-600">Manage your products and orders from this dashboard</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Products */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Products</span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-sm text-gray-600">
                  {stats.activeProducts} active
                </p>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Orders</span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-gray-600">
                  {stats.paidOrders} completed
                </p>
              </div>
            </div>

            {/* Pending Orders */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Pending</span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
                <p className="text-sm text-gray-600">
                  {stats.pendingOrders > 0 ? 'Need attention' : 'All clear'}
                </p>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Total Revenue (Paid Orders)</span>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold text-emerald-600">
                  ${stats.totalRevenue.toFixed(2)} NZD
                </p>
                <p className="text-sm text-gray-600">
                  From {stats.paidOrders} completed {stats.paidOrders === 1 ? 'order' : 'orders'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manage Products */}
              <Link
                to="/admin/store-products"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Manage Products</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Add, edit, or remove products from your store catalog
                    </p>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                      Go to Products
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Manage Orders */}
              <Link
                to="/admin/store-orders"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <ShoppingBag className="h-5 w-5 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Manage Orders</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      View customer orders, update status, and send invoices
                    </p>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                      Go to Orders
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Pending Orders Alert */}
          {stats.pendingOrders > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                    {stats.pendingOrders} {stats.pendingOrders === 1 ? 'Order' : 'Orders'} Awaiting Review
                  </h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    You have pending customer orders that need your attention. Review them to calculate shipping and send invoices.
                  </p>
                  <Link
                    to="/admin/store-orders"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Review Orders Now
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/" className="text-gray-600 hover:text-emerald-600 transition-colors">
                ← Back to Main Site
              </Link>
              <Link to="/store" className="text-gray-600 hover:text-emerald-600 transition-colors">
                View Store (Public)
              </Link>
              <Link to="/admin" className="text-gray-600 hover:text-emerald-600 transition-colors">
                Main Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StoreAdminDashboard;
