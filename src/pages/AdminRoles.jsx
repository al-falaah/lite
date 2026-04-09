import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Shield, UserCog, Home, Ban, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import Button from '../components/common/Button';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ROLES = [
  {
    value: 'director',
    label: 'Director/Founder',
    description: 'Full access to everything (Founder)',
    color: 'bg-purple-100 text-purple-800',
    isAdmin: true
  },
  {
    value: 'registrar',
    label: 'Registrar',
    description: 'Manage students, teachers, applications, and store',
    color: 'bg-blue-100 text-blue-800',
    isAdmin: true
  },
  {
    value: 'academic_dean',
    label: 'Academic Dean',
    description: 'Manage blog, research, lesson notes, and analytics',
    color: 'bg-orange-100 text-orange-800',
    isAdmin: true
  },
  {
    value: 'teacher',
    label: 'Teacher',
    description: 'Access to teacher portal',
    color: 'bg-indigo-100 text-indigo-800',
    isAdmin: false
  },
  {
    value: 'student',
    label: 'Student',
    description: 'Access to student portal',
    color: 'bg-teal-100 text-teal-800',
    isAdmin: false
  }
];

const AdminRoles = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [updating, setUpdating] = useState(null);
  const [roleFilter, setRoleFilter] = useState('admin_only'); // 'all', 'admin_only', or specific role
  const [confirmAction, setConfirmAction] = useState(null); // { userId, action, userName }

  // Determine back link based on user role
  const backLink = profile?.role === 'director' ? '/director' : '/registrar';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    let progressInterval;
    try {
      setLoading(true);
      setLoadingProgress(0);

      // Simulate progress
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) return 100;
          if (prev >= 90) return prev;
          return Math.min(prev + Math.random() * 15, 100);
        });
      }, 300);

      // Get session directly from Supabase for reliable token
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      if (!accessToken) {
        console.error('No access token available');
        toast.error('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // Fetch all users with profiles (not just admins)
      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=id,email,role,full_name,is_admin,suspended_at&order=email.asc`,
        { headers }
      );

      if (!response.ok) {
        console.error('Failed to fetch users:', response.status, response.statusText);
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      console.log('Fetched users:', data.length);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoading(false);
    }
  };

  const handleUpdateRole = async (adminId, newRole) => {
    setUpdating(adminId);
    try {
      // Get session directly from Supabase for reliable token
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      if (!accessToken) {
        console.error('No access token available');
        toast.error('Authentication required. Please log in again.');
        setUpdating(null);
        return;
      }

      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const roleConfig = ROLES.find(r => r.value === newRole);
      const newIsAdmin = roleConfig ? roleConfig.isAdmin : false;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${adminId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ role: newRole, is_admin: newIsAdmin })
        }
      );

      if (!response.ok) {
        console.error('Failed to update role:', response.status, response.statusText);
        throw new Error('Failed to update role');
      }

      toast.success('Role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const getRoleConfig = (roleValue) => {
    return ROLES.find(r => r.value === roleValue) || ROLES[1]; // Default to registrar
  };

  const handleManageUser = async (userId, action) => {
    setConfirmAction(null);
    setUpdating(userId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;
      if (!accessToken) {
        toast.error('Authentication required. Please log in again.');
        setUpdating(null);
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/manage-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action, userId })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Operation failed');
      }

      if (action === 'delete') {
        toast.success('User deleted');
      } else if (action === 'suspend') {
        toast.success('User suspended');
      } else if (action === 'unsuspend') {
        toast.success('User reactivated');
      }

      fetchUsers();
    } catch (error) {
      console.error(`Error (${action}):`, error);
      toast.error(error.message || `Failed to ${action} user`);
    } finally {
      setUpdating(null);
    }
  };

  // Filter users based on selected filter
  const filteredUsers = users.filter(user => {
    if (roleFilter === 'all') return true;
    if (roleFilter === 'admin_only') return user.is_admin === true;
    return user.role === roleFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 inline-block">
            <svg className="w-24 h-24" viewBox="0 0 80 80">
              <circle
                className="text-gray-200"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
                r="34"
                cx="40"
                cy="40"
              />
              <circle
                className="text-emerald-600"
                strokeWidth="6"
                strokeDasharray={213.628}
                strokeDashoffset={213.628 - (213.628 * loadingProgress) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="34"
                cx="40"
                cy="40"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-700">
                {Math.round(loadingProgress)}%
              </span>
            </div>
          </div>
          <p className="mt-4 text-gray-600">
            {loadingProgress < 30 && 'Connecting...'}
            {loadingProgress >= 30 && loadingProgress < 60 && 'Loading users...'}
            {loadingProgress >= 60 && loadingProgress < 90 && 'Processing...'}
            {loadingProgress >= 90 && 'Almost there...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>User Control | The FastTrack Madrasah</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to={backLink}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors mb-4"
            >
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-emerald-600" />
              <h1 className="text-3xl font-bold text-gray-900">User Control</h1>
            </div>
            <p className="text-gray-600">
              Manage roles, suspend, or delete users. Director role has full access to everything.
            </p>
          </div>

          {/* Role Descriptions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Descriptions</h2>
            <div className="space-y-3">
              {ROLES.map(role => (
                <div key={role.value} className="flex items-start gap-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
                    {role.label}
                  </span>
                  <p className="text-sm text-gray-600 mt-0.5">{role.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-emerald-600" />
                  Users ({filteredUsers.length} of {users.length})
                </h2>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="admin_only">Admin Users Only</option>
                  <option value="all">All Users</option>
                  <option value="director">Directors Only</option>
                  <option value="registrar">Registrars Only</option>
                  <option value="academic_dean">Academic Deans Only</option>
                  <option value="teacher">Teachers Only</option>
                  <option value="student">Students Only</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No users found with selected filter
                </div>
              ) : (
                filteredUsers.map(user => {
                  const roleConfig = getRoleConfig(user.role);
                  const isUpdating = updating === user.id;
                  const isSuspended = !!user.suspended_at;
                  const isDirector = user.role === 'director';

                  return (
                    <div key={user.id} className={`p-6 ${isSuspended ? 'bg-red-50/50' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium ${isSuspended ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                              {user.full_name || user.email}
                            </h3>
                            {isSuspended && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <Ban className="h-3 w-3" />
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{user.email}</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${roleConfig.color}`}>
                            {roleConfig.label}
                          </span>
                        </div>

                        <div className="flex-shrink-0 space-y-3">
                          {/* Role changer */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Role
                            </label>
                            <select
                              value={user.role || 'registrar'}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              disabled={isUpdating || isSuspended}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {ROLES.map(role => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Actions — don't show for directors */}
                          {!isDirector && (
                            <div className="flex gap-2">
                              {isSuspended ? (
                                <button
                                  onClick={() => setConfirmAction({ userId: user.id, action: 'unsuspend', userName: user.full_name || user.email })}
                                  disabled={isUpdating}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Reactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmAction({ userId: user.id, action: 'suspend', userName: user.full_name || user.email })}
                                  disabled={isUpdating}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
                                >
                                  <Ban className="h-3 w-3" />
                                  Suspend
                                </button>
                              )}
                              <button
                                onClick={() => setConfirmAction({ userId: user.id, action: 'delete', userName: user.full_name || user.email })}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </div>
                          )}

                          {isUpdating && (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Important Note */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Director/Founder role has unrestricted access to all areas</li>
                  <li>Suspended users cannot log in until reactivated</li>
                  <li>Deleting a user is permanent and cannot be undone</li>
                  <li>Role changes take effect immediately on next page load</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${confirmAction.action === 'delete' ? 'bg-red-100' : confirmAction.action === 'suspend' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${confirmAction.action === 'delete' ? 'text-red-600' : confirmAction.action === 'suspend' ? 'text-amber-600' : 'text-emerald-600'}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction.action === 'delete' ? 'Delete User' : confirmAction.action === 'suspend' ? 'Suspend User' : 'Reactivate User'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {confirmAction.action === 'delete' && (
                <>Are you sure you want to permanently delete <strong>{confirmAction.userName}</strong>? This action cannot be undone.</>
              )}
              {confirmAction.action === 'suspend' && (
                <>Are you sure you want to suspend <strong>{confirmAction.userName}</strong>? They will not be able to log in until reactivated.</>
              )}
              {confirmAction.action === 'unsuspend' && (
                <>Reactivate <strong>{confirmAction.userName}</strong>? They will be able to log in again.</>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleManageUser(confirmAction.userId, confirmAction.action)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  confirmAction.action === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmAction.action === 'suspend'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmAction.action === 'delete' ? 'Delete' : confirmAction.action === 'suspend' ? 'Suspend' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminRoles;
