import { useState } from 'react';
import { Mail, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

const BlogSubscribe = ({ inline = true, onClose }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();

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

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Use the smart subscribe function that handles both new subs and reactivations
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/subscribe_to_blog`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriber_email: email.toLowerCase().trim(),
          subscriber_name: fullName.trim() || null
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setSubscribed(true);
          setEmail('');
          setFullName('');
          toast.success(data.message);
        } else if (data.already_subscribed) {
          toast.info(data.message);
        } else {
          throw new Error(data.message || 'Subscription failed');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Subscription failed');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className={`${inline ? 'bg-gray-50 rounded-xl p-8' : 'bg-white p-6'} text-center border ${inline ? 'border-gray-200' : 'border-t border-gray-100'}`}>
        <CheckCircle className={`${inline ? 'w-12 h-12' : 'w-10 h-10'} text-gray-900 mx-auto mb-3`} />
        <h3 className={`${inline ? 'text-xl' : 'text-lg'} font-semibold text-gray-900 mb-2`}>
          Subscribed
        </h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          You'll receive an email when we publish new articles.
        </p>
        {!inline && onClose && (
          <button
            onClick={onClose}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${inline ? 'bg-gray-50 rounded-xl p-8' : 'bg-white p-4 sm:p-6'} border ${inline ? 'border-gray-200' : 'border-t border-gray-100'} relative`}>
      {/* Close button for slide-in version */}
      {!inline && onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 text-gray-400 hover:text-gray-700 transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className={`${inline ? 'max-w-xl mx-auto' : 'pr-8'} ${inline ? 'text-center' : ''} mb-4 sm:mb-6`}>
        <h3 className={`${inline ? 'text-2xl' : 'text-base sm:text-lg'} font-semibold text-gray-900 mb-1 sm:mb-2`}>
          Get new articles via email
        </h3>
        <p className={`text-gray-600 ${inline ? 'text-base' : 'text-xs sm:text-sm'}`}>
          {inline
            ? 'Subscribe to receive our latest articles on Islamic studies and Arabic learning.'
            : 'New articles delivered to your inbox.'
          }
        </p>
      </div>

      <form onSubmit={handleSubscribe} className={`${inline ? 'max-w-md mx-auto' : ''}`}>
        {inline ? (
          // Inline version - traditional stacked form
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
              required
              disabled={loading}
            />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Name (optional)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
            <p className="text-xs text-gray-500 text-center">
              Unsubscribe anytime.
            </p>
          </div>
        ) : (
          // Slide-in version - compact horizontal form
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Unsubscribe anytime. No spam.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default BlogSubscribe;
