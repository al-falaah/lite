import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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
  Copy
} from 'lucide-react';
import { students } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const AdminStudentsList = () => {
  const [loading, setLoading] = useState(true);
  const [studentsData, setStudentsData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

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
    setShowModal(true);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy');
    });
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

  // Filter students by status
  const statusFilteredStudents = statusFilter === 'all'
    ? studentsData
    : studentsData.filter(s => s.status === statusFilter);

  // Filter students by search query
  const searchFilteredStudents = statusFilteredStudents.filter(student => {
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
    dropout: studentsData.filter(s => s.status === 'dropout').length
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
      <div className="grid md:grid-cols-4 gap-6">
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

      {/* Filters */}
      <div className="flex gap-2">
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
                <div className="flex items-start justify-between">
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

                    <div className="mt-2 text-sm text-gray-500">
                      <span className="font-mono">{student.student_id}</span>
                    </div>
                  </div>

                  <div className="ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewStudent(student)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
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
                  Enrollment Information
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
    </div>
  );
};

export default AdminStudentsList;
