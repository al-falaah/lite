import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import { toast } from 'sonner';
import { GraduationCap, User, Mail, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { PROGRAMS, PROGRAM_IDS, getAllPrograms } from '../config/programs';

const EnrollAdditionalProgram = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [paymentType, setPaymentType] = useState('monthly');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Get available programs from centralized config
  const availablePrograms = getAllPrograms();

  useEffect(() => {
    if (!email) {
      toast.error('Email parameter is required');
      navigate('/apply');
      return;
    }
    loadStudentData();
  }, [email]);

  const loadStudentData = async () => {
    let progressInterval;
    try {
      setLoading(true);
      setLoadingProgress(0);

      // Simulate progress
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) return 100;
          if (prev >= 90) return prev;
          return Math.min(prev + Math.random() * 15, 100);
        });
      }, 300);

      // Helper to add timeout to promises
      const withTimeout = (promise, ms, errorMessage) => {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(errorMessage)), ms)
        );
        return Promise.race([promise, timeout]);
      };

      // Get student by email (with 15s timeout)
      const { data: studentData, error: studentError } = await withTimeout(
        supabase
          .from('students')
          .select('*')
          .eq('email', email.toLowerCase().trim())
          .single(),
        15000,
        'Student lookup timed out. Please check your connection and try again.'
      );

      if (studentError || !studentData) {
        toast.error('Student not found. Please use the regular application form.');
        navigate('/apply');
        return;
      }

      setStudent(studentData);

      // Get existing enrollments (with 15s timeout)
      const { data: enrollmentsData, error: enrollmentsError } = await withTimeout(
        supabase
          .from('enrollments')
          .select('program, status')
          .eq('student_id', studentData.id),
        15000,
        'Enrollment lookup timed out. Please check your connection and try again.'
      );

      if (enrollmentsError) throw enrollmentsError;
      setEnrollments(enrollmentsData || []);

      // Check if student is already enrolled in all programs
      const enrolledPrograms = enrollmentsData?.map(e => e.program) || [];
      const unenrolledPrograms = availablePrograms.filter(p => !enrolledPrograms.includes(p.id));

      if (unenrolledPrograms.length === 0) {
        toast.error('You are already enrolled in all available programs!');
        navigate('/student');
        return;
      }

      // Auto-select first available program
      setSelectedProgram(unenrolledPrograms[0].id);
      if (unenrolledPrograms[0].id === PROGRAM_IDS.TAJWEED) {
        setPaymentType('oneTime');
      }

    } catch (error) {
      console.error('Error loading student data:', error);
      // Show specific error message if it's a timeout
      if (error.message?.includes('timed out')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to load student data. Please try again.');
      }
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoading(false);
    }
  };

  const handleProgramChange = (programId) => {
    setSelectedProgram(programId);
    const program = PROGRAMS[programId];
    if (program?.pricing.type === 'one-time') {
      setPaymentType('oneTime');
    } else {
      setPaymentType('monthly');
    }
  };

  const handleEnroll = async () => {
    if (!selectedProgram) {
      toast.error('Please select a program');
      return;
    }

    setProcessingPayment(true);

    try {
      const program = PROGRAMS[selectedProgram];
      let amount;

      if (program?.pricing.type === 'one-time') {
        amount = program.pricing.oneTimeCents;
      } else if (paymentType === 'monthly') {
        amount = program.pricing.monthlyCents;
      } else {
        amount = program.pricing.annualCents;
      }

      // Create Stripe checkout session
      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: student.email,
            planType: paymentType,
            program: selectedProgram, // Pass program to webhook
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkout_url || data.url;

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment');
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 inline-block">
            <svg className="w-24 h-24" viewBox="0 0 80 80">
              <circle
                className="text-gray-200"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
                r="34"
                cx="40"
                cy="40"
              />
              <circle
                className="text-emerald-600"
                strokeWidth="6"
                strokeDasharray={213.628}
                strokeDashoffset={213.628 - (213.628 * loadingProgress) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="34"
                cx="40"
                cy="40"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-700">
                {Math.round(loadingProgress)}%
              </span>
            </div>
          </div>
          <p className="mt-4 text-gray-600">
            {loadingProgress < 30 && 'Connecting...'}
            {loadingProgress >= 30 && loadingProgress < 60 && 'Loading student information...'}
            {loadingProgress >= 60 && loadingProgress < 90 && 'Processing...'}
            {loadingProgress >= 90 && 'Almost there...'}
          </p>
        </div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  const enrolledPrograms = enrollments.map(e => e.program);
  const unenrolledPrograms = availablePrograms.filter(p => !enrolledPrograms.includes(p.id));
  const selectedProgramDetails = availablePrograms.find(p => p.id === selectedProgram);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Enroll in Additional Program
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back! Add another program to your learning journey
          </p>
        </div>

        {/* Student Information (Read-Only) */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                  {student.full_name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                  {student.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                  {student.phone || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                  {student.student_id}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              Your information is locked for security. Contact support if you need to update it.
            </p>
          </div>
        </Card>

        {/* Current Enrollments */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Current Enrollments
            </h2>

            {enrollments.length > 0 ? (
              <div className="space-y-2">
                {enrollments.map((enrollment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="font-medium text-gray-900">
                      {availablePrograms.find(p => p.id === enrollment.program)?.name}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      enrollment.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {enrollment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No active enrollments</p>
            )}
          </div>
        </Card>

        {/* Program Selection */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select New Program
            </h2>

            <div className="space-y-4">
              {unenrolledPrograms.map((program) => (
                <div
                  key={program.id}
                  onClick={() => handleProgramChange(program.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedProgram === program.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{program.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Duration: {program.duration.display}</p>

                      {program.pricing.type === 'subscription' && (
                        <div className="mt-3 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`payment-${program.id}`}
                              value="monthly"
                              checked={selectedProgram === program.id && paymentType === 'monthly'}
                              onChange={() => setPaymentType('monthly')}
                              className="text-emerald-600"
                            />
                            <span className="text-sm">Monthly: ${program.pricing.monthly}/month</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`payment-${program.id}`}
                              value="annual"
                              checked={selectedProgram === program.id && paymentType === 'annual'}
                              onChange={() => setPaymentType('annual')}
                              className="text-emerald-600"
                            />
                            <span className="text-sm">Annual: ${program.pricing.annual}/year</span>
                          </label>
                        </div>
                      )}

                      {program.pricing.type === 'one-time' && (
                        <p className="text-sm text-gray-600 mt-2">
                          One-time payment: ${program.pricing.oneTime}
                        </p>
                      )}
                    </div>

                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedProgram === program.id
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedProgram === program.id && (
                        <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Payment Summary */}
        {selectedProgramDetails && (
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Program:</span>
                  <span className="font-medium">{selectedProgramDetails.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Plan:</span>
                  <span className="font-medium capitalize">{paymentType}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Amount Due Today:</span>
                  <span className="text-emerald-600">
                    ${selectedProgramDetails?.pricing.type === 'one-time'
                      ? selectedProgramDetails.pricing.oneTime
                      : paymentType === 'monthly'
                        ? selectedProgramDetails?.pricing.monthly
                        : selectedProgramDetails?.pricing.annual
                    }
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/student')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={!selectedProgram || processingPayment}
            className="flex-1"
          >
            {processingPayment ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnrollAdditionalProgram;
