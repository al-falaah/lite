-- Function to check if student has an active (non-reviewed) recitation for a program
-- Used by teacher component to prevent double-assignment
-- SECURITY DEFINER bypasses RLS so the teacher sees ALL recitations for the student
CREATE OR REPLACE FUNCTION get_active_recitation(p_student_id UUID, p_program_id TEXT)
RETURNS TABLE (
  id UUID,
  student_id UUID,
  teacher_id UUID,
  program_id TEXT,
  passage TEXT,
  notes TEXT,
  status TEXT,
  student_audio_url TEXT,
  teacher_audio_url TEXT,
  grade TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id, student_id, teacher_id, program_id, passage, notes, status,
         student_audio_url, teacher_audio_url, grade, feedback,
         created_at, submitted_at, reviewed_at
  FROM recitations
  WHERE recitations.student_id = p_student_id
    AND recitations.program_id = p_program_id
  ORDER BY created_at DESC
  LIMIT 1;
$$;
