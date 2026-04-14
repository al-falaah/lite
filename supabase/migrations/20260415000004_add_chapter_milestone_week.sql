-- Add milestone and week grouping to lesson chapters
-- milestone_index maps to the program's milestones array (1-based, matches milestones[].id)
-- week_number is the week within the program (1-based, e.g. week 1–52 for a 1-year program)

ALTER TABLE lesson_chapters
  ADD COLUMN IF NOT EXISTS milestone_index INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS week_number INTEGER DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_chapters_milestone ON lesson_chapters(milestone_index);
CREATE INDEX IF NOT EXISTS idx_lesson_chapters_week ON lesson_chapters(week_number);
