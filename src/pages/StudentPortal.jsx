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
      // Load enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;
      setEnrollments(enrollmentsData || []);

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
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (enrollment, planType) => {
    setProcessingPayment(enrollment.id);

    try {
      // Create Stripe checkout session
      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-stripe-checkout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: student.email,
            planType: planType,
            enrollmentId: enrollment.id,
            program: enrollment.program
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = result.checkout_url;

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setProcessingPayment(null);
    }
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

                    {/* Payment Actions */}
                    {hasPendingPayment && (
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Make a Payment</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {!isTajweed && (
                            <>
                              {/* Monthly Plan */}
                              <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                  <Calendar className="h-5 w-5 text-blue-600" />
                                  <h4 className="font-semibold text-gray-900">Monthly Plan</h4>
                                </div>
                                <p className="text-3xl font-bold text-blue-600 mb-2">$25<span className="text-sm text-gray-600">/month</span></p>
                                <p className="text-sm text-gray-600 mb-4">Pay monthly over 24 months</p>
                                <Button
                                  onClick={() => handlePayment(enrollment, 'monthly')}
                                  disabled={processingPayment === enrollment.id}
                                  fullWidth
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {processingPayment === enrollment.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <CreditCard className="h-5 w-5 mr-2" />
                                      Pay $25/month
                                    </>
                                  )}
                                </Button>
                              </div>

                              {/* Annual Plan */}
                              <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-lg relative">
                                <div className="absolute -top-3 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                  Save $25!
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                  <DollarSign className="h-5 w-5 text-emerald-600" />
                                  <h4 className="font-semibold text-gray-900">Annual Plan</h4>
                                </div>
                                <p className="text-3xl font-bold text-emerald-600 mb-2">$275<span className="text-sm text-gray-600">/year</span></p>
                                <p className="text-sm text-gray-600 mb-4">Pay once per year (2 payments total)</p>
                                <Button
                                  onClick={() => handlePayment(enrollment, 'annual')}
                                  disabled={processingPayment === enrollment.id}
                                  fullWidth
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  {processingPayment === enrollment.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <DollarSign className="h-5 w-5 mr-2" />
                                      Pay $275/year
                                    </>
                                  )}
                                </Button>
                              </div>
                            </>
                          )}

                          {isTajweed && (
                            <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <DollarSign className="h-5 w-5 text-purple-600" />
                                <h4 className="font-semibold text-gray-900">One-time Payment</h4>
                              </div>
                              <p className="text-3xl font-bold text-purple-600 mb-2">$120</p>
                              <p className="text-sm text-gray-600 mb-4">Complete program payment</p>
                              <Button
                                onClick={() => handlePayment(enrollment, 'one-time')}
                                disabled={processingPayment === enrollment.id}
                                fullWidth
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                {processingPayment === enrollment.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-5 w-5 mr-2" />
                                    Pay $120
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900">
                            <strong>Note:</strong> All payments are processed securely through Stripe. You will receive your student ID after your first payment.
                          </p>
                        </div>
                      </div>
                    )}

                    {!hasPendingPayment && enrollment.status === 'active' && (
                      <div className="border-t pt-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-green-900">Payment Complete!</p>
                            <p className="text-sm text-green-700">Your enrollment is fully paid. Keep up the great work!</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Class Schedule (if available) */}
          {schedules.length > 0 && (
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Class Schedule</h2>
              <p className="text-sm text-gray-600 mb-4">
                Your personalized class schedule will be available here after enrollment confirmation.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
