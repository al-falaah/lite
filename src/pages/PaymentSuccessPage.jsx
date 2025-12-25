import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, Mail, ArrowRight } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 flex flex-col">
        {/* Header */}
        <nav className="bg-white shadow-sm border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 md:h-16">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/favicon.svg"
                  alt="Al-Falaah Logo"
                  className="h-8 w-8 md:h-10 md:w-10"
                />
                <div className="flex flex-col leading-none -space-y-1">
                  <span className="text-sm md:text-base font-semibold text-emerald-600" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                  <span className="text-sm md:text-base font-semibold text-emerald-600" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                </div>
              </Link>
            </div>
          </div>
        </nav>

        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Processing your payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your enrollment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 flex flex-col">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/favicon.svg"
                alt="Al-Falaah Logo"
                className="h-8 w-8 md:h-10 md:w-10"
              />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-sm md:text-base font-semibold text-emerald-600" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-sm md:text-base font-semibold text-emerald-600" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            <Link to="/">
              <button className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors rounded-lg hover:bg-emerald-50">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-lg">
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Payment Successful!</h1>
              <p className="text-emerald-50 text-lg">Welcome to The FastTrack Madrasah</p>
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
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-emerald-900">What happens next?</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>You will receive a <strong>welcome email</strong> within the next few minutes with your student details</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Your student ID and course access information will be included</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Check your spam folder if you don't see the email in your inbox</span>
                </li>
                {!isTajweed && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>For monthly subscribers: Payments will auto-renew on the same date each month</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Support Section */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h3>
              <p className="text-gray-700 mb-3">
                If you have any questions or don't receive your welcome email within 10 minutes,
                please contact us at{' '}
                <a
                  href="mailto:admin@tftmadrasah.nz"
                  className="text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  admin@tftmadrasah.nz
                </a>
              </p>
              {sessionId && (
                <p className="text-sm text-gray-500 font-mono bg-white px-3 py-2 rounded border border-blue-200">
                  Payment Reference: {sessionId}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Return to Home
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="mailto:admin@tftmadrasah.nz"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-emerald-600 font-semibold rounded-lg border-2 border-emerald-600 hover:bg-emerald-50 transition-all duration-200"
              >
                <Mail className="h-5 w-5" />
                Contact Support
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 text-center border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Thank you for choosing The FastTrack Madrasah. We look forward to supporting your Islamic education journey.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Authentic Islamic Education Rooted in the Qur'an and Sunnah
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} The FastTrack Madrasah. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentSuccessPage;
