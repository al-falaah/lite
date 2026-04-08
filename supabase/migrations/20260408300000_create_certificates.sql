-- Completion Certificates System
-- Stores issued certificates with verification codes

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  program_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  verification_code TEXT NOT NULL UNIQUE,
  milestone_average NUMERIC(5,2),
  final_exam_score NUMERIC(5,2),
  weighted_total NUMERIC(5,2),
  teacher_name TEXT,
  issued_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, program_id)
);

-- Index for fast verification lookups
CREATE INDEX idx_certificates_verification ON certificates(verification_code);
CREATE INDEX idx_certificates_student ON certificates(student_id);

-- RLS policies
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Students can view their own certificates
CREATE POLICY "Students can view own certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Admins/directors can view all certificates
CREATE POLICY "Admins can view all certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('madrasah_admin', 'director')
    )
  );

-- Only service role can insert (via edge function)
-- No insert/update/delete policies for authenticated users

-- Public read for verification (anon can look up by verification_code)
CREATE POLICY "Anyone can verify certificates"
  ON certificates FOR SELECT
  TO anon
  USING (true);
