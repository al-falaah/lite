import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { BarChart3, CheckCircle, XCircle, Clock, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { PROGRAMS } from '../../config/programs';

export default function TestResultsDashboard() {
  const [results, setResults] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [studentAttempts, setStudentAttempts] = useState({});

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // Fetch all results with student info
      const { data: resultsData, error: resultsError } = await supabase
        .from('student_program_results')
        .select('*')
        .order('computed_at', { ascending: false });

      if (resultsError) throw resultsError;

      // Fetch student profiles for display names
      const studentIds = [...new Set((resultsData || []).map(r => r.student_id))];
      let profilesMap = {};
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds);
        (profiles || []).forEach(p => { profilesMap[p.id] = p; });
      }

      const enriched = (resultsData || []).map(r => ({
        ...r,
        student_name: profilesMap[r.student_id]?.full_name || 'Unknown',
        student_email: profilesMap[r.student_id]?.email || '',
      }));

      setResults(enriched);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttempts = async (studentId, programId) => {
    const key = `${studentId}_${programId}`;
    if (studentAttempts[key]) {
      setExpandedStudent(expandedStudent === key ? null : key);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('student_id', studentId)
        .eq('program_id', programId)
        .in('status', ['completed', 'timed_out'])
        .order('completed_at', { ascending: true });

      if (error) throw error;
      setStudentAttempts(prev => ({ ...prev, [key]: data || [] }));
      setExpandedStudent(key);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  };

  const filteredResults = results.filter(r => {
    if (filterProgram !== 'all' && r.program_id !== filterProgram) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.student_name.toLowerCase().includes(q) && !r.student_email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total: results.length,
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length,
    inProgress: results.filter(r => r.status === 'in_progress').length,
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading results...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Students</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{stats.passed}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Passed</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
          <p className="text-xs text-red-600 mt-0.5">Failed</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
          <p className="text-xs text-amber-600 mt-0.5">In Progress</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Programs</option>
          {Object.values(PROGRAMS).map(p => (
            <option key={p.id} value={p.id}>{p.shortName}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="in_progress">In Progress</option>
        </select>
      </div>

      {/* Results table */}
      {filteredResults.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No results found</p>
          <p className="text-sm mt-1">Results will appear once students take tests</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3">Student</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3">Program</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-4 py-3">Milestone Avg</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-4 py-3">Final Exam</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-4 py-3">Weighted Total</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-4 py-3">Status</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredResults.map((r) => {
                const key = `${r.student_id}_${r.program_id}`;
                const isExpanded = expandedStudent === key;
                const program = PROGRAMS[r.program_id];

                return (
                  <> 
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{r.student_name}</p>
                        <p className="text-xs text-gray-500">{r.student_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-indigo-600">{program?.shortName || r.program_id}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {r.milestone_average != null ? `${Number(r.milestone_average).toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {r.final_exam_score != null ? `${Number(r.final_exam_score).toFixed(1)}%` : '—'}
                        </span>
                        {r.final_exam_attempts > 1 && (
                          <span className="text-xs text-gray-400 ml-1">({r.final_exam_attempts} attempts)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-gray-900">
                          {r.weighted_total != null ? `${Number(r.weighted_total).toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          r.status === 'passed' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {r.status === 'passed' && <CheckCircle className="h-3 w-3" />}
                          {r.status === 'failed' && <XCircle className="h-3 w-3" />}
                          {r.status === 'in_progress' && <Clock className="h-3 w-3" />}
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => fetchStudentAttempts(r.student_id, r.program_id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && studentAttempts[key] && (
                      <tr key={`${r.id}-details`}>
                        <td colSpan={7} className="px-4 py-3 bg-gray-50">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Test History</p>
                            {studentAttempts[key].map((a) => {
                              const milestoneName = a.type === 'milestone' && program
                                ? program.milestones[a.milestone_index]?.name || `Milestone ${a.milestone_index + 1}`
                                : 'Final Exam';
                              return (
                                <div key={a.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${
                                      a.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`} />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{milestoneName}</p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(a.completed_at).toLocaleDateString()} · {a.status}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">{a.score}/{a.total_questions}</p>
                                    <p className={`text-xs font-medium ${
                                      a.percentage >= 50 ? 'text-emerald-600' : 'text-red-600'
                                    }`}>{Number(a.percentage).toFixed(1)}%</p>
                                  </div>
                                </div>
                              );
                            })}
                            {studentAttempts[key].length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-3">No completed attempts</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
