import { useRef } from 'react';
import { Download } from 'lucide-react';
import { PROGRAMS } from '../../config/programs';

const PROGRAM_DETAILS = {
  qari: {
    subtitle: "Qur'an & Arabic Reading Literacy",
    arabic: 'محو أمية قراءة القرآن والعربية',
    fullName: 'QARI — Qur\'an & Arabic Reading Literacy Program',
  },
  tajweed: {
    subtitle: 'Tajweed Mastery Program',
    arabic: 'برنامج إتقان التجويد',
    fullName: 'TMP — Tajweed Mastery Program',
  },
  essentials: {
    subtitle: 'Essential Arabic & Islamic Studies',
    arabic: 'الدراسات الأساسية في اللغة العربية والعلوم الإسلامية',
    fullName: 'EASI — Essential Arabic & Islamic Studies Program',
  },
};

export default function CertificateTemplate({ certificate, onDownload }) {
  const certRef = useRef(null);
  const details = PROGRAM_DETAILS[certificate.program_id] || PROGRAM_DETAILS.qari;

  const issuedDate = new Date(certificate.issued_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleDownload = async () => {
    if (!certRef.current) return;
    if (onDownload) {
      onDownload(certRef.current, certificate);
      return;
    }
    // Default PDF download
    const html2canvas = (await import('html2canvas-pro')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(certRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#fffdf7',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Certificate-${certificate.program_id.toUpperCase()}-${certificate.student_name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div>
      {/* Certificate Visual */}
      <div
        ref={certRef}
        style={{
          width: '1122px',
          height: '793px',
          position: 'relative',
          overflow: 'hidden',
          background: '#fffdf7',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* Watermark */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', opacity: 0.03,
          width: '300px', height: '300px',
        }}>
          <img src="/favicon.svg" style={{ width: '100%', height: '100%' }} crossOrigin="anonymous" />
        </div>

        {/* Borders */}
        <div style={{
          position: 'absolute', inset: '12px',
          border: '2px solid #059669', borderRadius: '2px',
        }} />
        <div style={{
          position: 'absolute', inset: '18px',
          border: '1px solid #a7f3d0', borderRadius: '2px',
        }} />

        {/* Corner Ornaments */}
        {['tl', 'tr', 'bl', 'br'].map(pos => (
          <div key={pos} style={{
            position: 'absolute',
            ...(pos.includes('t') ? { top: '24px' } : { bottom: '24px' }),
            ...(pos.includes('l') ? { left: '24px' } : { right: '24px' }),
            width: '60px', height: '60px', opacity: 0.3, color: '#059669',
            transform: `${pos.includes('r') ? 'scaleX(-1)' : ''} ${pos.includes('b') ? 'scaleY(-1)' : ''}`.trim() || undefined,
          }}>
            <svg viewBox="0 0 60 60" width="60" height="60">
              <path d="M0 0 Q30 0 30 30 Q30 0 60 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M0 0 Q0 30 30 30 Q0 30 0 60" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        ))}

        {/* Content */}
        <div style={{
          position: 'absolute', inset: '40px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '20px',
        }}>
          {/* Logo */}
          <img src="/favicon.svg" style={{ width: '56px', height: '56px', marginBottom: '6px' }} crossOrigin="anonymous" />
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.02em', color: '#065f46', marginBottom: '4px' }}>
            The FastTrack Madrasah
          </div>
          <div style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            New Zealand
          </div>

          {/* Title */}
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#065f46', marginBottom: '6px' }}>
            Certificate of Completion
          </div>
          <div style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, marginBottom: '24px' }}>
            {details.subtitle}
          </div>

          {/* Student Name */}
          <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '8px' }}>
            This is to certify that
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: 600, fontStyle: 'italic', color: '#065f46', marginBottom: '6px' }}>
            {certificate.student_name}
          </div>

          {/* Program */}
          <div style={{ fontSize: '13px', lineHeight: 1.7, maxWidth: '520px', marginBottom: '4px' }}>
            has successfully completed the{' '}
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '15px' }}>
              {details.fullName}
            </span>
          </div>
          <div style={{ fontFamily: "'Amiri Quran', serif", fontSize: '16px', direction: 'rtl', marginTop: '2px', opacity: 0.7 }}>
            {details.arabic}
          </div>

          {/* Scores */}
          <div style={{ display: 'flex', gap: '40px', margin: '16px 0', justifyContent: 'center' }}>
            {[
              { label: 'Milestone Average', value: `${Number(certificate.milestone_average).toFixed(1)}%` },
              { label: 'Final Exam', value: `${Number(certificate.final_exam_score).toFixed(1)}%` },
              { label: 'Weighted Total', value: `${Number(certificate.weighted_total).toFixed(1)}%` },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>{s.label}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 700, color: '#059669' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', gap: '80px', marginTop: '20px' }}>
            {[
              { name: 'Program Director', title: 'The FastTrack Madrasah' },
              { name: certificate.teacher_name || 'Assigned Teacher', title: 'Instructor' },
            ].map(sig => (
              <div key={sig.name} style={{ textAlign: 'center', minWidth: '140px' }}>
                <div style={{ width: '140px', borderBottom: '1px solid rgba(0,0,0,0.3)', marginBottom: '6px', height: '30px' }} />
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{sig.name}</div>
                <div style={{ fontSize: '10px', opacity: 0.5 }}>{sig.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '28px', left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '2px' }}>Issued: {issuedDate}</div>
          <div style={{ fontSize: '9px', opacity: 0.35, letterSpacing: '0.05em' }}>
            Verification ID: {certificate.verification_code} • Verify at thefasttrackmadrasah.com/verify
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Certificate (PDF)
        </button>
      </div>
    </div>
  );
}
