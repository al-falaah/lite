import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Award, Download, ExternalLink } from 'lucide-react';
import CertificateTemplate from './CertificateTemplate';

export default function StudentCertificateCard({ programId }) {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadCertificate();
  }, [programId]);

  const loadCertificate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', user.id)
        .eq('program_id', programId)
        .maybeSingle();

      setCertificate(data);
    } catch {
      // No certificate yet
    } finally {
      setLoading(false);
    }
  };

  if (loading || !certificate) return null;

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <Award className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Program Completed!</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
              Congratulations! Your certificate has been issued.
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-emerald-600 dark:text-emerald-400">
              <span>Score: <strong>{Number(certificate.weighted_total).toFixed(1)}%</strong></span>
              <span>ID: <strong>{certificate.verification_code}</strong></span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                View & Download
              </button>
              <a
                href={`/verify?code=${certificate.verification_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 bg-white text-emerald-700 text-xs font-medium rounded-lg border border-emerald-300 hover:bg-emerald-50 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Verify
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Full Certificate Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 max-w-[1200px] w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Certificate</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="overflow-x-auto">
              <CertificateTemplate certificate={certificate} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
