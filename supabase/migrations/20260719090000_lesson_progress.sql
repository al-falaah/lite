-- Per-chapter read-state for the course player (rung 4 of the LMS plan).
--
-- Drill attempts already give a real completion signal for chapters that have
-- a published quiz; this table covers the rest: a row is upserted when a
-- student opens a chapter in the reader, so quiz-less chapters can show a
-- "visited" checkmark and "continue where you left off" can span devices.
-- One row per (student, chapter); completed_at records the first visit.

CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES lesson_chapters(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_student_chapter UNIQUE (student_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student
  ON lesson_progress (student_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_chapter
  ON lesson_progress (chapter_id);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Students read and write only their own rows.
CREATE POLICY "Students read own lesson progress"
  ON lesson_progress FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students record own lesson progress"
  ON lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Staff visibility mirrors quiz_drill_attempts.
CREATE POLICY "Directors and academic_deans see all lesson progress"
  ON lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('director', 'academic_dean')
    )
  );
