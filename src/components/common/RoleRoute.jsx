import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Role-based route guard component
 *
 * All user roles:
 * - director: Full access to everything (founder)
 * - teacher: Teacher portal access
 * - student: Student portal access
 * - madrasah_admin: Madrasah management (students/teachers/applications)
 * - blog_admin: Blog management only
 * - store_admin: Store management only
 *
 * Director role has access to all admin routes
 * This component is used for ADMIN routes only (not student/teacher portals)
 */

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <img src="/favicon.svg" alt="Al-Falaah Logo" className="h-12 w-12 mx-auto mb-4" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if no profile (shouldn't happen for admins)
  if (!profile) {
    return <Navigate to="/" replace />;
  }

  // Check if user is admin
  if (!profile.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this area.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // Director has access to everything
  if (profile.role === 'director') {
    return children;
  }

  // Check if user's role is in allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-2">
            This area is restricted to: <strong>{allowedRoles.join(', ')}</strong>
          </p>
          <p className="text-gray-600 mb-6">
            Your role: <strong>{profile.role || 'No role assigned'}</strong>
          </p>
          <div className="space-y-3">
            <a
              href="/admin"
              className="block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Go to Your Dashboard
            </a>
            <a
              href="/"
              className="block px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // User has the required role
  return children;
};

export default RoleRoute;
