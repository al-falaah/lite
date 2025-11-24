import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Users,
  Eye,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { students, payments } from '../services/supabase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const AdminStudentsList = () => {
  const [loading, setLoading] = useState(true);
  const [studentsData, setStudentsData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [studentPayments, setStudentPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await students.getAll();

      if (error) {
        console.error('Error loading students:', error);
        toast.error('Failed to load students');
        return;
      }

      setStudentsData(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred loading students');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentPayments = async (studentId) => {
    try {
      setLoadingPayments(true);
      const { data, error } = await payments.getByStudent(studentId);

      if (error) {
        console.error('Error loading payments:', error);
        toast.error('Failed to load payment history');
        return;
      }

      setStudentPayments(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred loading payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleViewStudent = async (student) => {
    setSelectedStudent(student);
    setShowModal(true);
    await loadStudentPayments(student.id);
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
    setStudentPayments([]);
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

  const getPaymentStatus = (student) => {
    if (student.balance_remaining <= 0) {
      return { label: 'Paid in Full', color: 'text-green-600' };
    }
    return { label: `$${student.balance_remaining.toFixed(2)} remaining`, color: 'text-orange-600' };
  };

  const filteredStudents = statusFilter === 'all'
    ? studentsData
    : studentsData.filter(s => s.status === statusFilter);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
          <p className="text-gray-600 mt-1">
            View and manage all enrolled students
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
      {filteredStudents.length === 0 ? (
        <Card>
          <p className="text-center text-gray-600 py-8">
            No students found
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredStudents.map((student) => {
            const paymentStatus = getPaymentStatus(student);
            return (
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

                    <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {student.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {student.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Enrolled: {formatDate(student.enrollment_date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className={paymentStatus.color + ' font-semibold'}>
                          {paymentStatus.label}
                        </span>
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
            );
          })}
        </div>
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
                    <p className="font-semibold">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold">{selectedStudent.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date of Birth</p>
                    <p className="font-semibold">{formatDate(selectedStudent.date_of_birth)}</p>
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
                    <p className="font-semibold">{formatDate(selectedStudent.enrollment_date)}</p>
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

              {/* Financial Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Fee</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${selectedStudent.total_fees.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Balance Remaining</p>
                    <p className={`text-2xl font-bold ${
                      selectedStudent.balance_remaining <= 0 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      ${selectedStudent.balance_remaining.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Paid</p>
                    <p className="text-xl font-semibold text-green-600">
                      ${selectedStudent.total_paid.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Payment History</h3>
                {loadingPayments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  </div>
                ) : studentPayments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No payment records</p>
                ) : (
                  <div className="space-y-2">
                    {studentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">${payment.amount.toFixed(2)}</span>
                            <span className="text-sm text-gray-600">
                              - Year {payment.academic_year}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Due: {formatDate(payment.due_date)}
                          </div>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            payment.status === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Update Status */}
              {selectedStudent.status !== 'graduated' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                  <div className="flex gap-3">
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
