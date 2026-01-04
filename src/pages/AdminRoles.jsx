import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Shield, UserCog, Save, Home } from 'lucide-react';
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
    value: 'madrasah_admin',
    label: 'Madrasah Admin',
    description: 'Manage students, teachers, and applications',
    color: 'bg-blue-100 text-blue-800',
    isAdmin: true
  },
  {
    value: 'store_admin',
    label: 'Store Admin',
    description: 'Manage store products and orders',
    color: 'bg-emerald-100 text-emerald-800',
    isAdmin: true
  },
  {
    value: 'blog_admin',
    label: 'Blog Admin',
    description: 'Manage blog posts and content',
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
  const [updating, setUpdating] = useState(null);
  const [roleFilter, setRoleFilter] = useState('admin_only'); // 'all', 'admin_only', or specific role

  // Determine back link based on user role
  const backLink = profile?.role === 'director' ? '/director' : '/admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
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
        `${supabaseUrl}/rest/v1/profiles?select=id,email,role,full_name,is_admin&order=email.asc`,
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

      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${adminId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ role: newRole })
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
    return ROLES.find(r => r.value === roleValue) || ROLES[1]; // Default to madrasah_admin
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Admin Roles | The FastTrack Madrasah</title>
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
              <h1 className="text-3xl font-bold text-gray-900">User Roles Management</h1>
            </div>
            <p className="text-gray-600">
              Manage roles and permissions for all users. Director role has full access to everything.
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
                  <option value="madrasah_admin">Madrasah Admins Only</option>
                  <option value="store_admin">Store Admins Only</option>
                  <option value="blog_admin">Blog Admins Only</option>
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

                  return (
                    <div key={user.id} className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {user.full_name || user.email}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">{user.email}</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${roleConfig.color}`}>
                            {roleConfig.label}
                          </span>
                        </div>

                        <div className="flex-shrink-0 w-64">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Change Role
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={user.role || 'madrasah_admin'}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              disabled={isUpdating}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {ROLES.map(role => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                            {isUpdating && (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {getRoleConfig(user.role).description}
                          </p>
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
                  <li>Director/Founder role has unrestricted access to all admin areas</li>
                  <li>Teacher and Student roles are for portal access only (not admin)</li>
                  <li>Admin roles: Director, Madrasah Admin, Store Admin, Blog Admin</li>
                  <li>Role changes take effect immediately on next page load</li>
                  <li>Be careful when changing roles - users will lose access to restricted areas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminRoles;
