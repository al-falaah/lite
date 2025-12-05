import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Eye,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  Send,
  X as XIcon2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { students, supabase, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const AdminStudentsList = () => {
  const [loading, setLoading] = useState(true);
  const [studentsData, setStudentsData] = useState([]);
  const [enrollmentsData, setEnrollmentsData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentEnrollments, setSelectedStudentEnrollments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [error, setError] = useState(null);

  // Email functionality state
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, programFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent infinite loading
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const dataFetch = students.getAll();

      // Race between data fetch and timeout
      const { data, error } = await Promise.race([dataFetch, timeout]);

      if (error) {
        console.error('Error loading students:', error);
        setError('Failed to load students');
        toast.error('Failed to load students');
        return;
      }

      setStudentsData(data || []);

      // Load all enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .order('created_at', { ascending: false });

      if (enrollmentsError) {
        console.error('Error loading enrollments:', enrollmentsError);
        toast.warning('Failed to load enrollment data');
      } else {
        setEnrollmentsData(enrollments || []);
      }

      setError(null);
    } catch (error) {
      console.error('Error:', error);
      if (error.message === 'Request timeout') {
        setError('Request timed out. Please check your connection and try again.');
        toast.error('Request timed out. Click Retry to load again.');
      } else {
        setError('An error occurred loading students');
        toast.error('An error occurred loading students');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (student) => {
    setSelectedStudent(student);
    // Get enrollments for this student
    const studentEnrollments = enrollmentsData.filter(e => e.student_id === student.id);
    setSelectedStudentEnrollments(studentEnrollments);
    setShowModal(true);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  // Email functions
  const handleToggleStudentSelection = (studentId) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleToggleAllStudents = () => {
    if (selectedStudentIds.length === paginatedStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(paginatedStudents.map(s => s.id));
    }
  };

  const handleOpenEmailModal = (studentId = null) => {
    if (studentId) {
      // Single student email
      setSelectedStudentIds([studentId]);
    }
    // For bulk, use already selected students
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error('Please enter both subject and message');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-student-email`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentIds: selectedStudentIds,
            subject: emailSubject,
            message: emailMessage,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      toast.success(
        `Email sent successfully to ${result.sent} student${result.sent > 1 ? 's' : ''}!`
      );

      if (result.failed > 0) {
        toast.warning(`${result.failed} email${result.failed > 1 ? 's' : ''} failed to send`);
      }

      // Reset form
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailMessage('');
      setSelectedStudentIds([]);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUpdateStatus = async (studentId, newStatus) => {
    try {
      const { error } = await students.update(studentId, { status: newStatus });

      if (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update student status');
        return;
      }

      toast.success('Student status updated successfully');
      setShowModal(false);
      setSelectedStudent(null);
      await loadStudents();
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred updating status');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applicant':
        return 'bg-yellow-100 text-yellow-800';
      case 'enrolled':
        return 'bg-green-100 text-green-800';
      case 'graduated':
        return 'bg-blue-100 text-blue-800';
      case 'dropout':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'applicant':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'enrolled':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'graduated':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'dropout':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgramName = (program) => {
    return program === 'tajweed' ? 'Tajweed Program' : 'Essential Arabic & Islamic Studies Program';
  };

  const getEnrollmentStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStudentEnrollments = (studentId) => {
    return enrollmentsData.filter(e => e.student_id === studentId);
  };

  // Filter students by status
  const statusFilteredStudents = statusFilter === 'all'
    ? studentsData
    : studentsData.filter(s => s.status === statusFilter);

  // Filter students by program
  const programFilteredStudents = programFilter === 'all'
    ? statusFilteredStudents
    : statusFilteredStudents.filter(student => {
        const studentEnrollments = getStudentEnrollments(student.id);
        return studentEnrollments.some(e => e.program === programFilter);
      });

  // Filter students by search query
  const searchFilteredStudents = programFilteredStudents.filter(student => {
    const query = searchQuery.toLowerCase();
    return (
      student.full_name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.student_id?.toLowerCase().includes(query) ||
      student.phone?.toLowerCase().includes(query)
    );
  });

  // Paginate students
  const totalPages = Math.ceil(searchFilteredStudents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedStudents = searchFilteredStudents.slice(startIndex, endIndex);

  const stats = {
    total: studentsData.length,
    enrolled: studentsData.filter(s => s.status === 'enrolled').length,
    graduated: studentsData.filter(s => s.status === 'graduated').length,
    dropout: studentsData.filter(s => s.status === 'dropout').length,
    essentialsEnrollments: enrollmentsData.filter(e => e.program === 'essentials' && e.status === 'active').length,
    tajweedEnrollments: enrollmentsData.filter(e => e.program === 'tajweed' && e.status === 'active').length
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error && studentsData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Students</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={loadStudents} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
          <p className="text-gray-600 mt-1">
            View and manage all students
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Students</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <Users className="h-10 w-10 text-gray-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Enrolled</div>
              <div className="text-3xl font-bold text-green-600">{stats.enrolled}</div>
            </div>
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Graduated</div>
              <div className="text-3xl font-bold text-blue-600">{stats.graduated}</div>
            </div>
            <CheckCircle className="h-10 w-10 text-blue-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Dropout</div>
              <div className="text-3xl font-bold text-red-600">{stats.dropout}</div>
            </div>
            <XCircle className="h-10 w-10 text-red-400" />
          </div>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-700">Essentials</div>
              <div className="text-3xl font-bold text-blue-900">{stats.essentialsEnrollments}</div>
            </div>
            <BookOpen className="h-10 w-10 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-700">Tajweed</div>
              <div className="text-3xl font-bold text-purple-900">{stats.tajweedEnrollments}</div>
            </div>
            <GraduationCap className="h-10 w-10 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, student ID, or phone..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Filters and Bulk Actions */}
      <div className="space-y-4">
        {/* Status Filter */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Status</label>
            <div className="flex gap-2 flex-wrap">
              {['all', 'applicant', 'enrolled', 'graduated', 'dropout'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                    statusFilter === filter
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {selectedStudentIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {selectedStudentIds.length} selected
              </span>
              <Button
                onClick={() => handleOpenEmailModal()}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send Bulk Email
              </Button>
            </div>
          )}
        </div>

        {/* Program Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Program</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All Programs' },
              { value: 'essentials', label: 'Essential Arabic & Islamic Studies' },
              { value: 'tajweed', label: 'Tajweed Program' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setProgramFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  programFilter === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students List */}
      {paginatedStudents.length === 0 ? (
        <Card>
          <p className="text-center text-gray-600 py-8">
            {searchQuery ? 'No students found matching your search' : 'No students found'}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Checkbox for bulk selection */}
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => handleToggleStudentSelection(student.id)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {student.full_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(student.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {student.email}
                        <button
                          onClick={() => copyToClipboard(student.email, 'Email')}
                          className="ml-1 p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Copy email"
                        >
                          <Copy className="h-3 w-3 text-gray-500" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {student.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Enrolled: {formatDate(student.enrolled_date)}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-500 font-mono">{student.student_id || 'No ID yet'}</span>
                      {getStudentEnrollments(student.id).length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Programs:</span>
                          {getStudentEnrollments(student.id).map((enrollment) => (
                            <span
                              key={enrollment.id}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                enrollment.program === 'tajweed'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {enrollment.program === 'tajweed' ? 'Tajweed' : 'Essentials'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewStudent(student)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEmailModal(student.id)}
                      className="flex items-center gap-1"
                    >
                      <Send className="h-4 w-4" />
                      Send Email
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, searchFilteredStudents.length)} of {searchFilteredStudents.length} students
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Student Details Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Student Details
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Full Name</p>
                    <p className="font-semibold">{selectedStudent.full_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Student ID</p>
                    <p className="font-mono font-semibold">{selectedStudent.student_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{selectedStudent.email}</p>
                      <button
                        onClick={() => copyToClipboard(selectedStudent.email, 'Email')}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy email"
                      >
                        <Copy className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold">{selectedStudent.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gender</p>
                    <p className="font-semibold capitalize">{selectedStudent.gender}</p>
                  </div>
                </div>
              </div>

              {/* Enrollment Info */}
              <div className="bg-emerald-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Student Status
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Enrollment Date</p>
                    <p className="font-semibold">{formatDate(selectedStudent.enrolled_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedStudent.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedStudent.status)}`}>
                        {selectedStudent.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Program Enrollments */}
              {selectedStudentEnrollments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Program Enrollments ({selectedStudentEnrollments.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedStudentEnrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className={`rounded-lg p-4 border-2 ${
                          enrollment.program === 'tajweed'
                            ? 'bg-purple-50 border-purple-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            {getProgramName(enrollment.program)}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEnrollmentStatusColor(enrollment.status)}`}>
                            {enrollment.status}
                          </span>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Total Fees</p>
                            <p className="font-semibold">${enrollment.total_fees?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Paid</p>
                            <p className="font-semibold text-green-700">${enrollment.total_paid?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Balance</p>
                            <p className={`font-semibold ${enrollment.balance_remaining > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                              ${enrollment.balance_remaining?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Payment Type</p>
                            <p className="font-semibold capitalize">{enrollment.payment_type?.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Duration</p>
                            <p className="font-semibold">{enrollment.program_duration_months} months</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Enrolled On</p>
                            <p className="font-semibold">{formatDate(enrollment.enrolled_date)}</p>
                          </div>
                          {enrollment.expected_graduation_date && (
                            <div>
                              <p className="text-gray-600">Expected Graduation</p>
                              <p className="font-semibold">{formatDate(enrollment.expected_graduation_date)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedStudentEnrollments.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No program enrollments found for this student</p>
                </div>
              )}

              {/* Update Status */}
              {selectedStudent.status !== 'graduated' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                  <div className="flex gap-3 flex-wrap">
                    {selectedStudent.status !== 'enrolled' && (
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateStatus(selectedStudent.id, 'enrolled')}
                      >
                        Mark as Enrolled
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleUpdateStatus(selectedStudent.id, 'graduated')}
                    >
                      Mark as Graduated
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => handleUpdateStatus(selectedStudent.id, 'dropout')}
                    >
                      Mark as Dropout
                    </Button>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end">
                <Button variant="secondary" onClick={closeModal}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Composition Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Send Email</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Sending to {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailSubject('');
                    setEmailMessage('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon2 className="h-6 w-6" />
                </button>
              </div>

              {/* Email Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={sendingEmail}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Enter your message..."
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    disabled={sendingEmail}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Your message will be automatically formatted with Al-Falaah Academy branding.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailSubject('');
                    setEmailMessage('');
                  }}
                  disabled={sendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
                  className="flex items-center gap-2"
                >
                  {sendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentsList;
