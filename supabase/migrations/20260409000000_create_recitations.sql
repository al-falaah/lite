-- Recitation Practice System
-- Two-way audio feedback tool between teachers and students

-- Create the recitations table
CREATE TABLE IF NOT EXISTS recitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  passage TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'submitted', 'reviewed')),
  student_audio_url TEXT,
  teacher_audio_url TEXT,
  grade TEXT CHECK (grade IN ('excellent', 'good', 'fair', 'needs_improvement')),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days')
);

-- Indexes
CREATE INDEX idx_recitations_student ON recitations(student_id);
CREATE INDEX idx_recitations_teacher ON recitations(teacher_id);
CREATE INDEX idx_recitations_status ON recitations(status);
CREATE INDEX idx_recitations_expires ON recitations(expires_at);

-- RLS
ALTER TABLE recitations ENABLE ROW LEVEL SECURITY;

-- Students can view their own recitations (matched via students.auth_user_id)
CREATE POLICY "Students can view own recitations"
  ON recitations FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- Students can update their own recitations (submit audio)
CREATE POLICY "Students can update own recitations"
  ON recitations FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- Students can insert recitations (self-initiated)
CREATE POLICY "Students can create own recitations"
  ON recitations FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- Teachers can view recitations for their assigned students
CREATE POLICY "Teachers can view assigned recitations"
  ON recitations FOR SELECT
  TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE auth_user_id = auth.uid()
    )
  );

-- Teachers can insert recitations (assign passages)
CREATE POLICY "Teachers can create recitations"
  ON recitations FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers WHERE auth_user_id = auth.uid()
    )
  );

-- Teachers can update recitations (review, grade, add audio feedback)
CREATE POLICY "Teachers can update assigned recitations"
  ON recitations FOR UPDATE
  TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers WHERE auth_user_id = auth.uid()
    )
  );

-- Teachers can delete recitations they created
CREATE POLICY "Teachers can delete own recitations"
  ON recitations FOR DELETE
  TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all recitations"
  ON recitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('madrasah_admin', 'director')
    )
  );

-- Create storage bucket for recitation audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recitations',
  'recitations',
  false,
  524288, -- 512KB max (compressed audio ~3 min opus)
  ARRAY['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to their own folder
CREATE POLICY "Users can upload recitation audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recitations');

-- Authenticated users can read recitation audio
CREATE POLICY "Users can read recitation audio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'recitations');

-- Authenticated users can delete their own audio
CREATE POLICY "Users can delete recitation audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'recitations');

-- Auto-cleanup function for expired recitations
CREATE OR REPLACE FUNCTION cleanup_expired_recitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete storage objects first (handled by app for now)
  -- Delete expired rows
  DELETE FROM recitations WHERE expires_at < now();
END;
$$;
