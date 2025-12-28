import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [error, setError] = useState(null);
  const email = searchParams.get('email');

  const handleUnsubscribe = async () => {
    if (!email) {
      setError('No email address provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Call the unsubscribe function which bypasses RLS
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/unsubscribe_from_blog`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriber_email: email.toLowerCase().trim()
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setUnsubscribed(true);
          toast.success('Successfully unsubscribed from blog updates');
        } else {
          throw new Error(data.message || 'No active subscription found with this email');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unsubscribe');
      }
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError('Failed to unsubscribe. Please try again or contact support.');
      toast.error('Failed to unsubscribe');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-brand font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-6">
            The unsubscribe link is invalid or incomplete. Please use the link from your email.
          </p>
          <Link
            to="/blog"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Visit Blog
          </Link>
        </div>
      </div>
    );
  }

  if (unsubscribed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-brand font-bold text-gray-900 mb-2">Successfully Unsubscribed</h1>
          <p className="text-gray-600 mb-6">
            You've been removed from our blog mailing list. We're sorry to see you go!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You can always resubscribe from our blog page if you change your mind.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/blog"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Visit Blog
            </Link>
            <Link
              to="/"
              className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-brand font-bold text-gray-900 mb-2">Unsubscribe from Blog Updates</h1>
          <p className="text-gray-600 mb-4">
            Are you sure you want to unsubscribe from The FastTrack Madrasah blog updates?
          </p>
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Email:</strong> {email}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Unsubscribing...' : 'Yes, Unsubscribe'}
          </button>
          <Link
            to="/blog"
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
          >
            Cancel
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          You'll no longer receive emails when we publish new articles.
        </p>
      </div>
    </div>
  );
};

export default Unsubscribe;
