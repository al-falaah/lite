-- Test & Exam System: milestone tests + final exams per program
-- Supports MCQ, true/false, and short answer question types

-- ============================================================
-- 1. program_test_settings — configurable settings per program
-- ============================================================
CREATE TABLE IF NOT EXISTS program_test_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL UNIQUE,
  milestone_test_weight INTEGER NOT NULL DEFAULT 50,
  final_exam_weight INTEGER NOT NULL DEFAULT 50,
  pass_mark INTEGER NOT NULL DEFAULT 50,
  milestone_question_count INTEGER NOT NULL DEFAULT 25,
  exam_question_count INTEGER NOT NULL DEFAULT 50,
  milestone_time_limit INTEGER NOT NULL DEFAULT 40,      -- minutes
  exam_time_limit INTEGER NOT NULL DEFAULT 120,           -- minutes
  allow_exam_retake BOOLEAN NOT NULL DEFAULT true,
  max_exam_retakes INTEGER NOT NULL DEFAULT 1,
  show_correct_answers BOOLEAN NOT NULL DEFAULT false,    -- after submission, show correct answers
  show_wrong_answers BOOLEAN NOT NULL DEFAULT true,       -- after submission, show which were wrong
  show_explanations BOOLEAN NOT NULL DEFAULT true,        -- show explanation text
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_weights CHECK (milestone_test_weight + final_exam_weight = 100),
  CONSTRAINT valid_pass_mark CHECK (pass_mark >= 0 AND pass_mark <= 100)
);

-- Seed default settings for each program
INSERT INTO program_test_settings (program_id) VALUES ('qari'), ('tajweed'), ('essentials')
ON CONFLICT (program_id) DO NOTHING;

-- ============================================================
-- 2. test_questions — question bank for milestones & exams
-- ============================================================
CREATE TABLE IF NOT EXISTS test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('milestone', 'final_exam')),
  milestone_index INTEGER,                                -- 0-based; NULL for final_exam
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'true_false', 'short_answer')),
  options JSONB DEFAULT '[]',                             -- [{letter: "A", text: "..."}, ...] for MCQ; ignored for short_answer
  correct_answer TEXT NOT NULL,                           -- letter for MCQ/TF, text for short_answer
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  section_tag TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT milestone_index_required CHECK (
    (type = 'milestone' AND milestone_index IS NOT NULL) OR
    (type = 'final_exam' AND milestone_index IS NULL)
  )
);

-- ============================================================
-- 3. test_attempts — each student attempt at a test/exam
-- ============================================================
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  program_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('milestone', 'final_exam')),
  milestone_index INTEGER,
  question_ids UUID[] NOT NULL DEFAULT '{}',              -- ordered IDs of questions served
  score INTEGER,                                          -- correct count
  total_questions INTEGER,
  percentage NUMERIC(5,2),
  answers JSONB DEFAULT '{}',                             -- {questionId: {selected: "A", is_correct: bool}}
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  time_limit_minutes INTEGER,
  CONSTRAINT milestone_index_check CHECK (
    (type = 'milestone' AND milestone_index IS NOT NULL) OR
    (type = 'final_exam' AND milestone_index IS NULL)
  )
);

-- ============================================================
-- 4. student_program_results — aggregated pass/fail per student
-- ============================================================
CREATE TABLE IF NOT EXISTS student_program_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  program_id TEXT NOT NULL,
  milestone_scores JSONB DEFAULT '{}',                    -- {milestoneIndex: best_percentage}
  milestone_average NUMERIC(5,2),
  final_exam_score NUMERIC(5,2),
  final_exam_attempts INTEGER DEFAULT 0,
  weighted_total NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'passed', 'failed')),
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, program_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_test_questions_program ON test_questions(program_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_program_type ON test_questions(program_id, type);
CREATE INDEX IF NOT EXISTS idx_test_questions_milestone ON test_questions(program_id, type, milestone_index);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student ON test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student_program ON test_attempts(student_id, program_id);
CREATE INDEX IF NOT EXISTS idx_student_program_results_student ON student_program_results(student_id);

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE program_test_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_program_results ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: program_test_settings
-- ============================================================
DROP POLICY IF EXISTS "Students can view test settings" ON program_test_settings;
CREATE POLICY "Students can view test settings"
  ON program_test_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage test settings" ON program_test_settings;
CREATE POLICY "Admins can manage test settings"
  ON program_test_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'research_admin')
    )
  );

-- ============================================================
-- RLS Policies: test_questions (students NEVER read directly — via Edge Function only)
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all test questions" ON test_questions;
CREATE POLICY "Admins can view all test questions"
  ON test_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'research_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage test questions" ON test_questions;
CREATE POLICY "Admins can manage test questions"
  ON test_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'research_admin')
    )
  );

-- ============================================================
-- RLS Policies: test_attempts
-- ============================================================
DROP POLICY IF EXISTS "Students can view own attempts" ON test_attempts;
CREATE POLICY "Students can view own attempts"
  ON test_attempts FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert own attempts" ON test_attempts;
CREATE POLICY "Students can insert own attempts"
  ON test_attempts FOR INSERT
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own in-progress attempts" ON test_attempts;
CREATE POLICY "Students can update own in-progress attempts"
  ON test_attempts FOR UPDATE
  USING (auth.uid() = student_id AND status = 'in_progress');

DROP POLICY IF EXISTS "Admins can view all attempts" ON test_attempts;
CREATE POLICY "Admins can view all attempts"
  ON test_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'research_admin')
    )
  );

-- ============================================================
-- RLS Policies: student_program_results
-- ============================================================
DROP POLICY IF EXISTS "Students can view own results" ON student_program_results;
CREATE POLICY "Students can view own results"
  ON student_program_results FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can view all results" ON student_program_results;
CREATE POLICY "Admins can view all results"
  ON student_program_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'research_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage results" ON student_program_results;
CREATE POLICY "Admins can manage results"
  ON student_program_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'research_admin')
    )
  );

-- ============================================================
-- Triggers for updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_test_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_program_test_settings_updated_at ON program_test_settings;
CREATE TRIGGER update_program_test_settings_updated_at
  BEFORE UPDATE ON program_test_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_test_updated_at();

DROP TRIGGER IF EXISTS update_test_questions_updated_at ON test_questions;
CREATE TRIGGER update_test_questions_updated_at
  BEFORE UPDATE ON test_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_test_updated_at();
