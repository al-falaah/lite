import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UserCheck, Plus, Edit2, Trash2, Mail, Phone, Globe, UserCircle, X } from 'lucide-react';
import { supabase, teachers, supabaseUrl, supabaseAnonKey } from '../services/supabase';

export default function AdminTeachersList() {
  const [teachersList, setTeachersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [filter, setFilter] = useState('all'); // all, male, female, active, inactive
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: 'male',
    country_of_residence: '',
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
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

      const { data, error } = await teachers.getAll();

      if (error) {
        toast.error('Failed to load teachers');
        console.error(error);
      } else {
        setTeachersList(data || []);
      }
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoading(false);
    }
  };

  const generateStaffId = async () => {
    let staffId;
    let exists = true;

    while (exists) {
      staffId = String(Math.floor(10000 + Math.random() * 90000));
      const { data } = await teachers.getByStaffId(staffId);
      exists = !!data;
    }

    return staffId;
  };


  const handleCreateTeacher = async () => {
    // Validation
    if (!formData.full_name || !formData.email || !formData.phone || !formData.country_of_residence) {
      toast.error('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Generate staff ID
      const staffId = await generateStaffId();

      // Call Edge Function to create Supabase Auth user and get invite link
      const response = await fetch(`${supabaseUrl}/functions/v1/create-teacher-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          staff_id: staffId,
        }),
      });

      const authResult = await response.json();

      if (!response.ok || authResult.error) {
        if (authResult.error?.includes('already registered')) {
          toast.error('A teacher with this email already exists');
        } else {
          toast.error(`Failed to create teacher auth: ${authResult.error}`);
          console.error(authResult.error);
        }
        setLoading(false);
        return;
      }

      // Create teacher record with auth_user_id
      const { data, error } = await teachers.create({
        ...formData,
        staff_id: staffId,
        auth_user_id: authResult.auth_user_id,
        is_active: true,
      });

      if (error) {
        toast.error('Failed to create teacher record');
        console.error(error);
        setLoading(false);
        return;
      }

      // Send welcome email with invite link
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-teacher-welcome-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacherData: {
              full_name: formData.full_name,
              email: formData.email,
              staff_id: staffId,
            },
            inviteLink: authResult.invite_link,
            baseUrl: window.location.origin,
          }),
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok || emailResult.error) {
          console.error('Failed to send welcome email:', emailResult.error);
          toast.warning('Teacher created but welcome email failed to send');
        } else {
          console.log('Welcome email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        toast.warning('Teacher created but welcome email failed to send');
      }

      // Success!
      toast.success('Teacher created and invite email sent!');
      fetchTeachers();

      // Reset form and close modal
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        gender: 'male',
        country_of_residence: '',
      });
      setShowCreateModal(false);
    } catch (err) {
      toast.error('An error occurred');
      console.error(err);
    }

    setLoading(false);
  };

  const handleEditTeacher = async () => {
    if (!selectedTeacher) return;

    // Validation
    if (!formData.full_name || !formData.email || !formData.phone || !formData.country_of_residence) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    const { data, error } = await teachers.update(selectedTeacher.id, {
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender,
      country_of_residence: formData.country_of_residence,
    });

    if (error) {
      toast.error('Failed to update teacher');
      console.error(error);
    } else {
      toast.success('Teacher updated successfully!');
      fetchTeachers();
      setShowEditModal(false);
      setSelectedTeacher(null);
    }

    setLoading(false);
  };

  const handleDeleteTeacher = async (teacher) => {
    if (!window.confirm(`Are you sure you want to delete ${teacher.full_name}? This will remove all student assignments.`)) {
      return;
    }

    setLoading(true);

    const { error } = await teachers.delete(teacher.id);

    if (error) {
      toast.error('Failed to delete teacher');
      console.error(error);
    } else {
      toast.success('Teacher deleted successfully');
      fetchTeachers();
    }

    setLoading(false);
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      full_name: teacher.full_name,
      email: teacher.email,
      phone: teacher.phone,
      gender: teacher.gender,
      country_of_residence: teacher.country_of_residence,
    });
    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      gender: 'male',
      country_of_residence: '',
    });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedTeacher(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      gender: 'male',
      country_of_residence: '',
    });
  };

  // Filter teachers
  const filteredTeachers = teachersList.filter(teacher => {
    if (filter === 'male') return teacher.gender === 'male';
    if (filter === 'female') return teacher.gender === 'female';
    if (filter === 'active') return teacher.is_active === true;
    if (filter === 'inactive') return teacher.is_active === false;
    return true; // all
  });

  // Calculate stats
  const stats = {
    total: teachersList.length,
    male: teachersList.filter(t => t.gender === 'male').length,
    female: teachersList.filter(t => t.gender === 'female').length,
    active: teachersList.filter(t => t.is_active).length,
  };

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Teachers</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 sm:gap-2 bg-emerald-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-emerald-700 transition text-xs sm:text-sm"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden xs:inline">Add Teacher</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Teachers</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Male Teachers</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.male}</p>
            </div>
            <UserCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Female Teachers</p>
              <p className="text-xl sm:text-2xl font-bold text-pink-600">{stats.female}</p>
            </div>
            <UserCircle className="h-6 w-6 sm:h-8 sm:w-8 text-pink-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Active Teachers</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 mb-4 sm:mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm whitespace-nowrap ${
            filter === 'all'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('male')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm whitespace-nowrap ${
            filter === 'male'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Male
        </button>
        <button
          onClick={() => setFilter('female')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm whitespace-nowrap ${
            filter === 'female'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Female
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm whitespace-nowrap ${
            filter === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm whitespace-nowrap ${
            filter === 'inactive'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Inactive
        </button>
      </div>

      {/* Teachers List */}
      {loading ? (
        <div className="text-center py-12">
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
          <p className="mt-4 text-sm sm:text-base text-gray-600">
            {loadingProgress < 30 && 'Connecting...'}
            {loadingProgress >= 30 && loadingProgress < 60 && 'Fetching teachers...'}
            {loadingProgress >= 60 && loadingProgress < 90 && 'Processing data...'}
            {loadingProgress >= 90 && 'Almost there...'}
          </p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <UserCheck className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600">No teachers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{teacher.full_name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Staff ID: {teacher.staff_id}</p>
                </div>
                <div className="flex gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => openEditModal(teacher)}
                    className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit teacher"
                  >
                    <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(teacher)}
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete teacher"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2 mb-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 min-w-0">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{teacher.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  {teacher.phone}
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  {teacher.country_of_residence}
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  {teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-200">
                <span
                  className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                    teacher.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {teacher.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Teacher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Add New Teacher</h2>
                <button
                  onClick={closeCreateModal}
                  className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="+64 21 234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country of Residence *
                    </label>
                    <input
                      type="text"
                      value={formData.country_of_residence}
                      onChange={(e) => setFormData({ ...formData, country_of_residence: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="New Zealand"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      Staff ID will be automatically generated. An invite email will be sent to the teacher to set up their password.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={closeCreateModal}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTeacher}
                      disabled={loading}
                      className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Teacher'}
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Teacher</h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country of Residence *
                  </label>
                  <input
                    type="text"
                    value={formData.country_of_residence}
                    onChange={(e) => setFormData({ ...formData, country_of_residence: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeEditModal}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditTeacher}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}