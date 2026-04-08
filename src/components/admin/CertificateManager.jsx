import { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../services/supabase';
import { Award, Search, Loader2, CheckCircle, AlertCircle, Download, Eye } from 'lucide-react';
import { PROGRAMS } from '../../config/programs';
import { toast } from 'sonner';
import CertificateTemplate from '../student/CertificateTemplate';

export default function CertificateManager() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(null);
  const [filterProgram, setFilterProgram] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [activeTab, setActiveTab] = useState('issued');
  const [previewCert, setPreviewCert] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  useEffect(() => {
    if (activeTab === 'issue') {
      fetchEligibleStudents();
    }
  }, [activeTab]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('issued_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleStudents = async () => {
    setLoadingEligible(true);
    try {
      // Get students with completed final exams
      const { data: completedExams } = await supabase
        .from('test_attempts')
        .select('student_id, program_id')
        .eq('type', 'final_exam')
        .eq('status', 'completed');

      if (!completedExams || completedExams.length === 0) {
        setEligibleStudents([]);
        return;
      }

      // Get already-issued certificates
      const { data: issued } = await supabase
        .from('certificates')
        .select('student_id, program_id');

      const issuedSet = new Set((issued || []).map(c => `${c.student_id}_${c.program_id}`));

      // Filter to only those without certificates
      const eligible = completedExams.filter(
        e => !issuedSet.has(`${e.student_id}_${e.program_id}`)
      );

      // Get unique student IDs
      const studentIds = [...new Set(eligible.map(e => e.student_id))];
      if (studentIds.length === 0) {
        setEligibleStudents([]);
        return;
      }

      // Get student profiles
      const { data: students } = await supabase
        .from('students')
        .select('auth_user_id, full_name, email')
        .in('auth_user_id', studentIds);

      const studentMap = {};
      (students || []).forEach(s => { studentMap[s.auth_user_id] = s; });

      const enriched = eligible.map(e => ({
        ...e,
        student_name: studentMap[e.student_id]?.full_name || 'Unknown',
        student_email: studentMap[e.student_id]?.email || '',
      }));

      setEligibleStudents(enriched);
    } catch (error) {
      console.error('Error fetching eligible students:', error);
    } finally {
      setLoadingEligible(false);
    }
  };

  const issueCertificate = async (studentId, programId) => {
    const key = `${studentId}_${programId}`;
    setIssuing(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/issue-certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ studentId, programId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to issue certificate');
      }

      toast.success('Certificate issued successfully!');
      fetchCertificates();
      fetchEligibleStudents();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIssuing(null);
    }
  };

  const getProgramLabel = (id) => {
    const p = Object.values(PROGRAMS).find(p => p.id === id);
    return p?.shortName || id.toUpperCase();
  };

  const filtered = certificates.filter(c => {
    if (filterProgram !== 'all' && c.program_id !== filterProgram) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.student_name.toLowerCase().includes(q) || c.verification_code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { id: 'issued', label: 'Issued Certificates', count: certificates.length },
          { id: 'issue', label: 'Issue New', count: eligibleStudents.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Issued Certificates Tab */}
      {activeTab === 'issued' && (
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or verification code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <select
              value={filterProgram}
              onChange={e => setFilterProgram(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Programs</option>
              {Object.values(PROGRAMS).map(p => (
                <option key={p.id} value={p.id}>{p.shortName}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No certificates issued yet</p>
            </div>
          ) : (
            <>
              {/* Table for desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="pb-3 font-medium">Student</th>
                      <th className="pb-3 font-medium">Program</th>
                      <th className="pb-3 font-medium">Score</th>
                      <th className="pb-3 font-medium">Issued</th>
                      <th className="pb-3 font-medium">Verification</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(cert => (
                      <tr key={cert.id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">{cert.student_name}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                            {getProgramLabel(cert.program_id)}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-emerald-600">{Number(cert.weighted_total).toFixed(1)}%</td>
                        <td className="py-3 text-gray-500">
                          {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 font-mono text-xs text-gray-500">{cert.verification_code}</td>
                        <td className="py-3">
                          <button
                            onClick={() => setPreviewCert(cert)}
                            className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                          >
                            <Eye className="h-4 w-4 inline mr-1" />
                            Preview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards for mobile */}
              <div className="md:hidden space-y-3">
                {filtered.map(cert => (
                  <div key={cert.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm">{cert.student_name}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                        {getProgramLabel(cert.program_id)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Score: <strong className="text-emerald-600">{Number(cert.weighted_total).toFixed(1)}%</strong></span>
                      <span>{new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-gray-400">{cert.verification_code}</span>
                      <button
                        onClick={() => setPreviewCert(cert)}
                        className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                      >
                        <Eye className="h-3.5 w-3.5 inline mr-1" />Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Issue New Tab */}
      {activeTab === 'issue' && (
        <div>
          {loadingEligible ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            </div>
          ) : eligibleStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No pending certificates</p>
              <p className="text-xs mt-1">All eligible students have been issued their certificates, or no students have completed their final exams yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                These students have completed their final exam and are eligible for a certificate:
              </p>
              {eligibleStudents.map(s => {
                const key = `${s.student_id}_${s.program_id}`;
                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-4">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{s.student_name}</div>
                      <div className="text-xs text-gray-500">{s.student_email}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                        {getProgramLabel(s.program_id)}
                      </span>
                    </div>
                    <button
                      onClick={() => issueCertificate(s.student_id, s.program_id)}
                      disabled={issuing === key}
                      className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
                    >
                      {issuing === key ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Issuing...</>
                      ) : (
                        <><Award className="h-4 w-4 mr-2" /> Issue Certificate</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Certificate Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewCert(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-[1200px] w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Certificate Preview — {previewCert.student_name}</h3>
              <button
                onClick={() => setPreviewCert(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="overflow-x-auto">
              <CertificateTemplate certificate={previewCert} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
