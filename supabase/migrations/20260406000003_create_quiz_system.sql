-- Quiz system: quizzes linked to lesson chapters

-- Quizzes table (one quiz per chapter)
CREATE TABLE IF NOT EXISTS lesson_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES lesson_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  passing_score INTEGER NOT NULL DEFAULT 7,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(chapter_id)
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES lesson_quizzes(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  section_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(quiz_id, question_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_quizzes_chapter ON lesson_quizzes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lesson_quizzes_published ON lesson_quizzes(is_published);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- Enable RLS
ALTER TABLE lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view published quizzes
DROP POLICY IF EXISTS "Anyone can view published quizzes" ON lesson_quizzes;
CREATE POLICY "Anyone can view published quizzes"
  ON lesson_quizzes FOR SELECT
  USING (is_published = true);

-- RLS: Admins can view all quizzes
DROP POLICY IF EXISTS "Admins can view all quizzes" ON lesson_quizzes;
CREATE POLICY "Admins can view all quizzes"
  ON lesson_quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'research_admin')
    )
  );

-- RLS: Admins can manage quizzes
DROP POLICY IF EXISTS "Admins can manage quizzes" ON lesson_quizzes;
CREATE POLICY "Admins can manage quizzes"
  ON lesson_quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'research_admin')
    )
  );

-- RLS: Anyone can view questions for published quizzes
DROP POLICY IF EXISTS "Anyone can view published quiz questions" ON quiz_questions;
CREATE POLICY "Anyone can view published quiz questions"
  ON quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_quizzes
      WHERE lesson_quizzes.id = quiz_questions.quiz_id
      AND lesson_quizzes.is_published = true
    )
  );

-- RLS: Admins can view all questions
DROP POLICY IF EXISTS "Admins can view all quiz questions" ON quiz_questions;
CREATE POLICY "Admins can view all quiz questions"
  ON quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'research_admin')
    )
  );

-- RLS: Admins can manage questions
DROP POLICY IF EXISTS "Admins can manage quiz questions" ON quiz_questions;
CREATE POLICY "Admins can manage quiz questions"
  ON quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'research_admin')
    )
  );

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_lesson_quizzes_updated_at ON lesson_quizzes;
CREATE TRIGGER update_lesson_quizzes_updated_at
  BEFORE UPDATE ON lesson_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_updated_at();

DROP TRIGGER IF EXISTS update_quiz_questions_updated_at ON quiz_questions;
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_updated_at();

-- Set published_at when quiz is published
CREATE OR REPLACE FUNCTION set_quiz_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_quiz_published_at_trigger ON lesson_quizzes;
CREATE TRIGGER set_quiz_published_at_trigger
  BEFORE UPDATE ON lesson_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION set_quiz_published_at();
