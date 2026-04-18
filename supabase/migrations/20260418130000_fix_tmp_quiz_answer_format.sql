-- Normalize TMP tajweed quizzes to the format ChapterQuiz.jsx expects:
--   * options: ["A. text", "B. text", "C. text", "D. text"]
--   * correct_answer: single letter "A" / "B" / "C" / "D"
--
-- Handles three possible starting states per question:
--   1. correct_answer is full text, options are plain       → convert both
--   2. correct_answer is already a letter, options are plain → only prefix options
--   3. already in final format                               → skip
--
-- Affects: "Quiz: Al-Isti'aadhah and Al-Basmalah" and "Quiz: Maraatib al-Qira'ah"

DO $$
DECLARE
  rec RECORD;
  new_options JSONB;
  new_correct TEXT;
  idx INT;
  letter CHAR;
  opt_text TEXT;
  correct_is_letter BOOLEAN;
  options_are_lettered BOOLEAN;
BEGIN
  FOR rec IN
    SELECT qq.id, qq.options, qq.correct_answer
    FROM quiz_questions qq
    JOIN lesson_quizzes q ON q.id = qq.quiz_id
    JOIN lesson_chapters c ON c.id = q.chapter_id
    WHERE c.title ILIKE '%Maraatib%' OR c.title ILIKE '%Isti%aadhah%'
  LOOP
    options_are_lettered := jsonb_array_length(rec.options) > 0
                            AND (rec.options->>0) ~ '^[A-D]\. ';
    correct_is_letter    := rec.correct_answer ~ '^[A-D]$';

    -- Fully normalized already: skip
    IF options_are_lettered AND correct_is_letter THEN
      CONTINUE;
    END IF;

    new_options := '[]'::jsonb;
    new_correct := NULL;
    idx := 0;

    FOR opt_text IN SELECT jsonb_array_elements_text(rec.options) LOOP
      letter := chr(65 + idx);

      -- Prefix option with "A. " etc., unless it is already prefixed
      IF opt_text ~ '^[A-D]\. ' THEN
        new_options := new_options || to_jsonb(opt_text);
      ELSE
        new_options := new_options || to_jsonb(letter || '. ' || opt_text);
      END IF;

      -- Determine the correct letter
      IF correct_is_letter THEN
        new_correct := rec.correct_answer;
      ELSIF opt_text = rec.correct_answer THEN
        new_correct := letter::TEXT;
      END IF;

      idx := idx + 1;
    END LOOP;

    IF new_correct IS NULL THEN
      RAISE EXCEPTION 'No matching option found for question %: correct_answer was %', rec.id, rec.correct_answer;
    END IF;

    UPDATE quiz_questions
    SET options = new_options, correct_answer = new_correct
    WHERE id = rec.id;
  END LOOP;
END $$;
