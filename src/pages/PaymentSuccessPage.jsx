import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, ArrowRight, BookOpen } from 'lucide-react';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const program = searchParams.get('program') || 'essentials';
  const [loading, setLoading] = useState(true);

  const isTajweed = program === 'tajweed';
  const programName = isTajweed ? 'Tajweed Program' : '2-Year Essential Islamic Studies Course';

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-3">
                <BookOpen className="text-emerald-600" size={28} strokeWidth={2.5} />
                <div className="flex flex-col">
                  <span className="text-base font-brand font-bold text-gray-900 leading-tight">
                    The FastTrack Madrasah
                  </span>
                  <span className="text-xs text-gray-600 leading-tight">
                    Essential Islamic Studies
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Confirming your enrollment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <BookOpen className="text-emerald-600" size={28} strokeWidth={2.5} />
              <div className="flex flex-col">
                <span className="text-base font-brand font-bold text-gray-900 leading-tight">
                  The FastTrack Madrasah
                </span>
                <span className="text-xs text-gray-600 leading-tight">
                  Essential Islamic Studies
                </span>
              </div>
            </Link>
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full">
          {/* Success Indicator */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" strokeWidth={2} />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-brand font-bold text-gray-900 mb-3">
              Payment Confirmed
            </h1>
            <p className="text-lg text-gray-600">
              Welcome to The FastTrack Madrasah
            </p>
          </div>

          {/* Enrollment Details */}
          <div className="bg-gray-50 rounded-lg p-8 mb-8">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Program Enrollment
            </h2>
            <p className="text-xl font-semibold text-gray-900 mb-6">
              {programName}
            </p>

            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed">
                Assalaamu 'alaykum. Your payment has been processed successfully.
                You will receive a welcome email within the next few minutes containing:
              </p>

              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">•</span>
                  <span>Student ID and portal access credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">•</span>
                  <span>Course schedule and program overview</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">•</span>
                  <span>Next steps to begin your studies</span>
                </li>
              </ul>

              <p className="text-sm text-gray-600 pt-4 border-t border-gray-200">
                If you don't receive the email within 10 minutes, please check your spam folder
                or contact us at <a href="mailto:admin@tftmadrasah.nz" className="text-emerald-600 hover:text-emerald-700 font-medium">admin@tftmadrasah.nz</a>
              </p>
            </div>
          </div>

          {/* Reference Number */}
          {sessionId && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
              <p className="text-xs text-gray-500 mb-1">Payment Reference</p>
              <p className="font-mono text-sm text-gray-700">{sessionId}</p>
            </div>
          )}

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Return to Home
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} The FastTrack Madrasah. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PaymentSuccessPage;
