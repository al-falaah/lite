import { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BlogSubscribe = () => {
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
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 text-center border border-emerald-200">
        <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
        <h3 className="text-2xl font-brand font-bold text-gray-900 mb-2">
          You're All Set!
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Thank you for subscribing! You'll receive an email whenever we publish new articles.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200">
      <div className="max-w-2xl mx-auto text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-full mb-4">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-brand font-bold text-gray-900 mb-3">
          Subscribe to Our Blog
        </h3>
        <p className="text-gray-600 text-base sm:text-lg">
          Get notified when we publish new articles about Islamic studies, Arabic learning, and spiritual development
        </p>
      </div>

      <form onSubmit={handleSubscribe} className="max-w-lg mx-auto">
        <div className="space-y-4">
          <div>
            <label htmlFor="subscribe-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              id="subscribe-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="subscribe-name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name (Optional)
            </label>
            <input
              id="subscribe-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Subscribing...' : 'Subscribe to Updates'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          We respect your privacy. Unsubscribe anytime.
        </p>
      </form>
    </div>
  );
};

export default BlogSubscribe;
