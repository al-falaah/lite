import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, CreditCard, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { PROGRAMS, PROGRAM_IDS } from '../config/programs';

const StripePaymentPage = () => {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email');
  const programFromUrl = searchParams.get('program') || PROGRAM_IDS.ESSENTIALS; // Default to essentials

  console.log('StripePaymentPage loaded with params:', {
    email: emailFromUrl,
    program: searchParams.get('program'),
    programFromUrl: programFromUrl,
    allParams: Object.fromEntries(searchParams.entries())
  });

  const [email, setEmail] = useState(emailFromUrl || '');
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const programConfig = PROGRAMS[programFromUrl];
  const isOneTimePayment = programConfig?.pricing.type === 'one-time';
  const programName = programConfig?.name || 'Program';
  const programDuration = programConfig?.duration.display || '1 year';

  const handlePayment = async (planType) => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setSelectedPlan(planType);

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
            email,
            planType,
            program: programFromUrl, // Pass program to backend
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
      setLoading(false);
      setSelectedPlan('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            {isOneTimePayment ? 'Complete Your Payment' : 'Choose Your Payment Plan'}
          </h1>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            {isOneTimePayment ? `${programName} - ${programDuration}` : 'Select the payment option that works best for you'}
          </p>
        </div>

        {/* Email Input */}
        {!emailFromUrl && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-10 shadow-sm">
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Email Address
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Enter the email address you used for your application
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
            />
          </div>
        )}

        {/* Payment Plans */}
        {isOneTimePayment ? (
          /* One-time payment (QARI, Tajweed) */
          <div className="max-w-md mx-auto mb-10">
            <div className="bg-white border-2 border-emerald-600 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="text-center">
                <div className="mb-6">
                  <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">{programConfig?.shortName || programConfig?.name} Program</div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-gray-900">${programConfig?.pricing.oneTime || 300}</span>
                    <span className="text-gray-500 text-lg">one-time</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-8 text-base">
                  Complete {programConfig?.duration.display || '1-year'} {programConfig?.name || 'Program'}
                </p>
                <ul className="text-left space-y-3 mb-8 border-t border-gray-100 pt-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-relaxed">One-time payment for full course</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-relaxed">{programConfig?.duration.display || '1 year'} of comprehensive training</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-relaxed">Certificate upon completion</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handlePayment('oneTime')}
                  disabled={loading}
                  fullWidth
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay ${programConfig?.pricing.oneTime || 300} Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Essentials: Monthly or Annual plans */
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Monthly Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-emerald-500 hover:shadow-lg transition-all">
              <div className="text-center">
                <div className="mb-6">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Monthly Plan</div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">${programConfig?.pricing.monthly || 35}</span>
                    <span className="text-gray-500 text-lg">/month</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-8 text-sm">
                  Pay monthly and spread the cost over {programConfig?.duration.display || '2 years'}
                </p>
                <ul className="text-left space-y-3 mb-8 border-t border-gray-100 pt-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-relaxed">Auto-renewing monthly subscription</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-relaxed">Cancel anytime (non-refundable)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-relaxed">Total: ${(programConfig?.pricing.monthly || 35) * (programConfig?.duration.months || 24)} over {programConfig?.duration.months || 24} months</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handlePayment('monthly')}
                  disabled={loading}
                  fullWidth
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading && selectedPlan === 'monthly' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay ${programConfig?.pricing.monthly || 35}/month
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Annual Plan */}
            <div className="bg-white border-2 border-emerald-600 rounded-2xl p-8 hover:shadow-lg transition-all relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
                Save ${((programConfig?.pricing.monthly || 35) * 12) - (programConfig?.pricing.annual || 375)}
              </div>
              <div className="text-center">
                <div className="mb-6 pt-2">
                  <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Annual Plan</div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">${programConfig?.pricing.annual || 375}</span>
                    <span className="text-gray-500 text-lg">/year</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-8 text-sm">
                  Pay once per year and save money
                </p>
                <ul className="text-left space-y-3 mb-8 border-t border-gray-100 pt-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-relaxed">One-time annual payment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-relaxed">Pay for 2nd year next academic year</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-relaxed">Total: ${(programConfig?.pricing.annual || 375) * (programConfig?.duration.years || 2)} over {programConfig?.duration.display || '2 years'} (save ${(((programConfig?.pricing.monthly || 35) * 12) - (programConfig?.pricing.annual || 375)) * (programConfig?.duration.years || 2)}!)</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handlePayment('annual')}
                  disabled={loading}
                  fullWidth
                >
                  {loading && selectedPlan === 'annual' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-5 w-5 mr-2" />
                      Pay ${programConfig?.pricing.annual || 375}/year
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl p-6 shadow-sm">
          <p className="font-semibold mb-4 text-emerald-900 text-sm">Important Information:</p>
          <ul className="space-y-3 text-sm text-emerald-900/90">
            <li className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">All payments are processed securely through Stripe</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">You will be enrolled immediately after your first payment</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">You'll receive a welcome email with your student dashboard access</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">Monthly subscriptions can be cancelled anytime (non-refundable)</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">For questions, contact us at <a href="mailto:admin@tftmadrasah.nz" className="font-semibold text-emerald-700 hover:text-emerald-800 underline decoration-2 underline-offset-2">admin@tftmadrasah.nz</a></span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} The FastTrack Madrasah. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default StripePaymentPage;
