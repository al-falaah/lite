import { useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';
import { toast } from 'sonner';

const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const program = searchParams.get('program') || PROGRAM_IDS.ESSENTIALS;
  const email = searchParams.get('email');

  const programConfig = PROGRAMS[program];
  const programName = programConfig?.name || 'Program';

  useEffect(() => {
    // Show toast notification about payment cancellation
    toast.error('Payment was not completed', {
      description: 'Your payment was cancelled or failed. Please try again.',
      duration: 5000,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/30">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/favicon.svg"
                alt="The FastTrack Madrasah"
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>

          {/* Main Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Payment Not Completed
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your payment for <span className="font-semibold text-gray-900">{programName}</span> was cancelled or could not be processed.
          </p>

          {/* Common Reasons */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Common reasons for payment failure:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Insufficient funds in your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Card declined by your bank</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Incorrect card details or CVV</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Payment was manually cancelled</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => navigate(`/payment?email=${email}&program=${program}`)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              <CreditCard className="h-5 w-5" />
              Try Payment Again
            </button>
            
            <Link to="/student">
              <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                Go to Student Portal
              </button>
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Need help with your payment?</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <a 
                href="mailto:salam@tftmadrasah.nz" 
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Email: salam@tftmadrasah.nz
              </a>
              <span className="text-gray-300">|</span>
              <a 
                href="https://wa.me/64224653509" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                WhatsApp: +64 22 465 3509
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
