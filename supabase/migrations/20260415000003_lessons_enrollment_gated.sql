-- Gate lesson content behind active enrollment + add video_url to chapters

-- 1. Add video_url column
ALTER TABLE lesson_chapters ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

-- 2. Replace public lesson_courses policies with enrollment-gated ones

DROP POLICY IF EXISTS "Anyone can view courses" ON lesson_courses;

CREATE POLICY "Enrolled students can view courses"
  ON lesson_courses FOR SELECT
  TO authenticated
  USING (
    program_id IN (
      SELECT e.program FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE s.auth_user_id = auth.uid()
      AND e.status = 'active'
    )
  );

-- Admins keep full access (fix stale research_admin reference)
DROP POLICY IF EXISTS "Admins can manage courses" ON lesson_courses;
CREATE POLICY "Admins can manage courses"
  ON lesson_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

-- Admins also need SELECT (FOR ALL doesn't always cover SELECT on some Supabase versions)
CREATE POLICY "Admins can view all courses"
  ON lesson_courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

-- 3. Replace public lesson_chapters policies

DROP POLICY IF EXISTS "Anyone can view published chapters" ON lesson_chapters;

CREATE POLICY "Enrolled students can view published chapters"
  ON lesson_chapters FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND course_id IN (
      SELECT lc.id FROM lesson_courses lc
      WHERE lc.program_id IN (
        SELECT e.program FROM enrollments e
        JOIN students s ON s.id = e.student_id
        WHERE s.auth_user_id = auth.uid()
        AND e.status = 'active'
      )
    )
  );

-- Fix stale research_admin references in chapter admin policies
DROP POLICY IF EXISTS "Admins can view all chapters" ON lesson_chapters;
CREATE POLICY "Admins can view all chapters"
  ON lesson_chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

DROP POLICY IF EXISTS "Admins can manage chapters" ON lesson_chapters;
CREATE POLICY "Admins can manage chapters"
  ON lesson_chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

-- 4. Gate quizzes behind enrollment (replace public policies)

DROP POLICY IF EXISTS "Anyone can view published quizzes" ON lesson_quizzes;
CREATE POLICY "Enrolled students can view published quizzes"
  ON lesson_quizzes FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND chapter_id IN (
      SELECT lch.id FROM lesson_chapters lch
      JOIN lesson_courses lc ON lc.id = lch.course_id
      WHERE lc.program_id IN (
        SELECT e.program FROM enrollments e
        JOIN students s ON s.id = e.student_id
        WHERE s.auth_user_id = auth.uid()
        AND e.status = 'active'
      )
    )
  );

-- Fix stale research_admin in quiz admin policies
DROP POLICY IF EXISTS "Admins can view all quizzes" ON lesson_quizzes;
CREATE POLICY "Admins can view all quizzes"
  ON lesson_quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

DROP POLICY IF EXISTS "Admins can manage quizzes" ON lesson_quizzes;
CREATE POLICY "Admins can manage quizzes"
  ON lesson_quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

-- Gate quiz questions behind enrollment
DROP POLICY IF EXISTS "Anyone can view published quiz questions" ON quiz_questions;
CREATE POLICY "Enrolled students can view quiz questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (
    quiz_id IN (
      SELECT lq.id FROM lesson_quizzes lq
      JOIN lesson_chapters lch ON lch.id = lq.chapter_id
      JOIN lesson_courses lc ON lc.id = lch.course_id
      WHERE lq.is_published = true
      AND lc.program_id IN (
        SELECT e.program FROM enrollments e
        JOIN students s ON s.id = e.student_id
        WHERE s.auth_user_id = auth.uid()
        AND e.status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "Admins can view all quiz questions" ON quiz_questions;
CREATE POLICY "Admins can view all quiz questions"
  ON quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );

DROP POLICY IF EXISTS "Admins can manage quiz questions" ON quiz_questions;
CREATE POLICY "Admins can manage quiz questions"
  ON quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'academic_dean')
    )
  );
