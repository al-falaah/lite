-- Give teachers access to lesson content for programs they actively teach.
-- Scope: a teacher may SELECT lesson_courses, lesson_chapters, lesson_quizzes,
-- and quiz_questions whose program matches an 'assigned' row in
-- teacher_student_assignments for that teacher. Teachers not assigned to a
-- program (e.g. not teaching tajweed) won't see that program's lessons.

-- 1. lesson_courses
CREATE POLICY "Teachers can view lesson courses for programs they teach"
  ON lesson_courses FOR SELECT
  TO authenticated
  USING (
    program_id IN (
      SELECT tsa.program
      FROM teacher_student_assignments tsa
      JOIN teachers t ON t.id = tsa.teacher_id
      WHERE t.auth_user_id = auth.uid()
      AND tsa.status = 'assigned'
    )
  );

-- 2. lesson_chapters (published only)
CREATE POLICY "Teachers can view published chapters for programs they teach"
  ON lesson_chapters FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND course_id IN (
      SELECT lc.id FROM lesson_courses lc
      WHERE lc.program_id IN (
        SELECT tsa.program
        FROM teacher_student_assignments tsa
        JOIN teachers t ON t.id = tsa.teacher_id
        WHERE t.auth_user_id = auth.uid()
        AND tsa.status = 'assigned'
      )
    )
  );

-- 3. lesson_quizzes (published only)
CREATE POLICY "Teachers can view published quizzes for programs they teach"
  ON lesson_quizzes FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND chapter_id IN (
      SELECT lch.id FROM lesson_chapters lch
      JOIN lesson_courses lc ON lc.id = lch.course_id
      WHERE lc.program_id IN (
        SELECT tsa.program
        FROM teacher_student_assignments tsa
        JOIN teachers t ON t.id = tsa.teacher_id
        WHERE t.auth_user_id = auth.uid()
        AND tsa.status = 'assigned'
      )
    )
  );

-- 4. quiz_questions (for published quizzes in taught programs)
CREATE POLICY "Teachers can view quiz questions for programs they teach"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (
    quiz_id IN (
      SELECT lq.id FROM lesson_quizzes lq
      JOIN lesson_chapters lch ON lch.id = lq.chapter_id
      JOIN lesson_courses lc ON lc.id = lch.course_id
      WHERE lq.is_published = true
      AND lc.program_id IN (
        SELECT tsa.program
        FROM teacher_student_assignments tsa
        JOIN teachers t ON t.id = tsa.teacher_id
        WHERE t.auth_user_id = auth.uid()
        AND tsa.status = 'assigned'
      )
    )
  );
