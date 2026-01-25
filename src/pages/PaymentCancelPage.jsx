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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/favicon.svg"
                alt="The FastTrack Madrasah"
                className="h-9 w-9 transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col leading-tight -space-y-0.5">
                <span className="text-base font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-base font-semibold text-emerald-600" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12">
          {/* Error Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
              <XCircle className="h-11 w-11 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Payment Not Completed
            </h1>
            <p className="text-base text-gray-600">
              Your payment for <span className="font-semibold text-gray-900">{programName}</span> was cancelled or could not be processed.
            </p>
          </div>

          {/* Common Reasons */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200/60 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Common reasons for payment failure:</h3>
            <ul className="space-y-2.5 text-sm text-gray-700">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold mt-0.5">•</span>
                <span>Insufficient funds in your account</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold mt-0.5">•</span>
                <span>Card declined by your bank</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold mt-0.5">•</span>
                <span>Incorrect card details or CVV</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold mt-0.5">•</span>
                <span>Payment was manually cancelled</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/payment?email=${email}&program=${program}`)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              <CreditCard className="h-5 w-5" />
              Try Payment Again
            </button>
            
            <Link to="/student" className="block">
              <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 transition-all">
                <ArrowLeft className="h-5 w-5" />
                Go to Student Portal
              </button>
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 font-medium">Need help with your payment?</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <a 
                href="mailto:salam@tftmadrasah.nz" 
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                salam@tftmadrasah.nz
              </a>
              <span className="text-gray-300">|</span>
              <a 
                href="https://wa.me/64224653509" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
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
