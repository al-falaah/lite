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

      // Check user profile and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, is_admin, full_name')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile error:', profileError);
        toast.error('Account not found. Please contact support.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Route based on role
      if (profile.is_admin) {
        // Admin users (director, madrasah_admin, blog_admin, store_admin)
        toast.success(`Welcome back, ${profile.full_name || 'Admin'}!`);

        // Route to appropriate admin dashboard based on role
        if (profile.role === 'director' || profile.role === 'madrasah_admin') {
          navigate('/admin');
        } else if (profile.role === 'blog_admin') {
          navigate('/blog/admin');
        } else if (profile.role === 'store_admin') {
          navigate('/store/admin');
        } else {
          navigate('/admin'); // Default to main admin
        }
        return;
      }

      // Non-admin users (teacher, student)
      if (profile.role === 'teacher') {
        toast.success(`Welcome back, ${profile.full_name || 'Teacher'}!`);
        navigate('/teacher');
        return;
      }

      if (profile.role === 'student') {
        toast.success(`Welcome back, ${profile.full_name || 'Student'}!`);
        navigate('/student');
        return;
      }

      // User has no role assigned
      toast.error('Your account is not configured yet. Please contact support.');
      await supabase.auth.signOut();
      setLoading(false);

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
          <p className="text-gray-600">Sign in to your account</p>
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

          {/* Additional Links */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              New student?{' '}
              <Link to="/apply" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Apply here
              </Link>
            </p>
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
