import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Upload, CheckCircle, Search, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const PaymentUploadPage = () => {
  const [step, setStep] = useState(1); // 1 = lookup, 2 = upload
  const [lookupValue, setLookupValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [uploadAmount, setUploadAmount] = useState('');
  const [academicYear, setAcademicYear] = useState(1);
  const [uploading, setUploading] = useState(false);

  // Smart detection: determine what type of input the user entered
  const detectLookupType = (value) => {
    const trimmed = value.trim();

    // Check if it's an email
    if (trimmed.includes('@')) {
      return 'email';
    }

    // Check if it's a student ID (6-digit numeric)
    if (/^\d{6}$/.test(trimmed)) {
      return 'student_id';
    }

    // Check if it's a phone number (contains only digits, spaces, +, -, () but NOT exactly 6 digits)
    if (/^[\d\s\+\-\(\)]+$/.test(trimmed) && !/^\d{6}$/.test(trimmed)) {
      return 'phone';
    }

    // Default to email if can't determine
    return 'email';
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupValue.trim()) {
      toast.error('Please enter your email, phone, student ID, or name');
      return;
    }

    setLoading(true);
    try {
      const lookupType = detectLookupType(lookupValue);
      let studentData = null;

      if (lookupType === 'email') {
        // Search by email (exact match only)
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('email', lookupValue.trim().toLowerCase())
          .single();

        if (error || !data) {
          toast.error('No student found. Please check your email and try again.');
          return;
        }

        studentData = data;
      } else if (lookupType === 'student_id') {
        // Search by student ID (exact match only)
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', lookupValue.trim().toUpperCase())
          .single();

        if (error || !data) {
          toast.error('No student found. Please check your student ID and try again.');
          return;
        }

        studentData = data;
      } else if (lookupType === 'phone') {
        // Search by phone (exact match, digits only)
        const phoneDigits = lookupValue.replace(/\D/g, '');

        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('phone', phoneDigits)
          .single();

        if (error || !data) {
          toast.error('No student found. Please check your phone number and try again.');
          return;
        }

        studentData = data;
      }

      setStudent(studentData);

      // Load pending payments for this student
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });

      if (paymentsError) {
        console.error('Error loading payments:', paymentsError);
      }

      setPendingPayments(payments || []);
      setStep(2);
      toast.success(`Welcome, ${studentData.full_name}! You can now upload your payment proof.`);
    } catch (error) {
      console.error('Lookup error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a JPG, PNG, or PDF file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    const amount = parseFloat(uploadAmount);
    if (!uploadAmount || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    // Check if student has any balance remaining
    const remainingBalance = calculateOutstanding();
    if (remainingBalance <= 0) {
      toast.error('You have no outstanding balance. All payments have been completed.');
      return;
    }

    // Check if amount exceeds remaining balance
    if (amount > remainingBalance) {
      toast.error('Payment amount exceeds your remaining balance. Please enter a lower amount.');
      return;
    }

    setUploading(true);
    try {
      // Use Edge Function for server-side validation
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('student_id', student.id);
      formData.append('amount', uploadAmount);
      formData.append('academic_year', academicYear.toString());
      formData.append('student_notes', paymentNotes.trim());

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/validate-payment-upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token || supabaseAnonKey}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.details
          ? `${result.error}\n\nDetails: ${result.details}`
          : result.error || 'Failed to upload payment proof';
        toast.error(errorMsg);
        console.error('Upload error:', result);
        return;
      }

      // Success!
      toast.success('Payment proof submitted successfully! You will be notified once verified.');

      // Reset form
      setSelectedFile(null);
      setPaymentNotes('');
      setUploadAmount('');
      setAcademicYear(1);
      setStep(1);
      setStudent(null);
      setLookupValue('');
      setPendingPayments([]);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const calculateOutstanding = () => {
    if (!student) return 0;
    return student.balance_remaining || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-emerald-600" />
              <span className="text-xl font-bold text-emerald-600">Al-Falaah</span>
            </Link>
            <Link to="/">
              <Button variant="secondary" size="sm">Back to Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Submit Payment Proof</h1>
          <p className="text-lg text-gray-600">
            Upload your bank transfer receipt for verification
          </p>
        </div>

        {/* Step 1: Student Lookup */}
        {step === 1 && (
          <Card>
            <form onSubmit={handleLookup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Find your student record
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Enter your email, phone number, or student ID
                </p>
                <input
                  type="text"
                  value={lookupValue}
                  onChange={(e) => setLookupValue(e.target.value)}
                  placeholder="e.g., student@example.com or 123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-2">
                  Exact match required for security
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Find Student
                  </>
                )}
              </Button>
            </form>
          </Card>
        )}

        {/* Step 2: Upload Payment Proof */}
        {step === 2 && student && (
          <div className="space-y-6">
            {/* Student Info */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {student.full_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Student ID: {student.student_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: {student.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStep(1);
                    setStudent(null);
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Change Student
                </button>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">
                  Please upload your payment proof below. Your payment will be verified by the admin.
                </p>
              </div>
            </Card>

            {/* Upload Form */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Upload Payment Proof</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={uploadAmount}
                      onChange={(e) => setUploadAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year *
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Notes (Optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="E.g., Bank reference number, transaction ID, or any other notes"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Proof of Payment *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      required
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      {selectedFile ? (
                        <p className="text-emerald-600 font-medium">{selectedFile.name}</p>
                      ) : (
                        <>
                          <p className="text-gray-600 font-medium">Click to upload file</p>
                          <p className="text-sm text-gray-500 mt-1">JPG, PNG, or PDF (max 5MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {student.status === 'pending_payment' && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900">
                      <p className="font-bold mb-1">⚠️ Minimum First Payment Required</p>
                      <p>A minimum of <strong>$75 NZD</strong> is required to activate your enrollment. You can make multiple payments until you reach $75.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Please ensure:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>The payment amount matches your upload</li>
                        <li>Transaction reference is visible in the proof</li>
                        <li>The document is clear and readable</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Submit Payment Proof
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentUploadPage;
