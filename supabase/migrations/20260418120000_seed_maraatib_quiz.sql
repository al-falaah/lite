-- Seed quiz for the Maraatib al-Qira'ah (The Levels of Recitation) chapter.
-- The Isti'aadhah quiz was already seeded in migration 20260417120000.

DO $$
DECLARE
  v_mar_chapter_id UUID := '64bf3b30-cee8-4468-bef8-f66afa382e55';
  v_mar_quiz_id    UUID;
BEGIN
  -- Only insert if a quiz doesn't already exist for this chapter
  SELECT id INTO v_mar_quiz_id FROM lesson_quizzes WHERE chapter_id = v_mar_chapter_id;

  IF v_mar_quiz_id IS NULL THEN
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
  END IF;
END $$;
