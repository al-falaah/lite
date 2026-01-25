import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, Home, Shield, Users, GraduationCap, ArrowRight } from 'lucide-react';

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

      console.log('Profile fetch status:', profileResponse.status);

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('Profile fetch error:', profileResponse.status, errorText);
        toast.error('Account not found. Please contact admin@tftmadrasah.nz');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const profileData = await profileResponse.json();
      console.log('Profile data received:', profileData);

      if (!profileData || profileData.length === 0) {
        console.error('No profile found for user:', data.user.id);
        toast.error('Account not found. Please contact admin@tftmadrasah.nz');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const profile = profileData[0]; // REST API returns array
      console.log('Profile loaded:', profile);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding & Info */}
        <div className="hidden lg:block">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-white/50 shadow-xl">
            <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
              <img src="/favicon.svg" alt="TFT Madrasah" className="h-12 w-12" />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-xl font-bold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-xl font-bold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Admin Portal
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Secure access for staff, teachers, and administrators to manage students, courses, and content.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Secure Authentication</h3>
                  <p className="text-sm text-gray-600">Role-based access control ensures data security</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Student Management</h3>
                  <p className="text-sm text-gray-600">Comprehensive tools for tracking student progress</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Content Administration</h3>
                  <p className="text-sm text-gray-600">Create and manage courses, lessons, and resources</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Looking for student or teacher access?</p>
              <div className="flex gap-3">
                <Link
                  to="/student"
                  className="flex-1 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-medium text-sm text-center"
                >
                  Student Portal
                </Link>
                <Link
                  to="/teacher"
                  className="flex-1 px-4 py-2.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-all font-medium text-sm text-center"
                >
                  Teacher Portal
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Mobile Back Link */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              <Home className="h-4 w-4" />
              Back to Homepage
            </Link>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <img src="/favicon.svg" alt="TFT Madrasah" className="h-10 w-10" />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-lg font-bold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-lg font-bold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-sm text-gray-600">For staff and administrators only</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 hidden lg:block">Welcome Back</h2>
              <p className="text-gray-600 text-sm hidden lg:block">Sign in to access your admin dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="your.email@example.com"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* Mobile Portal Links */}
            <div className="lg:hidden mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-3">Not an admin?</p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/student"
                  className="px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-medium text-sm text-center"
                >
                  Student Portal
                </Link>
                <Link
                  to="/teacher"
                  className="px-4 py-2.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-all font-medium text-sm text-center"
                >
                  Teacher Portal
                </Link>
              </div>
              <p className="mt-4 text-center text-xs text-gray-600">
                New student?{' '}
                <Link to="/apply" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                  Apply here
                </Link>
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                <Shield className="h-3.5 w-3.5 inline mr-1" />
                Your connection is secure and encrypted
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <a href="mailto:admin@tftmadrasah.nz" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                admin@tftmadrasah.nz
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
