import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Failed to send reset email');

      setEmailSent(true);
      toast.success('Reset link sent if your email is registered.');
    } catch (err) {
      console.error('Password reset error:', err);
      toast.error(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
        <Helmet><title>Check your email | The FastTrack Madrasah</title></Helmet>
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 mb-5">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Check your email</h2>
            <p className="text-sm text-slate-600 mb-1">
              If an account exists for <strong className="text-slate-900">{email}</strong>, a reset link is on its way.
            </p>
            <p className="text-xs text-slate-500 mb-6">
              The link will expire in 1 hour. Don't see it? Check your spam folder.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <Helmet><title>Forgot Password | The FastTrack Madrasah</title></Helmet>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">The FastTrack Madrasah</h1>
          <p className="text-sm text-slate-500 mt-1">Flexible. Structured. Tailored.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Forgot your password?</h2>
            <p className="text-sm text-slate-600 mt-1">
              Enter your email and we'll send you a link to reset it.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="px-6 py-5 space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full text-sm text-slate-900 placeholder-slate-400 border border-slate-300 rounded-md px-3 py-2 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending…
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Need help? Email <a href="mailto:salam@tftmadrasah.nz" className="text-emerald-700 hover:text-emerald-800">salam@tftmadrasah.nz</a>
        </p>
      </div>
    </div>
  );
}
