import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, XCircle, Search, Award, Loader2, ArrowLeft } from 'lucide-react';
import { PROGRAMS } from '../config/programs';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use anon client for public verification - no auth needed
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const PROGRAM_NAMES = {
  qari: "Qur'an & Arabic Reading Literacy (QARI)",
  tajweed: 'Tajweed Mastery Program (TMP)',
  essentials: 'Essential Arabic & Islamic Studies (EASI)',
};

export default function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (searchParams.get('code')) {
      handleVerify();
    }
  }, []);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabaseAnon
        .from('certificates')
        .select('student_name, program_id, weighted_total, issued_at, verification_code')
        .eq('verification_code', code.trim().toUpperCase())
        .single();

      if (error || !data) {
        setResult(null);
      } else {
        setResult(data);
      }
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Verify Certificate | The FastTrack Madrasah</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" className="h-7 w-7" alt="Logo" />
              <span className="font-semibold text-gray-900 text-sm">The FastTrack Madrasah</span>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Certificate</h1>
            <p className="text-gray-500 text-sm">
              Enter a certificate verification code to confirm its authenticity.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleVerify} className="mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="e.g. QARI-2026-ABA-7F3D"
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="px-6 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
              </button>
            </div>
          </form>

          {/* Result */}
          {searched && !loading && (
            <div className={`rounded-xl border-2 p-6 ${
              result
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {result ? (
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-emerald-900 mb-1">Certificate Verified</h2>
                  <p className="text-sm text-emerald-700 mb-4">This is a valid certificate issued by The FastTrack Madrasah.</p>

                  <div className="bg-white rounded-lg p-4 text-left space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Student</div>
                      <div className="font-semibold text-gray-900">{result.student_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Program</div>
                      <div className="font-semibold text-gray-900">{PROGRAM_NAMES[result.program_id] || result.program_id}</div>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Score</div>
                        <div className="font-bold text-emerald-600 text-lg">{Number(result.weighted_total).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Issued</div>
                        <div className="font-semibold text-gray-900">
                          {new Date(result.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Verification ID</div>
                      <div className="font-mono text-sm text-gray-600">{result.verification_code}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-red-900 mb-1">Not Found</h2>
                  <p className="text-sm text-red-700">
                    No certificate matches this verification code. Please check the code and try again.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
