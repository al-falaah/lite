import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const program = searchParams.get('program') || 'essentials';
  const [loading, setLoading] = useState(true);

  const isTajweed = program === 'tajweed';
  const programName = isTajweed ? 'Tajweed Program' : '2-Year Essential Islamic Studies Course';
  const programDuration = isTajweed ? '6 months' : '2 years';

  useEffect(() => {
    // Simulate verification delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Processing your payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your enrollment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-emerald-50 text-lg">Welcome to Al-Falaah Academy</p>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">🎉 Enrollment Confirmed</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Assalaamu 'alaykum! Your payment has been processed successfully and you are now enrolled in the
                <strong> {programName}</strong>.
              </p>
            </div>

            {/* What's Next Section */}
            <div className="bg-emerald-50 border-l-4 border-emerald-600 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-emerald-900 mb-3">📧 What happens next?</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>You will receive a <strong>welcome email</strong> within the next few minutes with your student details</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>Your student ID and course access information will be included</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>Check your spam folder if you don't see the email in your inbox</span>
                </li>
                {!isTajweed && (
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2">✓</span>
                    <span>For monthly subscribers: Payments will auto-renew on the same date each month</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Support Section */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">💬 Need Help?</h3>
              <p className="text-gray-700">
                If you have any questions or don't receive your welcome email within 10 minutes,
                please contact us at{' '}
                <a
                  href="mailto:admin@alfalaah-academy.nz"
                  className="text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  admin@alfalaah-academy.nz
                </a>
              </p>
              {sessionId && (
                <p className="text-sm text-gray-500 mt-3">
                  Payment Reference: {sessionId}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors duration-200 shadow-md"
              >
                Return to Home
              </Link>
              <a
                href="mailto:admin@alfalaah-academy.nz"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-emerald-600 font-semibold rounded-lg border-2 border-emerald-600 hover:bg-emerald-50 transition-colors duration-200"
              >
                Contact Support
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 text-center border-t">
            <p className="text-sm text-gray-600">
              Thank you for choosing Al-Falaah Academy. We look forward to supporting your Islamic education journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
