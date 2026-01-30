import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import useIdleTimeout from '../hooks/useIdleTimeout';
import {
  LogOut,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Check,
  X,
  Send,
  Copy,
  Loader2,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Home,
  Mail,
  Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { applications, supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import AdminStudentsList from './AdminStudentsList';
import ClassScheduler from '../components/admin/ClassScheduler';
import AdminTeachersList from './AdminTeachersList';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signIn, signOut } = useAuth();

  // Determine back link based on user role
  const backLink = profile?.role === 'director' ? '/director' : '/';
  const [activeTab, setActiveTab] = useState('applications');
  const [loading, setLoading] = useState(false);
  const [applicationsData, setApplicationsData] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Auto-logout after 15 minutes of inactivity (only for logged-in admins)
  const handleIdleLogout = useCallback(async () => {
    toast.error('Session expired due to inactivity. Please log in again.');
    try {
      await signOut();
      navigate('/admin');
    } catch (error) {
      console.error('Auto-logout error:', error);
    }
  }, [signOut, navigate]);

  const handleIdleWarning = useCallback(() => {
    toast.warning('You will be logged out in 1 minute due to inactivity.');
  }, []);

  // Only activate idle timeout when admin is logged in
  // Conditionally use the hook based on auth state
  const isAdminLoggedIn = user && profile?.is_admin;

  useIdleTimeout({
    onIdle: handleIdleLogout,
    onWarning: handleIdleWarning,
    idleTime: 15 * 60 * 1000, // 15 minutes
    warningTime: 1 * 60 * 1000, // 1 minute warning
    enabled: isAdminLoggedIn // Only enable when admin is logged in
  });

  useEffect(() => {
    // Only load applications when on the applications tab AND not already loaded
    if (activeTab === 'applications' && !dataLoaded) {
      loadApplications();
    }
  }, [activeTab]);

  // Reload when status filter changes
  useEffect(() => {
    if (activeTab === 'applications' && dataLoaded) {
      loadApplications();
    }
  }, [statusFilter]);

  const loadApplications = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      // Add timeout to prevent infinite loading
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const dataFetch = applications.getAll(
        statusFilter === 'all' ? null : statusFilter
      );

      // Race between data fetch and timeout
      const { data, error } = await Promise.race([dataFetch, timeout]);

      if (error) {
        setError('Failed to load applications');
        toast.error('Failed to load applications');
        console.error(error);
        return;
      }

      setApplicationsData(data || []);
      setDataLoaded(true);
      setError(null);
    } catch (error) {
      console.error('Error loading applications:', error);
      if (error.message === 'Request timeout') {
        setError('Request timed out. Please check your connection and try again.');
        toast.error('Request timed out. Click Retry to load again.');
      } else {
        setError('An error occurred while loading applications');
        toast.error('An error occurred while loading applications');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Admin logout initiated');
      const { error } = await signOut();
      if (error) {
        console.error('Logout error:', error);
        // Even if there's an error, navigate away to force logout
        toast.warning('Logout completed (with errors)');
      }
      // Navigate to admin login page after logout
      navigate('/admin');
    } catch (error) {
      console.error('Logout exception:', error);
      toast.error('Logout failed, redirecting anyway');
      // Force navigation even on error
      navigate('/admin');
    }
  };

  const handleViewApplication = (app) => {
    setSelectedApplication(app);
  };

  const handleReviewApplication = (app, action) => {
    setSelectedApplication(app);
    setReviewAction(action);
    setReviewNotes('');
    setReviewModal(true);
  };


  const createStudentFromApplication = async (app) => {
    try {
      console.log('[AdminDashboard] Creating student from application:', app.id);

      // Call Edge Function to create student and generate payments
      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-student-from-application`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ applicationId: app.id }),
        }
      );

      console.log('[AdminDashboard] Response status:', response.status);
      const result = await response.json();
      console.log('[AdminDashboard] Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create student');
      }

      console.log('[AdminDashboard] Student created successfully:', result.student);
      toast.success('Student created successfully!');
      return result.student;
    } catch (error) {
      console.error('[AdminDashboard] Error creating student:', error);
      toast.error(error.message || 'Failed to create student record');
      throw error;
    }
  };

  const submitReview = async () => {
    if (!selectedApplication || !reviewAction) return;

    setSubmittingReview(true);
    try {
      const updates = {
        status: reviewAction,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: reviewNotes || null
      };

      if (reviewAction === 'rejected') {
        updates.rejection_reason = reviewNotes || 'Application did not meet requirements';
      }

      const { error } = await applications.update(selectedApplication.id, updates);

      if (error) {
        toast.error('Failed to update application');
        console.error(error);
        setSubmittingReview(false);
        return;
      }

      // If approved, create student record (status: pending_payment)
      if (reviewAction === 'approved') {
        try {
          await createStudentFromApplication(selectedApplication);
          toast.success('Application approved! Payment instructions sent to applicant.');
        } catch (error) {
          toast.warning('Application approved but failed to send payment instructions.');
        }
      } else {
        toast.success('Application rejected');
      }

      setReviewModal(false);
      setSelectedApplication(null);
      setReviewAction(null);
      setReviewNotes('');
      loadApplications();
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast.error('An error occurred');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const stats = {
    total: applicationsData.length,
    pending: applicationsData.filter((app) => app.status === 'pending').length,
    approved: applicationsData.filter((app) => app.status === 'approved').length,
    rejected: applicationsData.filter((app) => app.status === 'rejected').length
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || 'Login failed');
      }
      // Success handled by AuthContext redirect
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setLoggingIn(false);
    }
  };

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <img src="/favicon.svg" alt="The FastTrack Madrasah Logo" className="h-12 w-12 mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Admin Portal</h1>
            <p className="text-sm text-gray-500">The FastTrack Madrasah</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                placeholder="admin@tftmadrasah.nz"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loggingIn ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-900">
              ← Back to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0">
              <img src="/favicon.svg" alt="The FastTrack Madrasah Logo" className="h-8 w-8 flex-shrink-0" />
              <span className="ml-2 text-base sm:text-xl font-brand font-bold text-gray-900 truncate">
                <span className="hidden sm:inline">The FastTrack Madrasah </span>Admin
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {profile?.role === 'director' && (
                <Link
                  to={backLink}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}
              <span className="text-xs sm:text-sm text-gray-600 hidden md:inline truncate max-w-[120px]">
                {profile?.full_name || 'Admin'}
              </span>
              <Button variant="secondary" onClick={handleLogout} className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-2 overflow-x-auto scrollbar-hide py-2" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('applications')}
              className={`group relative flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                activeTab === 'applications'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-600/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                activeTab === 'applications' ? 'text-emerald-600' : 'text-gray-400'
              }`} />
              <span className="font-semibold">Applications</span>
              {activeTab === 'applications' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-emerald-600 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`group relative flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                activeTab === 'students'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-600/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                activeTab === 'students' ? 'text-emerald-600' : 'text-gray-400'
              }`} />
              <span className="font-semibold">Students</span>
              {activeTab === 'students' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-emerald-600 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`group relative flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                activeTab === 'availability'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-600/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Calendar className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                activeTab === 'availability' ? 'text-emerald-600' : 'text-gray-400'
              }`} />
              <span className="font-semibold">Scheduling</span>
              {activeTab === 'availability' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-emerald-600 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`group relative flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                activeTab === 'teachers'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-600/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <UserCheck className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                activeTab === 'teachers' ? 'text-emerald-600' : 'text-gray-400'
              }`} />
              <span className="font-semibold">Teachers</span>
              {activeTab === 'teachers' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-emerald-600 rounded-full"></span>
              )}
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'applications' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-sm text-gray-600 mb-1">Total Applications</div>
                <div className="text-3xl font-semibold text-gray-900">{stats.total}</div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="text-sm text-gray-600 mb-1">Pending Review</div>
                <div className="text-3xl font-semibold text-gray-900">{stats.pending}</div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-sm text-gray-600 mb-1">Approved</div>
                <div className="text-3xl font-semibold text-gray-900">{stats.approved}</div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-sm text-gray-600 mb-1">Rejected</div>
                <div className="text-3xl font-semibold text-gray-900">{stats.rejected}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      statusFilter === filter
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button
                onClick={() => loadApplications()}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Refresh applications"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Applications List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                      <circle cx="32" cy="32" r="28" stroke="#059669" strokeWidth="4" fill="none" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 28}
                        className="animate-spin" style={{animationDuration: '1.5s'}} />
                    </svg>
                  </div>
                  <p className="text-gray-600 mt-3 text-sm">Loading applications...</p>
                </div>
              </div>
            ) : error && applicationsData.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Applications</h3>
                  <p className="text-gray-600 mb-6 max-w-md">{error}</p>
                  <Button onClick={() => loadApplications(true)} variant="primary">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            ) : applicationsData.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
                <p className="text-gray-600">There are no applications matching your current filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applicationsData.map((app) => (
                  <div key={app.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {app.full_name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-md text-xs font-medium ${
                              app.program === 'tajweed'
                                ? 'bg-purple-100 text-purple-700'
                                : app.program === 'qari'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {app.program === 'tajweed' ? 'Tajweed' : app.program === 'qari' ? 'QARI' : 'Essentials'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium ${getStatusColor(
                                app.status
                              )}`}
                            >
                              {getStatusIcon(app.status)}
                              {app.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{app.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{app.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-4 w-4 flex-shrink-0" />
                            <span className="capitalize">{app.gender}</span>
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Quran:</span> {app.can_read_quran ? `Yes${app.tajweed_level ? ` (${app.tajweed_level})` : ''}` : 'No'}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Arabic:</span> {app.has_studied_arabic ? `Yes${app.arabic_level ? ` (${app.arabic_level})` : ''}` : 'No'}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{formatDate(app.submitted_at)}</span>
                          </div>
                        </div>

                        {app.motivation && (
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              <span className="font-medium text-gray-900">Motivation:</span>{' '}
                              {app.motivation}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col gap-2 sm:ml-4 w-full sm:w-auto shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewApplication(app)}
                          className="flex-1 sm:flex-none"
                        >
                          <Eye className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                        </Button>

                        {app.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleReviewApplication(app, 'approved')}
                              className="flex-1 sm:flex-none"
                            >
                              <Check className="h-4 w-4 sm:mr-2" />
                              <span>Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReviewApplication(app, 'rejected')}
                              className="flex-1 sm:flex-none"
                            >
                              <X className="h-4 w-4 sm:mr-2" />
                              <span>Reject</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'students' && <AdminStudentsList />}

        {activeTab === 'availability' && <ClassScheduler />}

        {activeTab === 'teachers' && <AdminTeachersList />}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {reviewAction === 'approved' ? 'Approve' : 'Reject'} Application
              </h2>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">
                  {selectedApplication?.full_name}
                </p>
                <p className="text-sm text-gray-600">{selectedApplication?.email}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {reviewAction === 'approved' ? 'Admin Notes' : 'Rejection Reason'}
                  {reviewAction === 'rejected' && (
                    <span className="text-red-600">*</span>
                  )}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={
                    reviewAction === 'approved'
                      ? 'Add any notes for this applicant (optional)'
                      : 'Please provide a reason for rejection (required)'
                  }
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setReviewModal(false);
                    setSelectedApplication(null);
                    setReviewAction(null);
                    setReviewNotes('');
                  }}
                  disabled={submittingReview}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant={reviewAction === 'approved' ? 'primary' : 'secondary'}
                  onClick={submitReview}
                  disabled={submittingReview || (reviewAction === 'rejected' && !reviewNotes.trim())}
                  fullWidth
                >
                  {submittingReview ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {reviewAction === 'approved' ? 'Creating Student...' : 'Processing...'}
                    </span>
                  ) : (
                    `${reviewAction === 'approved' ? 'Approve' : 'Reject'} Application`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApplication && !reviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Application Details
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedApplication.program === 'tajweed'
                        ? 'bg-purple-100 text-purple-800'
                        : selectedApplication.program === 'qari'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedApplication.program === 'tajweed' ? 'Tajweed Track' : selectedApplication.program === 'qari' ? 'QARI Track' : 'Essential Islamic Studies Track'}
                    </span>
                    <p className="text-sm text-gray-500">
                      ID: <span className="font-mono">{selectedApplication.id}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Full Name</label>
                      <p className="font-medium">{selectedApplication.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      <p className="font-medium">{selectedApplication.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Phone</label>
                      <p className="font-medium">{selectedApplication.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Gender</label>
                      <p className="font-medium capitalize">
                        {selectedApplication.gender}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Date of Birth</label>
                      <p className="font-medium">
                        {formatDate(selectedApplication.date_of_birth)}
                        {selectedApplication.date_of_birth && (
                          <span className="ml-2 text-gray-500">
                            (Age: {calculateAge(selectedApplication.date_of_birth)} years)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Islamic Background */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Islamic Background
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Can Read Quran</label>
                      <p className="font-medium">
                        {selectedApplication.can_read_quran ? 'Yes' : 'No'}
                      </p>
                    </div>
                    {selectedApplication.can_read_quran && selectedApplication.tajweed_level && (
                      <div>
                        <label className="text-sm text-gray-600">Tajweed Level</label>
                        <p className="font-medium capitalize">
                          {selectedApplication.tajweed_level}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-600">Studied Arabic</label>
                      <p className="font-medium">
                        {selectedApplication.has_studied_arabic ? 'Yes' : 'No'}
                      </p>
                    </div>
                    {selectedApplication.has_studied_arabic && selectedApplication.arabic_level && (
                      <div>
                        <label className="text-sm text-gray-600">Arabic Level</label>
                        <p className="font-medium capitalize">
                          {selectedApplication.arabic_level}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Application Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Motivation
                  </h3>
                  <div className="space-y-4">
                    {selectedApplication.motivation && (
                      <div>
                        <label className="text-sm text-gray-600">
                          Why are you interested in this program and what do you hope to achieve?
                        </label>
                        <p className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                          {selectedApplication.motivation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Availability Preferences */}
                {(selectedApplication.preferred_days?.length > 0 || selectedApplication.preferred_times?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Availability Preferences
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedApplication.preferred_days?.length > 0 && (
                        <div>
                          <label className="text-sm text-gray-600">Preferred Days</label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedApplication.preferred_days.map((day) => (
                              <span
                                key={day}
                                className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-md font-medium"
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedApplication.preferred_times?.length > 0 && (
                        <div className="w-full">
                          <label className="text-sm text-gray-600 mb-3 block">Preferred Time Slots</label>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Slot Name
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Applicant's Time
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    NZ Time
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    NZ Hours
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {selectedApplication.preferred_times.map((timeSlot, index) => {
                                  // Parse if it's a JSON string
                                  let slotData = timeSlot;
                                  if (typeof timeSlot === 'string') {
                                    try {
                                      slotData = JSON.parse(timeSlot);
                                    } catch (e) {
                                      slotData = timeSlot;
                                    }
                                  }
                                  
                                  if (typeof slotData === 'object' && slotData !== null) {
                                    return (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {slotData.slot || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {slotData.user_time || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {slotData.nz_time || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {slotData.nz_hours || '-'}
                                        </td>
                                      </tr>
                                    );
                                  } else {
                                    return (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td colSpan="4" className="px-4 py-3 text-sm text-gray-900">
                                          {slotData}
                                        </td>
                                      </tr>
                                    );
                                  }
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {selectedApplication.timezone && (
                        <div>
                          <label className="text-sm text-gray-600">Timezone</label>
                          <p className="font-medium mt-1">{selectedApplication.timezone}</p>
                        </div>
                      )}
                      {selectedApplication.availability_notes && (
                        <div className="md:col-span-2">
                          <label className="text-sm text-gray-600">Additional Notes</label>
                          <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                            {selectedApplication.availability_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Status</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedApplication.status)}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        selectedApplication.status
                      )}`}
                    >
                      {selectedApplication.status.replace('_', ' ')}
                    </span>
                  </div>

                  {selectedApplication.admin_notes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <label className="text-sm font-medium text-blue-900">
                        Admin Notes:
                      </label>
                      <p className="text-sm text-blue-800 mt-1">
                        {selectedApplication.admin_notes}
                      </p>
                    </div>
                  )}

                  {selectedApplication.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <label className="text-sm font-medium text-red-900">
                        Rejection Reason:
                      </label>
                      <p className="text-sm text-red-800 mt-1">
                        {selectedApplication.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

              </div>

              <div className="mt-6 flex flex-col gap-3">
                {selectedApplication.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleReviewApplication(selectedApplication, 'approved');
                      }}
                      fullWidth
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve Application
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        handleReviewApplication(selectedApplication, 'rejected');
                      }}
                      fullWidth
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject Application
                    </Button>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedApplication(null)}
                  fullWidth
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;