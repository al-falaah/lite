-- Update get_active_recitation to include feedback_seen_at
DROP FUNCTION IF EXISTS get_active_recitation(UUID, TEXT);

CREATE FUNCTION get_active_recitation(p_student_id UUID, p_program_id TEXT)
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
  reviewed_at TIMESTAMPTZ,
  feedback_seen_at TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id, student_id, teacher_id, program_id, passage, notes, status,
         student_audio_url, teacher_audio_url, grade, feedback,
         created_at, submitted_at, reviewed_at, feedback_seen_at
  FROM recitations
  WHERE recitations.student_id = p_student_id
    AND recitations.program_id = p_program_id
  ORDER BY created_at DESC
  LIMIT 1;
$$;
