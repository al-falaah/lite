-- RPCs for the quiz-as-drill flow.
--
-- record_quiz_drill_attempt: called from DrillPlayer at end of game. Upserts
-- the (student, quiz) row — last attempt overrides; attempts_count increments.
--
-- get_quiz_leaderboard: returns ranked rows for a single quiz, scoped to a
-- program. Per-quiz leaderboard, not aggregated across quizzes.

CREATE OR REPLACE FUNCTION record_quiz_drill_attempt(
  p_quiz_id UUID,
  p_program TEXT,
  p_score INT,
  p_total_questions INT,
  p_xp INT,
  p_time_seconds INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempt_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify the user is enrolled in this program (RLS doesn't run on RPC body)
  IF NOT EXISTS (
    SELECT 1 FROM enrollments e
    JOIN students s ON s.id = e.student_id
    WHERE s.auth_user_id = v_user_id
      AND e.program = p_program
      AND e.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not enrolled in program %', p_program;
  END IF;

  INSERT INTO quiz_drill_attempts (
    student_id, quiz_id, program, score, total_questions, xp, time_seconds,
    attempts_count, last_played_at, first_played_at
  )
  VALUES (
    v_user_id, p_quiz_id, p_program, p_score, p_total_questions, p_xp, p_time_seconds,
    1, now(), now()
  )
  ON CONFLICT (student_id, quiz_id) DO UPDATE
  SET score = EXCLUDED.score,
      total_questions = EXCLUDED.total_questions,
      xp = EXCLUDED.xp,
      time_seconds = EXCLUDED.time_seconds,
      attempts_count = quiz_drill_attempts.attempts_count + 1,
      last_played_at = now()
  RETURNING id INTO v_attempt_id;

  RETURN v_attempt_id;
END $$;

GRANT EXECUTE ON FUNCTION record_quiz_drill_attempt(UUID, TEXT, INT, INT, INT, INT) TO authenticated;


CREATE OR REPLACE FUNCTION get_quiz_leaderboard(
  p_quiz_id UUID,
  p_program TEXT,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  rank BIGINT,
  student_id UUID,
  full_name TEXT,
  score INT,
  total_questions INT,
  xp INT,
  time_seconds INT,
  attempts_count INT,
  last_played_at TIMESTAMPTZ,
  is_self BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  -- Restrict viewing to enrolled students or staff.
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM enrollments e
    JOIN students s ON s.id = e.student_id
    WHERE s.auth_user_id = v_user_id
      AND e.program = p_program
      AND e.status = 'active'
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = v_user_id
      AND profiles.role IN ('director', 'academic_dean', 'teacher')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY a.xp DESC, a.time_seconds ASC, a.last_played_at ASC) AS rank,
    a.student_id,
    COALESCE(s.full_name, 'Anonymous') AS full_name,
    a.score,
    a.total_questions,
    a.xp,
    a.time_seconds,
    a.attempts_count,
    a.last_played_at,
    (a.student_id = v_user_id) AS is_self
  FROM quiz_drill_attempts a
  LEFT JOIN students s ON s.auth_user_id = a.student_id
  WHERE a.quiz_id = p_quiz_id
    AND a.program = p_program
  ORDER BY a.xp DESC, a.time_seconds ASC, a.last_played_at ASC
  LIMIT p_limit;
END $$;

GRANT EXECUTE ON FUNCTION get_quiz_leaderboard(UUID, TEXT, INT) TO authenticated;
