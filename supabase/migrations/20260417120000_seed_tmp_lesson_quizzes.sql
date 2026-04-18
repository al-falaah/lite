-- Seed quizzes for the two TMP lessons:
--   1. Al-Isti'aadhah and Al-Basmalah
--   2. Maraatib al-Qira'ah (Levels of Recitation)
--
-- Chapters are resolved by a case-insensitive title match within the tajweed program.
-- Adjust the LIKE patterns if your chapter titles differ.

DO $$
DECLARE
  v_isti_chapter_id UUID;
  v_mar_chapter_id  UUID;
  v_isti_quiz_id    UUID;
  v_mar_quiz_id     UUID;
BEGIN
  -- Resolve chapter IDs
  SELECT ch.id INTO v_isti_chapter_id
  FROM lesson_chapters ch
  JOIN lesson_courses c ON c.id = ch.course_id
  WHERE c.program_id = 'tajweed'
    AND (ch.title ILIKE '%Isti%aadhah%' OR ch.title ILIKE '%Isti%aazah%' OR ch.slug ILIKE '%isti%')
  ORDER BY ch.chapter_number
  LIMIT 1;

  SELECT ch.id INTO v_mar_chapter_id
  FROM lesson_chapters ch
  JOIN lesson_courses c ON c.id = ch.course_id
  WHERE c.program_id = 'tajweed'
    AND (ch.title ILIKE '%Maraatib%' OR ch.title ILIKE '%Levels of Recitation%' OR ch.slug ILIKE '%maraatib%' OR ch.slug ILIKE '%levels%')
  ORDER BY ch.chapter_number
  LIMIT 1;

  IF v_isti_chapter_id IS NULL THEN
    RAISE EXCEPTION 'Could not find Isti''aadhah/Basmalah chapter. Update the LIKE clauses in this migration.';
  END IF;
  IF v_mar_chapter_id IS NULL THEN
    RAISE EXCEPTION 'Could not find Maraatib al-Qira''ah chapter. Update the LIKE clauses in this migration.';
  END IF;

  -- =========================================================================
  -- QUIZ 1: Al-Isti'aadhah and Al-Basmalah
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (
    v_isti_chapter_id,
    'Quiz: Al-Isti''aadhah and Al-Basmalah',
    'Test your understanding of seeking refuge, the Basmalah, and how to join them when reciting.',
    8, true, now()
  )
  RETURNING id INTO v_isti_quiz_id;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_isti_quiz_id, 1,
    'What does "Isti''aadhah" literally mean?',
    '["Opening the recitation","Seeking refuge with Allah","Praising Allah","Asking for guidance"]'::jsonb,
    'Seeking refuge with Allah',
    'Isti''aadhah comes from the root ''-w-dh meaning to seek protection or refuge.',
    'easy', 'Isti''aadhah'),

  (v_isti_quiz_id, 2,
    'What is the standard wording of the Isti''aadhah?',
    '["Bismillah ir-Rahman ir-Raheem","A''udhu billahi min ash-Shaytan ir-Rajeem","Alhamdulillahi Rabb il-''Aalameen","La ilaha illa Allah"]'::jsonb,
    'A''udhu billahi min ash-Shaytan ir-Rajeem',
    'The established form is A''udhu billahi min ash-Shaytan ir-Rajeem — "I seek refuge with Allah from the accursed Shaytan."',
    'easy', 'Isti''aadhah'),

  (v_isti_quiz_id, 3,
    'When a reciter begins reciting the Qur''an, saying the Isti''aadhah is generally considered:',
    '["Obligatory (fard)","Forbidden (haram)","Recommended (mustahabb / sunnah)","Disliked (makruh)"]'::jsonb,
    'Recommended (mustahabb / sunnah)',
    'The majority of scholars hold that saying the Isti''aadhah before recitation is recommended, based on Surah An-Nahl 16:98.',
    'medium', 'Isti''aadhah'),

  (v_isti_quiz_id, 4,
    'The command to seek refuge before reciting the Qur''an is mentioned in which surah?',
    '["Al-Fatihah","Al-Baqarah","An-Nahl","Al-Ikhlas"]'::jsonb,
    'An-Nahl',
    'Surah An-Nahl, verse 98: "So when you recite the Qur''an, seek refuge with Allah from the accursed Shaytan."',
    'medium', 'Isti''aadhah'),

  (v_isti_quiz_id, 5,
    'What is the full wording of the Basmalah?',
    '["Bismillah","Bismillah ir-Rahman ir-Raheem","Alhamdulillah","A''udhu billahi min ash-Shaytan ir-Rajeem"]'::jsonb,
    'Bismillah ir-Rahman ir-Raheem',
    'The Basmalah is "Bismillah ir-Rahman ir-Raheem" — "In the name of Allah, the Most Gracious, the Most Merciful."',
    'easy', 'Basmalah'),

  (v_isti_quiz_id, 6,
    'Which surah does NOT begin with the Basmalah?',
    '["Al-Fatihah","Al-Baqarah","At-Tawbah","An-Nas"]'::jsonb,
    'At-Tawbah',
    'Surah At-Tawbah is the only surah in the Qur''an that does not begin with the Basmalah.',
    'medium', 'Basmalah'),

  (v_isti_quiz_id, 7,
    'According to the lesson, when should the Isti''aadhah be said aloud?',
    '["Always silently","When reciting alone in prayer","When reciting aloud in a group or teaching","Only during the night prayer"]'::jsonb,
    'When reciting aloud in a group or teaching',
    'Isti''aadhah is said aloud when the recitation itself is aloud (e.g., teaching, group recitation). It is said silently when reciting silently or alone.',
    'medium', 'When to recite'),

  (v_isti_quiz_id, 8,
    'How many ways are there to join the Isti''aadhah, Basmalah, and the beginning of a surah?',
    '["Two","Three","Four","Five"]'::jsonb,
    'Four',
    'There are four recognized ways of joining Isti''aadhah + Basmalah + start of a surah.',
    'hard', 'Joining'),

  (v_isti_quiz_id, 9,
    'Which of the following is NOT one of the four valid ways of joining Isti''aadhah, Basmalah, and the surah?',
    '["Stop after each of the three","Join all three together","Join Isti''aadhah with Basmalah, stop, then start the surah","Join Isti''aadhah with the surah while skipping the Basmalah"]'::jsonb,
    'Join Isti''aadhah with the surah while skipping the Basmalah',
    'Skipping the Basmalah is not one of the four permissible ways when reciting from the start of a surah (other than At-Tawbah).',
    'hard', 'Joining'),

  (v_isti_quiz_id, 10,
    'How many ways are there to recite between the end of one surah and the beginning of the next?',
    '["Two","Three","Four","Five"]'::jsonb,
    'Three',
    'Between two surahs there are three permissible ways: (1) stop after the first, then Basmalah, then the next; (2) join all three; (3) stop, then join Basmalah with the next surah.',
    'hard', 'Between two surahs'),

  (v_isti_quiz_id, 11,
    'Why is it warned against joining the Basmalah to the END of the previous surah?',
    '["It is too long to recite in one breath","The Basmalah belongs with the start of the next surah, not the end of the previous one","It changes the meaning of the verses","It breaks the rules of tajweed"]'::jsonb,
    'The Basmalah belongs with the start of the next surah, not the end of the previous one',
    'The Basmalah is an opening; connecting it to the end of the previous surah gives the wrong impression that it belongs to that surah.',
    'hard', 'Between two surahs'),

  (v_isti_quiz_id, 12,
    'When moving from Surah Al-Anfal to Surah At-Tawbah, what does the reciter do?',
    '["Recite the Basmalah as normal","Skip the Basmalah (do not recite it)","Recite the Isti''aadhah only","Repeat the last verse of Al-Anfal"]'::jsonb,
    'Skip the Basmalah (do not recite it)',
    'Since At-Tawbah has no Basmalah, the reciter moves directly into it — either by stopping, taking a breath, or joining the end of Al-Anfal with it.',
    'hard', 'Between two surahs');

  -- =========================================================================
  -- QUIZ 2: Maraatib al-Qira'ah (Levels of Recitation)
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (
    v_mar_chapter_id,
    'Quiz: Maraatib al-Qira''ah',
    'Test your understanding of the three levels of Qur''anic recitation and the scholarly views on each.',
    8, true, now()
  )
  RETURNING id INTO v_mar_quiz_id;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_mar_quiz_id, 1,
    'What does "Maraatib al-Qira''ah" mean?',
    '["The rules of tajweed","The levels or ranks of recitation","The ten qira''at","The virtues of recitation"]'::jsonb,
    'The levels or ranks of recitation',
    'Maraatib al-Qira''ah refers to the recognized speeds or levels at which the Qur''an is recited.',
    'easy', 'Introduction'),

  (v_mar_quiz_id, 2,
    'How many levels of recitation are commonly recognized?',
    '["Two","Three","Four","Seven"]'::jsonb,
    'Three',
    'The three levels are At-Tahqeeq (slow), At-Tadweer (medium), and Al-Hadr (fast).',
    'easy', 'Introduction'),

  (v_mar_quiz_id, 3,
    'Which level is the slowest and most deliberate?',
    '["Al-Hadr","At-Tadweer","At-Tahqeeq","Al-Jam''"]'::jsonb,
    'At-Tahqeeq',
    'At-Tahqeeq is the slowest level, used especially for teaching and for giving every letter its full right.',
    'easy', 'At-Tahqeeq'),

  (v_mar_quiz_id, 4,
    'At-Tahqeeq is most appropriate for:',
    '["Completing the Qur''an quickly","Teaching and careful study","Congregational prayer in Ramadan","Memorization review only"]'::jsonb,
    'Teaching and careful study',
    'At-Tahqeeq is the teaching pace — slow enough that every rule and letter can be studied and corrected.',
    'medium', 'At-Tahqeeq'),

  (v_mar_quiz_id, 5,
    'What is the middle level of recitation called?',
    '["At-Tahqeeq","At-Tadweer","Al-Hadr","At-Tarteel"]'::jsonb,
    'At-Tadweer',
    'At-Tadweer is the medium pace — between the slow At-Tahqeeq and the fast Al-Hadr.',
    'easy', 'At-Tadweer'),

  (v_mar_quiz_id, 6,
    'Which level is the fastest, while still observing the rules of tajweed?',
    '["Al-Hadr","At-Tadweer","At-Tahqeeq","At-Tarteel"]'::jsonb,
    'Al-Hadr',
    'Al-Hadr is the fast pace — often used by those who frequently complete the Qur''an — while still maintaining the rules of tajweed.',
    'easy', 'Al-Hadr'),

  (v_mar_quiz_id, 7,
    'What is the one non-negotiable condition across ALL three levels?',
    '["Reciting in one breath","Observing the rules of tajweed","Reciting aloud","Reciting from memory"]'::jsonb,
    'Observing the rules of tajweed',
    'No matter the speed, the rules of tajweed (madd, ghunnah, makharij, sifaat, etc.) must be preserved.',
    'medium', 'All levels'),

  (v_mar_quiz_id, 8,
    'Which scholar is famous for the poem (matn) that mentions the levels of recitation?',
    '["Imam ash-Shafi''i","Ibn al-Jazari","Imam Malik","Imam an-Nawawi"]'::jsonb,
    'Ibn al-Jazari',
    'Ibn al-Jazari, a leading authority in qira''aat, authored poems (such as the Muqaddimah and Tayyibah) that mention these levels.',
    'hard', 'Scholarly views'),

  (v_mar_quiz_id, 9,
    'According to Salsabeel ash-Shaafi, the preferred level is:',
    '["At-Tahqeeq only","Al-Hadr only","At-Tadweer (the middle level)","Whichever the reciter prefers"]'::jsonb,
    'At-Tadweer (the middle level)',
    'Salsabeel ash-Shaafi holds that At-Tadweer, the middle pace, is the preferred and most balanced.',
    'hard', 'Scholarly views'),

  (v_mar_quiz_id, 10,
    'Which level is often associated with those who aim to complete the Qur''an frequently?',
    '["At-Tahqeeq","At-Tadweer","Al-Hadr","None — they all take the same time"]'::jsonb,
    'Al-Hadr',
    'Al-Hadr is the faster pace commonly adopted by those who complete the Qur''an often, while still upholding tajweed.',
    'medium', 'Al-Hadr'),

  (v_mar_quiz_id, 11,
    'Which of the following is a violation of the conditions of correct recitation, regardless of level?',
    '["Reciting slowly with full madd","Reciting at medium pace","Dropping a letter or rushing past a madd","Pausing at the end of an ayah"]'::jsonb,
    'Dropping a letter or rushing past a madd',
    'Dropping letters or shortening madds breaks tajweed — this is not permissible at any level, including Al-Hadr.',
    'hard', 'All levels'),

  (v_mar_quiz_id, 12,
    'The preferred or most balanced view among many scholars regarding the three levels is that:',
    '["Only At-Tahqeeq is valid","Only Al-Hadr is valid","All three are valid as long as tajweed is preserved","The level must match the surah being recited"]'::jsonb,
    'All three are valid as long as tajweed is preserved',
    'The mainstream view is that all three levels are permissible and each has its place, so long as the rules of tajweed are upheld.',
    'hard', 'Scholarly views');

END $$;
