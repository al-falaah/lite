import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import { toast } from 'sonner';
import { GraduationCap, User, Mail, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const EnrollAdditionalProgram = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [paymentType, setPaymentType] = useState('monthly');
  const [processingPayment, setProcessingPayment] = useState(false);

  const availablePrograms = [
    { id: 'essentials', name: 'Islamic Essentials', duration: '24 months', price: { monthly: 25, annual: 275 } },
    { id: 'tajweed', name: 'Tajweed Mastery', duration: '6 months', price: { oneTime: 120 } },
  ];

  useEffect(() => {
    if (!email) {
      toast.error('Email parameter is required');
      navigate('/apply');
      return;
    }
    loadStudentData();
  }, [email]);

  const loadStudentData = async () => {
    try {
      setLoading(true);

      // Get student by email
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (studentError || !studentData) {
        toast.error('Student not found. Please use the regular application form.');
        navigate('/apply');
        return;
      }

      setStudent(studentData);

      // Get existing enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('program, status')
        .eq('student_id', studentData.id);

      if (enrollmentsError) throw enrollmentsError;
      setEnrollments(enrollmentsData || []);

      // Check if student is already enrolled in all programs
      const enrolledPrograms = enrollmentsData?.map(e => e.program) || [];
      const unenrolledPrograms = availablePrograms.filter(p => !enrolledPrograms.includes(p.id));

      if (unenrolledPrograms.length === 0) {
        toast.error('You are already enrolled in all available programs!');
        navigate('/student-portal');
        return;
      }

      // Auto-select first available program
      setSelectedProgram(unenrolledPrograms[0].id);
      if (unenrolledPrograms[0].id === 'tajweed') {
        setPaymentType('oneTime');
      }

    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handleProgramChange = (programId) => {
    setSelectedProgram(programId);
    if (programId === 'tajweed') {
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
      const program = availablePrograms.find(p => p.id === selectedProgram);
      let amount;

      if (selectedProgram === 'tajweed') {
        amount = program.price.oneTime * 100; // $120 in cents
      } else if (paymentType === 'monthly') {
        amount = program.price.monthly * 100; // $25 in cents
      } else {
        amount = program.price.annual * 100; // $275 in cents
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
            studentId: student.id,
            studentEmail: student.email,
            studentName: student.full_name,
            amount: amount,
            planType: paymentType,
            program: selectedProgram, // Pass program to webhook
            successUrl: `${window.location.origin}/student-portal`,
            cancelUrl: `${window.location.origin}/enroll-additional?email=${student.email}`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student information...</p>
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
                      <p className="text-sm text-gray-600 mt-1">Duration: {program.duration}</p>

                      {program.id === 'essentials' && (
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
                            <span className="text-sm">Monthly: ${program.price.monthly}/month</span>
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
                            <span className="text-sm">Annual: ${program.price.annual}/year</span>
                          </label>
                        </div>
                      )}

                      {program.id === 'tajweed' && (
                        <p className="text-sm text-gray-600 mt-2">
                          One-time payment: ${program.price.oneTime}
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
                    ${selectedProgram === 'tajweed'
                      ? selectedProgramDetails.price.oneTime
                      : paymentType === 'monthly'
                        ? selectedProgramDetails.price.monthly
                        : selectedProgramDetails.price.annual
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
            onClick={() => navigate('/student-portal')}
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
