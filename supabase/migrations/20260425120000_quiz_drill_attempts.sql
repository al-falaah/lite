-- Streamline drills: lesson quiz IS the drill source.
--
-- Old design: drill_decks/drill_cards lived independently of lesson_quizzes,
-- so authors maintained the same questions twice. That table family is being
-- removed in favour of quiz_questions (already authored via ResearchAdmin).
--
-- New flow: student clicks "Let's Go and Drill" on a chapter → plays the
-- chapter's lesson_quiz as a soft-timed game → result upserts into
-- quiz_drill_attempts (last attempt overrides earlier; attempts counter
-- tracks total plays).

-- 1. Drop legacy drill tables (in dependency order)
DROP TABLE IF EXISTS drill_attempts CASCADE;
DROP TABLE IF EXISTS drill_cards CASCADE;
DROP TABLE IF EXISTS drill_decks CASCADE;

-- Drop legacy RPCs (signatures live in older migrations)
DROP FUNCTION IF EXISTS record_drill_attempt(UUID, UUID, TEXT, INT, INT, INT, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS get_drill_leaderboard(TEXT, INT) CASCADE;
DROP FUNCTION IF EXISTS get_drill_leaderboard_period(TEXT, TEXT, INT) CASCADE;

-- 2. New attempts table — one row per (student, quiz). Upsert on each play
-- so the row reflects the most-recent attempt + a running attempts counter.
CREATE TABLE IF NOT EXISTS quiz_drill_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES lesson_quizzes(id) ON DELETE CASCADE,
  program TEXT NOT NULL,                  -- denormalised for fast leaderboard filtering
  score INT NOT NULL,                     -- correct answers count
  total_questions INT NOT NULL,
  xp INT NOT NULL,                        -- last-attempt XP (with speed + combo bonuses)
  time_seconds INT NOT NULL,
  attempts_count INT NOT NULL DEFAULT 1,
  last_played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_student_quiz UNIQUE (student_id, quiz_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_drill_attempts_quiz ON quiz_drill_attempts (quiz_id, xp DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_drill_attempts_program ON quiz_drill_attempts (program, last_played_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_drill_attempts_student ON quiz_drill_attempts (student_id, last_played_at DESC);

ALTER TABLE quiz_drill_attempts ENABLE ROW LEVEL SECURITY;

-- Students see all attempts in programs they're enrolled in (so they can see
-- the leaderboard). Insert/update is gated by the RPC running with security
-- definer + auth.uid() check.
CREATE POLICY "Students see attempts in their programs"
  ON quiz_drill_attempts FOR SELECT
  USING (
    program IN (
      SELECT e.program FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE s.auth_user_id = auth.uid()
        AND e.status = 'active'
    )
    OR auth.uid() = student_id
  );

CREATE POLICY "Directors and academic_deans see all attempts"
  ON quiz_drill_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('director', 'academic_dean')
    )
  );
