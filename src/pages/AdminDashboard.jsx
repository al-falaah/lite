import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BookOpen,
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
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { applications, supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import AdminClassScheduling from './AdminClassScheduling';
import AdminStudentsList from './AdminStudentsList';
import AvailabilityCalendar from '../components/admin/AvailabilityCalendar';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signIn, signOut } = useAuth();
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

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

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
    try {
      const { data, error } = await applications.getAll(
        statusFilter === 'all' ? null : statusFilter
      );

      if (error) {
        toast.error('Failed to load applications');
        console.error(error);
        return;
      }

      setApplicationsData(data || []);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('An error occurred while loading applications');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        throw error;
      }
      // Navigate to admin login page after successful logout
      navigate('/admin');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create student');
      }

      toast.success('Student created successfully!');
      return result.student;
    } catch (error) {
      console.error('Error creating student:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <BookOpen className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Al-Falaah Academy</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="admin@alfalaah-academy.nz"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loggingIn}
            >
              {loggingIn ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Logging in...
                </>
              ) : (
                'Login to Dashboard'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-emerald-600 hover:text-emerald-700">
              ← Back to Homepage
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-emerald-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Al-Falaah Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {profile?.full_name || 'Admin'}
              </span>
              <Button variant="secondary" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'applications'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <FileText className="h-5 w-5" />
              Applications
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'students'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Users className="h-5 w-5" />
              Students
            </button>
            <button
              onClick={() => setActiveTab('scheduling')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'scheduling'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-5 w-5" />
              Class Scheduling
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'availability'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Clock className="h-5 w-5" />
              Availability
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'applications' && (
          <>
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.total}
                    </div>
                  </div>
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Pending</div>
                    <div className="text-3xl font-bold text-yellow-600">
                      {stats.pending}
                    </div>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-400" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Approved</div>
                    <div className="text-3xl font-bold text-green-600">
                      {stats.approved}
                    </div>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-400" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Rejected</div>
                    <div className="text-3xl font-bold text-red-600">
                      {stats.rejected}
                    </div>
                  </div>
                  <XCircle className="h-10 w-10 text-red-400" />
                </div>
              </Card>
            </div>

            {/* Filters */}
            <div className="mb-6 flex justify-between items-center">
              <div className="flex gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh applications"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Applications List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : applicationsData.length === 0 ? (
              <Card>
                <p className="text-center text-gray-600 py-8">
                  No applications found
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {applicationsData.map((app) => (
                  <Card key={app.id} className="hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {app.full_name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(app.status)}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                app.status
                              )}`}
                            >
                              {app.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Email:</span> {app.email}
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {app.phone}
                          </div>
                          <div>
                            <span className="font-medium">Gender:</span>{' '}
                            <span className="capitalize">{app.gender}</span>
                          </div>
                          <div>
                            <span className="font-medium">Can Read Quran:</span>{' '}
                            {app.can_read_quran ? `Yes${app.tajweed_level ? ` (${app.tajweed_level})` : ''}` : 'No'}
                          </div>
                          <div>
                            <span className="font-medium">Studied Arabic:</span>{' '}
                            {app.has_studied_arabic ? `Yes${app.arabic_level ? ` (${app.arabic_level})` : ''}` : 'No'}
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span>{' '}
                            {formatDate(app.submitted_at)}
                          </div>
                        </div>

                        {app.motivation && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Motivation:</span>{' '}
                              {app.motivation}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewApplication(app)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        {app.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleReviewApplication(app, 'approved')}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReviewApplication(app, 'rejected')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'students' && <AdminStudentsList />}

        {activeTab === 'scheduling' && <AdminClassScheduling />}

        {activeTab === 'availability' && <AvailabilityCalendar />}
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Application Details
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    ID: <span className="font-mono">{selectedApplication.id}</span>
                  </p>
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