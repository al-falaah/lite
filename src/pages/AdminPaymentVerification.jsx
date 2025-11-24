import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Building2,
  Calendar,
  User,
  Hash,
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { payments, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const AdminPaymentVerification = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await payments.getPendingVerification();

      if (error) {
        console.error('Error loading pending payments:', error);
        toast.error('Failed to load pending payments');
        return;
      }

      setPendingPayments(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred loading payments');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (payment) => {
    setSelectedPayment(payment);
    setAdminNotes('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
    setAdminNotes('');
  };

  const handleVerify = async () => {
    if (!selectedPayment) return;

    try {
      setProcessing(true);

      const { error } = await payments.verifyPayment(
        selectedPayment.id,
        user.id,
        adminNotes || null
      );

      if (error) {
        console.error('Error verifying payment:', error);
        toast.error('Failed to verify payment');
        return;
      }

      // Send verification email to student
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/send-payment-verified-email`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentId: selectedPayment.id }),
          }
        );

        if (!response.ok) {
          console.error('Failed to send verification email');
          toast.warning('Payment verified but email notification failed');
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast.success('Payment verified successfully!');
      closeModal();
      await loadPendingPayments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred during verification');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;

    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);

      const { error } = await payments.rejectPayment(
        selectedPayment.id,
        adminNotes
      );

      if (error) {
        console.error('Error rejecting payment:', error);
        toast.error('Failed to reject payment');
        return;
      }

      toast.success('Payment rejected. Student has been notified.');
      closeModal();
      await loadPendingPayments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred during rejection');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Verification</h2>
          <p className="text-gray-600 mt-1">
            Review and verify manual bank transfer payments
          </p>
        </div>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
          {pendingPayments.length} Pending
        </div>
      </div>

      {pendingPayments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              All caught up!
            </h3>
            <p className="text-gray-600">
              There are no payments pending verification at the moment.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {payment.students?.full_name || 'Unknown Student'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {payment.students?.student_id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Amount
                      </p>
                      <p className="font-semibold text-emerald-600">
                        ${payment.amount.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        Academic Year
                      </p>
                      <p className="font-semibold">
                        Year {payment.academic_year}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due Date
                      </p>
                      <p className="font-semibold">
                        {new Date(payment.due_date).toLocaleDateString('en-NZ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <AlertCircle className="h-4 w-4" />
                    Submitted {formatDate(payment.updated_at)}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:w-32">
                  <Button
                    size="sm"
                    onClick={() => openModal(payment)}
                    fullWidth
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Verify Payment
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Student Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-semibold">
                      {selectedPayment.students?.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Student ID</p>
                    <p className="font-semibold">
                      {selectedPayment.students?.student_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold">
                      {selectedPayment.students?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold">
                      {selectedPayment.students?.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-emerald-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Amount</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      ${selectedPayment.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Academic Year</p>
                    <p className="font-semibold">
                      Year {selectedPayment.academic_year}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-semibold">
                      {new Date(selectedPayment.due_date).toLocaleDateString('en-NZ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Submitted</p>
                    <p className="font-semibold">
                      {formatDate(selectedPayment.created_at)}
                    </p>
                  </div>
                </div>
                {selectedPayment.student_notes && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <p className="text-gray-600 text-sm mb-1">Student Notes:</p>
                    <p className="text-gray-900 text-sm">{selectedPayment.student_notes}</p>
                  </div>
                )}
              </div>

              {/* Proof of Payment */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Proof of Payment
                </h3>
                {selectedPayment.proof_of_payment_url ? (
                  <div className="border rounded-lg p-4">
                    {selectedPayment.proof_of_payment_url.toLowerCase().endsWith('.pdf') ? (
                      <div className="text-center py-8">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">PDF Document</p>
                        <a
                          href={selectedPayment.proof_of_payment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 font-semibold"
                        >
                          Open PDF in new tab
                        </a>
                      </div>
                    ) : (
                      <a
                        href={selectedPayment.proof_of_payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={selectedPayment.proof_of_payment_url}
                          alt="Proof of payment"
                          className="max-w-full h-auto rounded-lg"
                        />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No proof uploaded</p>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional for approval, Required for rejection)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Add any notes about this payment verification..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleVerify}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Payment
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleReject}
                  disabled={processing}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Payment
                    </>
                  )}
                </Button>

                <Button onClick={closeModal} variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentVerification;
