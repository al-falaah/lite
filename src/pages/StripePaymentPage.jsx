import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, CreditCard, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const StripePaymentPage = () => {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email');
  const programFromUrl = searchParams.get('program') || 'essentials'; // Default to essentials

  const [email, setEmail] = useState(emailFromUrl || '');
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const isTajweed = programFromUrl === 'tajweed';
  const programName = isTajweed ? 'Tajweed Program' : 'Essential Islamic Studies Course';
  const programDuration = isTajweed ? '6 months' : '2 years';

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <CreditCard className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isTajweed ? 'Complete Your Payment' : 'Choose Your Payment Plan'}
          </h1>
          <p className="text-lg text-gray-600">
            {isTajweed ? `${programName} - ${programDuration}` : 'Select the payment option that works best for you'}
          </p>
        </div>

        {/* Email Input */}
        {!emailFromUrl && (
          <Card className="mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Enter the email address you used for your application
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </Card>
        )}

        {/* Payment Plans */}
        {isTajweed ? (
          /* Tajweed: Single $120 payment */
          <div className="max-w-md mx-auto mb-8">
            <Card className="hover:shadow-xl transition-shadow border-2 border-purple-500">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Tajweed Program</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-purple-600">$120</span>
                  <span className="text-gray-600"> one-time</span>
                </div>
                <p className="text-gray-600 mb-6">
                  Complete 6-month Tajweed Mastery Course
                </p>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">One-time payment for full course</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">6 months of intensive Tajweed training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Certificate upon completion</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handlePayment('oneTime')}
                  disabled={loading}
                  fullWidth
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay $120
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          /* Essentials: Monthly or Annual plans */
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Monthly Plan */}
            <Card className="hover:shadow-xl transition-shadow border-2 hover:border-emerald-500">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Plan</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-emerald-600">$25</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 mb-6">
                  Pay monthly and spread the cost over 2 years
                </p>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Auto-renewing monthly subscription</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Cancel anytime (non-refundable)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Total: $600 over 24 months</span>
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
                      Pay $25/month
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Annual Plan */}
            <Card className="hover:shadow-xl transition-shadow border-2 hover:border-emerald-500 relative">
              <div className="absolute -top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Save $25!
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-4">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Annual Plan</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-emerald-600">$275</span>
                  <span className="text-gray-600">/year</span>
                </div>
                <p className="text-gray-600 mb-6">
                  Pay once per year and save money
                </p>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">One-time annual payment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Pay for 2nd year next academic year</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Total: $550 over 2 years (save $50!)</span>
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
                      Pay $275/year
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Info Section */}
        <Card className="bg-emerald-50 border-emerald-200">
          <div className="text-sm text-emerald-900">
            <p className="font-semibold mb-3 text-emerald-800">Important Information:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>All payments are processed securely through Stripe</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>You will be enrolled immediately after your first payment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>You'll receive a welcome email with your student dashboard access</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Monthly subscriptions can be cancelled anytime (non-refundable)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>For questions, contact us at <a href="mailto:admin@tftmadrasah.nz" className="font-medium text-emerald-700 hover:text-emerald-800 underline">admin@tftmadrasah.nz</a></span>
              </li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} The FastTrack Madrasah. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Authentic Islamic Education Rooted in the Qur'an and Sunnah
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StripePaymentPage;
