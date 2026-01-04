import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('Login error:', error);
        toast.error(error.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      if (!data.user) {
        toast.error('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      // Check user profile and role using direct REST API call
      // This bypasses RLS timing issues during login
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const profileResponse = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${data.user.id}&select=id,role,is_admin,full_name,email`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${data.session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!profileResponse.ok) {
        console.error('Profile fetch error:', profileResponse.status);
        toast.error('Account not found. Please contact admin@tftmadrasah.nz');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const profileData = await profileResponse.json();

      if (!profileData || profileData.length === 0) {
        console.error('No profile found for user');
        toast.error('Account not found. Please contact admin@tftmadrasah.nz');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const profile = profileData[0]; // REST API returns array

      // Check if user has a valid admin role
      const validAdminRoles = ['director', 'madrasah_admin', 'blog_admin', 'store_admin'];
      const isValidAdmin = profile.is_admin && validAdminRoles.includes(profile.role);

      if (!isValidAdmin) {
        console.error('Invalid admin role:', profile.role);

        // More helpful error messages
        if (profile.role === 'teacher') {
          toast.error('Teachers should use the Teacher Portal');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (profile.role === 'student') {
          toast.error('Students should use the Student Portal');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Invalid or missing role
        toast.error(`Your account role is invalid (${profile.role || 'none'}). Please contact admin@tftmadrasah.nz`);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Valid admin - route to appropriate dashboard
      toast.success(`Welcome back, ${profile.full_name || 'Admin'}!`);

      // Route based on specific admin role
      if (profile.role === 'director') {
        // Director gets their own dashboard to choose admin areas
        navigate('/director');
      } else if (profile.role === 'madrasah_admin') {
        navigate('/admin');
      } else if (profile.role === 'blog_admin') {
        navigate('/blog/admin');
      } else if (profile.role === 'store_admin') {
        navigate('/store/admin');
      } else {
        navigate('/admin'); // Fallback to main admin
      }

    } catch (err) {
      console.error('Login error:', err);
      toast.error('An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">The FastTrack Madrasah</h1>
          <p className="text-gray-600">Admin Login</p>
          <p className="text-sm text-gray-500 mt-2">
            For staff and administrators only
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder="your.email@example.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Portal Links */}
          <div className="mt-6 space-y-3">
            <div className="text-center text-sm text-gray-600 border-t pt-4">
              <p className="font-medium mb-3">Not an admin?</p>
              <div className="flex gap-3">
                <Link
                  to="/student"
                  className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  Student Portal
                </Link>
                <Link
                  to="/teacher"
                  className="flex-1 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                >
                  Teacher Portal
                </Link>
              </div>
              <p className="mt-3 text-xs">
                New student?{' '}
                <Link to="/apply" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Apply here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Need help? Contact admin@tftmadrasah.nz</p>
        </div>
      </div>
    </div>
  );
}
