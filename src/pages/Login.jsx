import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, Home } from 'lucide-react';

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

      // Determine user role from metadata first (fast path for students/teachers)
      const role = data.user.user_metadata?.role;

      if (role === 'student') {
        toast.success('Welcome back!');
        navigate('/student');
        return;
      }

      if (role === 'teacher') {
        toast.success('Welcome back!');
        navigate('/teacher');
        return;
      }

      // For admin users, check profile for role-based routing
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
        toast.error('Account not found. Please contact admin@tftmadrasah.nz');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const profileData = await profileResponse.json();

      if (!profileData || profileData.length === 0) {
        toast.error('Account not found. Please contact admin@tftmadrasah.nz');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const profile = profileData[0];

      // Check admin roles
      const validAdminRoles = ['director', 'madrasah_admin', 'blog_admin', 'store_admin', 'research_admin'];
      const isValidAdmin = profile.is_admin && validAdminRoles.includes(profile.role);

      // Handle profile-based role routing (fallback for users without metadata)
      if (profile.role === 'student') {
        toast.success('Welcome back!');
        navigate('/student');
        return;
      }

      if (profile.role === 'teacher') {
        toast.success('Welcome back!');
        navigate('/teacher');
        return;
      }

      if (!isValidAdmin) {
        toast.error(`Your account role is invalid (${profile.role || 'none'}). Please contact admin@tftmadrasah.nz`);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Valid admin - route to appropriate dashboard
      toast.success(`Welcome back, ${profile.full_name || 'Admin'}!`);

      if (profile.role === 'director') {
        navigate('/director');
      } else if (profile.role === 'madrasah_admin') {
        navigate('/admin');
      } else if (profile.role === 'blog_admin') {
        navigate('/blog/admin');
      } else if (profile.role === 'store_admin') {
        navigate('/store/admin');
      } else {
        navigate('/admin');
      }

    } catch (err) {
      console.error('Login error:', err);
      toast.error('An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <img src="/favicon.svg" alt="TFT Madrasah" className="h-10 w-10" />
            <div className="flex flex-col leading-none -space-y-1">
              <span className="text-base font-bold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
              <span className="text-base font-bold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h1>
          <p className="text-gray-600 text-sm">For students, teachers, and staff</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-md font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            Back to home
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            Need help? <a href="mailto:admin@tftmadrasah.nz" className="text-emerald-600 hover:text-emerald-700">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}
