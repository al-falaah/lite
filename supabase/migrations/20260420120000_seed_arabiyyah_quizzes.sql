-- Seed 15-question quizzes for the 11 published Arabiyyah 101 lessons.
-- Chapters are resolved by chapter_number within the course slug 'arabiyyah-101'.
-- Options use the lettered format expected by ChapterQuiz.jsx:
--   options: ["A. text", "B. text", "C. text", "D. text"]
--   correct_answer: single letter "A" | "B" | "C" | "D"
-- Difficulty rises within each quiz: easy → medium → hard.

DO $$
DECLARE
  v_course_id UUID;
  v_ch01 UUID; v_ch02 UUID; v_ch03 UUID; v_ch04 UUID;
  v_ch05 UUID; v_ch06 UUID; v_ch07 UUID; v_ch08 UUID;
  v_ch09 UUID; v_ch10 UUID; v_ch11 UUID;
  v_q01 UUID; v_q02 UUID; v_q03 UUID; v_q04 UUID;
  v_q05 UUID; v_q06 UUID; v_q07 UUID; v_q08 UUID;
  v_q09 UUID; v_q10 UUID; v_q11 UUID;
BEGIN
  SELECT id INTO v_course_id
  FROM lesson_courses
  WHERE slug = 'arabiyyah-101'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'Course arabiyyah-101 not found';
  END IF;

  SELECT id INTO v_ch01 FROM lesson_chapters WHERE course_id = v_course_id AND chapter_number = 1;
  SELECT id INTO v_ch02 FROM lesson_chapters WHERE course_id = v_course_id AND chapter_number = 2;
  SELECT id INTO v_ch03 FROM lesson_chapters WHERE course_id = v_course_id AND chapter_number = 3;
  SELECT id INTO v_ch04 FROM lesson_chapters WHERE course_id = v_course_id AND chapter_number = 4;
  SELECT id INTO v_ch05 FROM lesson_chapters WHERE course_id = v_course_id AND chapter_number = 5;
  SELECT id INTO v_ch06 FROM lesson_chapters WHERE course_id = v_course_id AND chapter_number = 6;
  SELECT id INTO v_ch07 FROM lesson_chapters WHERE course_id = v_course_id AND chapter_number = 7;
  SELECT id INTO v_ch08 FROM lesson_chapters WHERE course_id = v_course_id AND chapter_number = 8;
  SELECT id INTO v_ch09 FROM lesson_chapters WHERE course_id = v_course_id AND chapter_number = 9;
  SELECT id INTO v_ch10 FROM lesson_chapters WHERE course_id = v_course_id AND chapter_number = 10;
  SELECT id INTO v_ch11 FROM lesson_chapters WHERE course_id = v_course_id AND chapter_number = 11;

  -- Remove any existing quiz on these chapters so the seed is idempotent.
  DELETE FROM lesson_quizzes WHERE chapter_id IN (
    v_ch01, v_ch02, v_ch03, v_ch04, v_ch05,
    v_ch06, v_ch07, v_ch08, v_ch09, v_ch10, v_ch11
  );

  -- =========================================================================
  -- LESSON 01: الكَلِمَةُ وَأَقْسَامُهَا — Word and its Categories
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch01, 'Quiz: الكَلِمَةُ وَأَقْسَامُهَا', 'The three categories of the Arabic word: ism, fi''l, harf.', 10, true, now())
  RETURNING id INTO v_q01;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q01, 1, 'How many categories (أَقْسَام) does الكَلِمَة divide into?',
   '["A. Two","B. Three","C. Four","D. Five"]'::jsonb, 'B',
   'Every Arabic word is either an ism, a fi''l, or a harf — three categories.', 'easy', 'basics'),
  (v_q01, 2, 'Which of the following is the definition of an ism?',
   '["A. A word that indicates an action tied to time","B. A word that names a person, place, thing, or concept","C. A word that has no meaning on its own","D. A word that only appears at the end of a sentence"]'::jsonb, 'B',
   'The ism names something — a person, place, thing, or concept — without indicating tense.', 'easy', 'ism'),
  (v_q01, 3, 'Which of the following is the definition of a fi''l?',
   '["A. A word that names a thing","B. A word tied to time indicating an action or state","C. A word with no standalone meaning","D. A word that always takes ال"]'::jsonb, 'B',
   'A fi''l is a word tied to time (past, present, or imperative) indicating an action or state.', 'easy', 'fil'),
  (v_q01, 4, 'Which of the following is the definition of a harf?',
   '["A. A word with standalone meaning","B. A word that names something","C. A word whose meaning only appears in connection with another word","D. A word indicating an action"]'::jsonb, 'C',
   'A harf carries meaning only when joined to an ism or fi''l (e.g., مِنْ, فِي, لَمْ).', 'easy', 'harf'),
  (v_q01, 5, 'Which category does كِتَاب belong to?',
   '["A. ism","B. fi''l","C. harf","D. none of the above"]'::jsonb, 'A',
   'كِتَاب names a thing (a book) — it is an ism.', 'easy', 'ism'),
  (v_q01, 6, 'Which category does كَتَبَ belong to?',
   '["A. ism","B. fi''l","C. harf","D. none of the above"]'::jsonb, 'B',
   'كَتَبَ = "he wrote" — an action tied to past time, so it is a fi''l.', 'easy', 'fil'),
  (v_q01, 7, 'Which category does فِي belong to?',
   '["A. ism","B. fi''l","C. harf","D. it could be any"]'::jsonb, 'C',
   'فِي (in) is a preposition — a harf. It has meaning only when attached to an ism.', 'easy', 'harf'),
  (v_q01, 8, 'Which of these is a fi''l?',
   '["A. المَسْجِد","B. ذَهَبَ","C. عَلَى","D. بَيْت"]'::jsonb, 'B',
   'ذَهَبَ = "he went" — past-tense action, so it is a fi''l. The others are isms or a harf.', 'medium', 'fil'),
  (v_q01, 9, 'Which of these is a harf?',
   '["A. يَقْرَأُ","B. القَلَم","C. مِنْ","D. طَالِب"]'::jsonb, 'C',
   'مِنْ is a harf (preposition). يَقْرَأُ is a fi''l; القَلَم and طَالِب are isms.', 'medium', 'harf'),
  (v_q01, 10, 'Which statement about the three categories is CORRECT?',
   '["A. Every Arabic word is either an ism, a fi''l, or a harf","B. A word can belong to two categories at once","C. There are four categories, not three","D. Only verbs are tied to time"]'::jsonb, 'A',
   'Every Arabic word belongs to exactly one of the three categories.', 'medium', 'basics'),
  (v_q01, 11, 'What distinguishes the fi''l from the ism most clearly?',
   '["A. The fi''l takes ال","B. The fi''l is tied to time; the ism is not","C. The ism is always longer than the fi''l","D. The ism carries tanween; the fi''l does not"]'::jsonb, 'B',
   'The defining feature of a fi''l is its connection to time (past/present/imperative). An ism is not tied to time.', 'medium', 'fil'),
  (v_q01, 12, 'In the verse ﴿الحَمْدُ لِلَّهِ رَبِّ العَالَمِينَ﴾, how many حُرُوف (particles) are there?',
   '["A. None","B. One","C. Two","D. Three"]'::jsonb, 'B',
   'The لـ in لِلَّهِ is a harf (preposition). الحَمْد, اللَّه, رَبّ, العَالَمِين are isms; there is no fi''l.', 'hard', 'analysis'),
  (v_q01, 13, 'Classify each word in ﴿ذَهَبَ اللَّهُ بِنُورِهِمْ﴾: ذَهَبَ / اللَّهُ / بِـ / نُورِهِمْ',
   '["A. fi''l / ism / harf / ism","B. ism / fi''l / harf / ism","C. fi''l / harf / ism / ism","D. fi''l / ism / ism / harf"]'::jsonb, 'A',
   'ذَهَبَ = past-tense fi''l; اللَّهُ = ism; بِـ = harf (preposition); نُورِ = ism (with the possessive هِمْ).', 'hard', 'analysis'),
  (v_q01, 14, 'Why can a harf not stand alone and convey a complete meaning?',
   '["A. Because it is always too short","B. Because its meaning is only realised in connection with an ism or fi''l","C. Because it is a modern invention not found in classical Arabic","D. Because it only appears in the Qur''an"]'::jsonb, 'B',
   'A harf has a relational meaning — it tells you how two things connect. On its own مِنْ or فِي is incomplete.', 'hard', 'harf'),
  (v_q01, 15, 'Which of these lists contains ONLY isms?',
   '["A. بَيْت، ذَهَبَ، مَسْجِد","B. رَجُل، كِتَاب، طَالِب","C. قَرَأَ، يَكْتُبُ، اذْهَبْ","D. فِي، عَلَى، مِنْ"]'::jsonb, 'B',
   'رَجُل, كِتَاب, طَالِب all name things — all isms. List A mixes an ism and a fi''l; C is all verbs; D is all harfs.', 'hard', 'analysis');

  -- =========================================================================
  -- LESSON 02: الفِعْلُ — The Verb
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch02, 'Quiz: الفِعْلُ', 'Verb categories by letter count and by tense; the three patterns of the bare 3-letter verb.', 10, true, now())
  RETURNING id INTO v_q02;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q02, 1, 'How many root letters does a ثُلَاثِيّ verb have?',
   '["A. Two","B. Three","C. Four","D. Five"]'::jsonb, 'B',
   'ثُلَاثِيّ means "of three" — a verb built on a three-letter root.', 'easy', 'root-count'),
  (v_q02, 2, 'How many root letters does a رُبَاعِيّ verb have?',
   '["A. Three","B. Four","C. Five","D. Six"]'::jsonb, 'B',
   'رُبَاعِيّ means "of four" — a verb built on a four-letter root.', 'easy', 'root-count'),
  (v_q02, 3, 'The three tenses of the Arabic verb are:',
   '["A. Past, Present, Future","B. Past, Present/Future, Command","C. Past, Active, Passive","D. Perfect, Imperfect, Pluperfect"]'::jsonb, 'B',
   'الماضي (past), المضارع (present/future), الأمر (command) — three tenses.', 'easy', 'tense'),
  (v_q02, 4, 'What is a مُجَرَّد verb?',
   '["A. A verb with extra letters added","B. A verb at its bare root, no extra letters","C. A past-tense verb only","D. A feminine verb"]'::jsonb, 'B',
   'مُجَرَّد = "stripped" / bare root. مَزِيد = root with extra letters added.', 'easy', 'mujarrad-mazeed'),
  (v_q02, 5, 'Which of these is a past-tense verb (الماضي)?',
   '["A. يَكْتُبُ","B. كَتَبَ","C. اُكْتُبْ","D. كَاتِب"]'::jsonb, 'B',
   'كَتَبَ = "he wrote" — past tense. يَكْتُبُ is present; اُكْتُبْ is command; كَاتِب is an ism (active participle).', 'easy', 'tense'),
  (v_q02, 6, 'Which of these is a present-tense verb (المضارع)?',
   '["A. نَصَرَ","B. يَنْصُرُ","C. اُنْصُرْ","D. نَاصِر"]'::jsonb, 'B',
   'يَنْصُرُ = "he helps / is helping" — المضارع. نَصَرَ is past; اُنْصُرْ is command.', 'easy', 'tense'),
  (v_q02, 7, 'What are the three letters of a ثُلَاثِيّ verb called (in order)?',
   '["A. الأَوَّل، الثَّانِي، الثَّالِث","B. فَاءُ الفِعْلِ، عَيْنُ الفِعْلِ، لَامُ الفِعْلِ","C. الفَاءُ، العَيْنُ، اللَّامُ","D. Both B and C refer to the same naming convention"]'::jsonb, 'D',
   'Each root letter is named after its position in the pattern فَعَلَ: فاء الفعل (1st), عين الفعل (2nd), لام الفعل (3rd).', 'medium', 'root-letters'),
  (v_q02, 8, 'In the verb نَصَرَ, which letter is the عَيْنُ الفِعْلِ?',
   '["A. ن","B. ص","C. ر","D. There is no ''ayn al-fi''l in this word"]'::jsonb, 'B',
   'The middle letter (2nd position) is the عَيْن — here that is ص.', 'medium', 'root-letters'),
  (v_q02, 9, 'The تَاءُ التَّأْنِيثِ السَّاكِنَةِ (silent ـتْ at the end of a verb) signals:',
   '["A. The verb is present tense","B. The doer is masculine","C. The doer is feminine, and the verb is past tense","D. The verb is a command"]'::jsonb, 'C',
   'ـتْ at the end of a verb is the clearest marker that (a) the verb is past tense, and (b) the doer is feminine.', 'medium', 'feminine-taa'),
  (v_q02, 10, 'In ﴿فَلَمَّا وَضَعَتْهَا﴾, what does the ـتْ in وَضَعَتْ tell you?',
   '["A. The verb is present tense","B. The doer is feminine (تاء التأنيث الساكنة)","C. The doer is plural","D. The verb is a command"]'::jsonb, 'B',
   'The ـتْ is the silent تاء التأنيث: Hannah, the mother of Maryam, is the feminine doer.', 'medium', 'analysis'),
  (v_q02, 11, 'The bare 3-letter verb (الثُّلَاثِيّ المُجَرَّد) comes on THREE patterns that differ only in:',
   '["A. The first letter''s vowel","B. The last letter''s vowel","C. The middle letter''s vowel (عين الفعل)","D. The number of letters"]'::jsonb, 'C',
   'The three patterns differ only in the vowel on the عين الفعل (middle letter): fatḥah, kasrah, or ḍammah.', 'medium', 'patterns'),
  (v_q02, 12, 'Classify each verb: دَحْرَجَ / تَدَحْرَجَ',
   '["A. Both are ثُلَاثِيّ مُجَرَّد","B. دَحْرَجَ is رباعيّ مجرّد; تَدَحْرَجَ is رباعيّ مزيد","C. Both are ثُلَاثِيّ مَزِيد","D. دَحْرَجَ is ثُلَاثِيّ; تَدَحْرَجَ is رُبَاعِيّ"]'::jsonb, 'B',
   'دَحْرَجَ has four root letters (د ح ر ج), bare — رباعيّ مجرّد. تَدَحْرَجَ has the same four plus a تـ prefix — رباعيّ مزيد.', 'hard', 'analysis'),
  (v_q02, 13, 'Which of these is NOT a fi''l?',
   '["A. اِسْتَغْفَرَ","B. أَكْرَمَ","C. كَاتِب","D. اِنْكَسَرَ"]'::jsonb, 'C',
   'كَاتِب is an ism (active participle = "one who writes"). The other three are verbs (mazeed forms).', 'hard', 'analysis'),
  (v_q02, 14, 'For the verb فَتَحَ, identify the فاء الفعل, عين الفعل, and لام الفعل in order.',
   '["A. ف، ت، ح","B. ف، ح، ت","C. ح، ت، ف","D. ت، ف، ح"]'::jsonb, 'A',
   'فَتَحَ has three root letters: ف (1st = فاء الفعل), ت (middle = عين الفعل), ح (last = لام الفعل).', 'hard', 'root-letters'),
  (v_q02, 15, 'Which statement is TRUE about the seven categories of the verb by letter count?',
   '["A. There are 4 ثلاثيّ categories and 3 رباعيّ categories","B. There are 3 ثلاثيّ and 4 رباعيّ categories","C. All seven categories are ثلاثيّ","D. The seven categories correspond to the seven modes of recitation"]'::jsonb, 'A',
   'ثلاثي has 4 sub-categories (مجرّد, مزيد +1, +2, +3) and رباعي has 3 (مجرّد, مزيد +1, +2) — totaling 7.', 'hard', 'root-count');

  -- =========================================================================
  -- LESSON 03: نَوْعُ الاسْمِ (١): عَلَمٌ، نَكِرَةٌ، مَعْرِفَةٌ
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch03, 'Quiz: عَلَمٌ، نَكِرَةٌ، مَعْرِفَةٌ', 'Proper, indefinite, and definite isms; tanween as the tell-tale of the nakirah.', 10, true, now())
  RETURNING id INTO v_q03;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q03, 1, 'What is an عَلَم?',
   '["A. Any noun beginning with ال","B. A proper name — the specific name of a person, place, or thing","C. A noun that carries tanween","D. A verb in the past tense"]'::jsonb, 'B',
   'عَلَم is a proper name — مُحَمَّد, مَكَّة, جِبْرِيل. It names one specific thing.', 'easy', 'alam'),
  (v_q03, 2, 'What is a نَكِرَة?',
   '["A. A definite ism","B. A proper name","C. An indefinite ism (generic, unspecified)","D. A verb"]'::jsonb, 'C',
   'نَكِرَة is indefinite — "a book" (كِتَابٌ), "a man" (رَجُلٌ) — not pointing to a specific one.', 'easy', 'nakirah'),
  (v_q03, 3, 'What is a مَعْرِفَة?',
   '["A. A proper name only","B. An indefinite ism","C. A definite ism — one that refers to a specific, known thing","D. A verb"]'::jsonb, 'C',
   'مَعْرِفَة is definite — made specific by ال, by being a proper name, by iḍāfah, by a pronoun, etc.', 'easy', 'marifah'),
  (v_q03, 4, 'The most common tell-tale of a nakirah ism is:',
   '["A. The prefix ال","B. Tanween (the double-vowel ending like ـٌ, ـٍ, ـً)","C. A ة at the end","D. A kasrah on the first letter"]'::jsonb, 'B',
   'Tanween on an ism is the tell-tale signal that it is indefinite (nakirah).', 'easy', 'nakirah'),
  (v_q03, 5, 'Which of these is a مَعْرِفَة?',
   '["A. رَجُلٌ","B. كِتَابٌ","C. البَيْتُ","D. قَلَمٌ"]'::jsonb, 'C',
   'البَيْتُ is definite (has ال). The others have tanween and are nakirah.', 'easy', 'marifah'),
  (v_q03, 6, 'Which of these is a عَلَم?',
   '["A. الكِتَاب","B. مُحَمَّد","C. رَجُلٌ","D. المَسْجِد"]'::jsonb, 'B',
   'مُحَمَّد is a proper name — an عَلَم. الكِتَاب is maʿrifah (with ال); رَجُلٌ is nakirah.', 'easy', 'alam'),
  (v_q03, 7, 'Classify كِتَابٌ. (Is it ʿalam, nakirah, or maʿrifah?)',
   '["A. ʿalam","B. nakirah","C. maʿrifah by ال","D. maʿrifah by iḍāfah"]'::jsonb, 'B',
   'The tanween (ـٌ) marks it as indefinite — nakirah.', 'medium', 'analysis'),
  (v_q03, 8, 'Classify الطَّالِبُ. (ʿalam, nakirah, or maʿrifah?)',
   '["A. ʿalam","B. nakirah","C. maʿrifah — definite by ال","D. It is a fi''l"]'::jsonb, 'C',
   'الطَّالِب carries ال and no tanween — it is definite (maʿrifah).', 'medium', 'analysis'),
  (v_q03, 9, 'Classify إِبْرَاهِيم. (ʿalam, nakirah, or maʿrifah?)',
   '["A. ʿalam — a proper name","B. nakirah","C. maʿrifah by ال","D. It is a harf"]'::jsonb, 'A',
   'إِبْرَاهِيم is a proper name (name of a prophet) — an عَلَم, and therefore already maʿrifah.', 'medium', 'analysis'),
  (v_q03, 10, 'An عَلَم is ALWAYS:',
   '["A. nakirah","B. maʿrifah","C. either one depending on context","D. marked with tanween"]'::jsonb, 'B',
   'A proper name is inherently specific — it is always a form of maʿrifah.', 'medium', 'alam'),
  (v_q03, 11, 'Which ism is maʿrifah through a possessive (iḍāfah/pronoun suffix) rather than through ال?',
   '["A. كِتَابٌ","B. الكِتَابُ","C. كِتَابُهُ","D. كِتَابٍ"]'::jsonb, 'C',
   'كِتَابُهُ = "his book". The possessive pronoun هُ makes the ism definite — maʿrifah by iḍāfah, no ال needed.', 'hard', 'marifah'),
  (v_q03, 12, 'In ﴿بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ﴾, how many of the named isms (اسْم، اللَّه، الرَّحْمَٰن، الرَّحِيم) are maʿrifah?',
   '["A. One","B. Two","C. Three","D. All four"]'::jsonb, 'D',
   'اسْم is maʿrifah by iḍāfah to اللَّه; اللَّه is an ʿalam; الرَّحْمَٰن and الرَّحِيم both carry ال. All four are maʿrifah.', 'hard', 'analysis'),
  (v_q03, 13, 'Why can a word with ال NOT also carry tanween at the same time?',
   '["A. Because ال already marks it as definite; tanween is the marker of indefiniteness","B. Because ال is a silent letter","C. Because Arabic words cannot have more than one vowel","D. Because ال only appears on verbs"]'::jsonb, 'A',
   'ال and tanween mark opposite states — definite vs indefinite. A single ism is one or the other, never both.', 'hard', 'concept'),
  (v_q03, 14, 'Which list contains ONLY nakirah isms?',
   '["A. مُحَمَّدٌ، كِتَابٌ، رَجُلٌ","B. كِتَابٌ، رَجُلٌ، مَسْجِدٌ","C. الكِتَاب، الرَّجُل، المَسْجِد","D. كِتَابُهُ، بَيْتُهُ، قَلَمُهُ"]'::jsonb, 'B',
   'List B has three words all with tanween and no ال — all nakirah. A includes an ʿalam (maʿrifah). C has ال — all maʿrifah. D has pronoun suffixes — maʿrifah.', 'hard', 'analysis'),
  (v_q03, 15, 'In ﴿وَجَاءَ رَجُلٌ مِنْ أَقْصَى المَدِينَةِ يَسْعَى﴾, classify رَجُلٌ and المَدِينَةِ.',
   '["A. Both are nakirah","B. Both are maʿrifah","C. رَجُلٌ is nakirah; المَدِينَةِ is maʿrifah","D. رَجُلٌ is maʿrifah; المَدِينَةِ is nakirah"]'::jsonb, 'C',
   'رَجُلٌ carries tanween — nakirah ("a man"). المَدِينَةِ has ال — maʿrifah ("the city").', 'hard', 'analysis');

  -- =========================================================================
  -- LESSON 04: مُلْحَقٌ — أَحْكَامُ الـ وَالهَمْزَةِ
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch04, 'Quiz: أَحْكَامُ الـ وَالهَمْزَةِ', 'Al Qamariyyah vs Shamsiyyah, hamzatul-waṣl vs hamzatul-qaṭʿ, and writing the hamzah.', 10, true, now())
  RETURNING id INTO v_q04;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q04, 1, 'How many letters is ال Qamariyyah applied to?',
   '["A. 10","B. 12","C. 14","D. 28"]'::jsonb, 'C',
   'There are 14 Qamariyyah letters (and 14 Shamsiyyah letters — together they cover all 28).', 'easy', 'counts'),
  (v_q04, 2, 'With ال القَمَرِيَّة, the lām is:',
   '["A. Silent","B. Pronounced clearly with sukūn","C. Doubled with a shaddah","D. Replaced by a hamzah"]'::jsonb, 'B',
   'ال قمرية = the lām is pronounced clearly with sukūn (e.g., الْقَمَر — al-qamar).', 'easy', 'qamariyyah'),
  (v_q04, 3, 'With ال الشَّمْسِيَّة, what happens?',
   '["A. The lām is pronounced clearly","B. The lām is silent and the next letter is doubled with shaddah","C. The lām is replaced by a fatḥah","D. The word becomes indefinite"]'::jsonb, 'B',
   'ال شمسية = the lām is silent; the next letter carries a shaddah (e.g., الشَّمْس — ash-shams).', 'easy', 'shamsiyyah'),
  (v_q04, 4, 'Which of these words has ال قمرية?',
   '["A. الشَّمْس","B. الرَّجُل","C. القَمَر","D. النَّاس"]'::jsonb, 'C',
   'القَمَر starts with ق — a qamariyyah letter. ش / ر / ن are all shamsiyyah.', 'easy', 'qamariyyah'),
  (v_q04, 5, 'Which of these words has ال شمسية?',
   '["A. الكِتَاب","B. البَيْت","C. الشَّمْس","D. الجَبَل"]'::jsonb, 'C',
   'الشَّمْس starts with ش — a shamsiyyah letter. Notice the shaddah on ش.', 'easy', 'shamsiyyah'),
  (v_q04, 6, 'Which of the following is a Shamsiyyah letter?',
   '["A. ب","B. ر","C. ك","D. ه"]'::jsonb, 'B',
   'ر is one of the 14 Shamsiyyah letters. The others listed are all Qamariyyah.', 'medium', 'shamsiyyah'),
  (v_q04, 7, 'هَمْزَةُ الوَصْل is:',
   '["A. Always pronounced, whether at the start or middle of speech","B. Pronounced only at the start of speech; dropped in the middle","C. Never pronounced","D. The hamzah in words like أَبٌ and إِنَّ"]'::jsonb, 'B',
   'Hamzatul-waṣl is a "connecting" hamzah — pronounced only when speech begins with it; dropped when it comes in the middle of speech.', 'medium', 'hamzatul-wasl'),
  (v_q04, 8, 'هَمْزَةُ القَطْع is:',
   '["A. Always pronounced, at the start or middle of speech","B. Only pronounced at the start of speech","C. Always silent","D. The hamzah of ال"]'::jsonb, 'A',
   'Hamzatul-qaṭʿ (e.g., أَب, إِنَّ, أُمّ) is always pronounced. It is the "cutting" hamzah.', 'medium', 'hamzatul-qat'),
  (v_q04, 9, 'In ﴿بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ﴾, how is the ا of الرَّحْمَٰن pronounced when connected to the previous word?',
   '["A. Pronounced fully as ''al''","B. Dropped — the reader glides from اللَّهِ into رَّحْمَٰن","C. Replaced by a fatḥah","D. Read as a long vowel"]'::jsonb, 'B',
   'The hamzatul-waṣl drops in the middle of speech. You say "bismi llāhi r-raḥmān" — no "al" sound.', 'medium', 'hamzatul-wasl'),
  (v_q04, 10, 'For a hamzah in the MIDDLE of a word, its seat is determined by:',
   '["A. The number of letters in the word","B. The stronger of the two surrounding vowels (kasrah > ḍammah > fatḥah > sukūn)","C. Whether the word is a noun or a verb","D. The gender of the word"]'::jsonb, 'B',
   'The seat (مَقْعَد) follows the strongest nearby vowel: kasrah > ḍammah > fatḥah > sukūn.', 'medium', 'kitabah'),
  (v_q04, 11, 'The hamzah at the start of a word with kasrah is written:',
   '["A. Above the alif: أِ","B. Below the alif: إ","C. On a yāʾ seat: ئ","D. On a wāw seat: ؤ"]'::jsonb, 'B',
   'Kasrah under the alif — إِ. Example: إِنَّ، إِلَى.', 'medium', 'kitabah'),
  (v_q04, 12, 'In سُؤَال, why is the middle hamzah on a wāw seat?',
   '["A. Because of the sukūn before it","B. Because the hamzah carries fatḥah and the letter before it carries ḍammah — ḍammah is stronger than fatḥah","C. Because all middle hamzahs sit on wāw","D. It is a spelling exception"]'::jsonb, 'B',
   'The hamzah carries fatḥah; the preceding letter has ḍammah. Since ḍammah is the stronger, the seat is wāw (ؤ).', 'hard', 'kitabah'),
  (v_q04, 13, 'Which word is a "Special Case 2" where the initial hamzah drops permanently when ال is added?',
   '["A. ابْن","B. اسْم","C. امْرَأَة → المَرْأَة","D. القَمَر"]'::jsonb, 'C',
   'امْرَأَة loses its initial hamzah when ال enters: المَرْأَة (not الامْرَأَة). ابْن and اسْم are Special Case 1 (hamzatul-waṣl type); القَمَر is a normal qamariyyah example.', 'hard', 'kitabah'),
  (v_q04, 14, 'At the END of a word, the seat of the hamzah is determined by:',
   '["A. The harakah of the hamzah itself","B. The harakah of the letter BEFORE the hamzah","C. Whether the word ends in ة","D. The gender of the word"]'::jsonb, 'B',
   'End-position rule: look at the vowel on the letter before the hamzah. kasrah → ئ, ḍammah → ؤ, fatḥah → أ, sukūn/madd → ء.', 'hard', 'kitabah'),
  (v_q04, 15, 'Classify the hamzah in إِنَّ and the hamzah in اسْم.',
   '["A. Both are هَمْزَةُ الوَصْل","B. Both are هَمْزَةُ القَطْع","C. إِنَّ = هَمْزَةُ القَطْع; اسْم = هَمْزَةُ الوَصْل","D. إِنَّ = هَمْزَةُ الوَصْل; اسْم = هَمْزَةُ القَطْع"]'::jsonb, 'C',
   'إِنَّ has a قطع hamzah — always pronounced. اسْم has a وصل hamzah — drops in the middle of speech (e.g., مَا اسْمُكَ → mā smuk).', 'hard', 'analysis');

  -- =========================================================================
  -- LESSON 05: نَوْعُ الاسْمِ (٢) — المُذَكَّرُ وَالمُؤَنَّثُ، العَاقِلُ وَغَيْرُ العَاقِلِ
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch05, 'Quiz: المُذَكَّرُ وَالمُؤَنَّثُ، العَاقِلُ وَغَيْرُ العَاقِلِ', 'Classifying every ism into one of four families (gender × human/non-human).', 10, true, now())
  RETURNING id INTO v_q05;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q05, 1, 'How many "families" does every ism fall into based on gender and human/non-human?',
   '["A. Two","B. Three","C. Four","D. Six"]'::jsonb, 'C',
   'Two questions × two answers = four families: ʿāqil-masc, ʿāqil-fem, ghayr-ʿāqil-masc, ghayr-ʿāqil-fem.', 'easy', 'families'),
  (v_q05, 2, 'What does العَاقِل mean (in this classification)?',
   '["A. Things","B. Animals","C. Humans (the ones who reason)","D. Angels only"]'::jsonb, 'C',
   'ʿāqil literally = "the one who reasons". For this lesson think of it simply as people.', 'easy', 'aaqil'),
  (v_q05, 3, 'The most common tell-tale of a feminine ism is:',
   '["A. A kasrah on the first letter","B. The letter ة (tāʾ marbūṭah) at the end","C. The letter ا at the end","D. The prefix ال"]'::jsonb, 'B',
   'ة at the end is the most common mark of a feminine ism, though not the only one.', 'easy', 'gender'),
  (v_q05, 4, 'Classify الكِتَاب.',
   '["A. ʿāqil — mudhakkar","B. ʿāqil — muʾannath","C. ghayr ʿāqil — mudhakkar","D. ghayr ʿāqil — muʾannath"]'::jsonb, 'C',
   'الكِتَاب = book — non-human (ghayr ʿāqil), masculine (no ة, masc. by form).', 'easy', 'classification'),
  (v_q05, 5, 'Classify المَدْرَسَة.',
   '["A. ʿāqil — mudhakkar","B. ʿāqil — muʾannath","C. ghayr ʿāqil — mudhakkar","D. ghayr ʿāqil — muʾannath"]'::jsonb, 'D',
   'المَدْرَسَة = school — non-human (ghayr ʿāqil), feminine (ة at end).', 'easy', 'classification'),
  (v_q05, 6, 'Classify الطَّالِب.',
   '["A. ʿāqil — mudhakkar","B. ʿāqil — muʾannath","C. ghayr ʿāqil — mudhakkar","D. ghayr ʿāqil — muʾannath"]'::jsonb, 'A',
   'الطَّالِب = the (male) student — human (ʿāqil), masculine.', 'easy', 'classification'),
  (v_q05, 7, 'Classify الطَّالِبَة.',
   '["A. ʿāqil — mudhakkar","B. ʿāqil — muʾannath","C. ghayr ʿāqil — mudhakkar","D. ghayr ʿāqil — muʾannath"]'::jsonb, 'B',
   'الطَّالِبَة = the (female) student — human, feminine (the ة marks it).', 'easy', 'classification'),
  (v_q05, 8, 'Classify مَرْيَم.',
   '["A. ʿāqil — mudhakkar","B. ʿāqil — muʾannath (feminine without ة)","C. ghayr ʿāqil — mudhakkar","D. ghayr ʿāqil — muʾannath"]'::jsonb, 'B',
   'مَرْيَم is a woman''s name — feminine by usage, no ة. Same class as زَيْنَب, هِنْد.', 'medium', 'classification'),
  (v_q05, 9, 'Classify أُسَامَة.',
   '["A. ʿāqil — mudhakkar (masculine despite the ة)","B. ʿāqil — muʾannath","C. ghayr ʿāqil — mudhakkar","D. ghayr ʿāqil — muʾannath"]'::jsonb, 'A',
   'أُسَامَة is a man''s name — masculine despite ending in ة. Same class as حَمْزَة, طَلْحَة, مُعَاوِيَة.', 'medium', 'classification'),
  (v_q05, 10, 'Which of these common nouns is FEMININE even though it has no ة?',
   '["A. كِتَاب","B. عَيْن (eye)","C. قَلَم","D. بَيْت"]'::jsonb, 'B',
   'عَيْن (eye) is feminine by usage — like يَد (hand), رِجْل (leg), أُذُن (ear). These body parts in pairs are feminine.', 'medium', 'feminine-no-taa'),
  (v_q05, 11, 'Which of the following is FEMININE by meaning (applied only to women)?',
   '["A. الطَّالِب","B. الكَاتِب","C. الحَامِل","D. الرَّاوِي"]'::jsonb, 'C',
   'الحَامِل (pregnant woman) and الحَائِض (menstruating woman) are feminine by meaning — they need no ة because they are only ever applied to women.', 'medium', 'feminine-no-taa'),
  (v_q05, 12, 'Why does the ʿāqil vs ghayr ʿāqil distinction matter?',
   '["A. It decides whether the ism can take ال","B. It decides which plural patterns the ism can accept","C. It decides whether the ism is nakirah","D. It has no practical effect"]'::jsonb, 'B',
   'A non-human masc. ism cannot take the sound masculine plural (e.g., no كِتَابُونَ). It takes a broken plural instead. The ʿāqil distinction decides which plural tools are available.', 'hard', 'why-it-matters'),
  (v_q05, 13, 'Which list contains ONLY ghayr-ʿāqil isms?',
   '["A. كِتَاب، قَلَم، بَيْت","B. رَجُل، كِتَاب، بَيْت","C. مَرْيَم، مَدْرَسَة، بَقَرَة","D. طَالِب، كَاتِب، عَالِم"]'::jsonb, 'A',
   'All three are non-human things. List B has رَجُل (human); C has مَرْيَم (human); D are all humans.', 'hard', 'analysis'),
  (v_q05, 14, 'Classify حَمْزَة (the Companion).',
   '["A. ʿāqil — mudhakkar (masc. despite ة)","B. ʿāqil — muʾannath","C. ghayr ʿāqil — mudhakkar","D. ghayr ʿāqil — muʾannath"]'::jsonb, 'A',
   'حَمْزَة is the name of a man (the Prophet''s uncle ﷺ). Masculine despite the ة.', 'hard', 'classification'),
  (v_q05, 15, 'Using ﴿خَلَقَ الإِنْسَانَ مِنْ عَلَقٍ﴾, classify الإِنْسَان and عَلَق.',
   '["A. Both ʿāqil masc.","B. Both ghayr ʿāqil masc.","C. الإِنْسَان = ʿāqil masc.; عَلَق = ghayr ʿāqil masc.","D. الإِنْسَان = ghayr ʿāqil fem.; عَلَق = ʿāqil masc."]'::jsonb, 'C',
   'الإِنْسَان (the human) is ʿāqil, masc. عَلَق (a clinging clot) is ghayr ʿāqil, masc. Same gender, different families — which decides how they pluralise.', 'hard', 'analysis');

  -- =========================================================================
  -- LESSON 06: مَوْقِعُ الاسْمِ فِي المُفْرَدِ — Position on the Singular
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch06, 'Quiz: مَوْقِعُ الاسْمِ فِي المُفْرَدِ', 'The three positions (rafʿ, naṣb, jarr) on the singular, and the diptote exception.', 10, true, now())
  RETURNING id INTO v_q06;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q06, 1, 'How many positions (مَوَاقِع) does an ism have in a sentence?',
   '["A. Two","B. Three","C. Four","D. Seven"]'::jsonb, 'B',
   'Three positions: رَفْع, نَصْب, جَرّ.', 'easy', 'positions'),
  (v_q06, 2, 'What vowel marks الرَّفْع on a singular ism (by default)?',
   '["A. Fatḥah","B. Kasrah","C. Ḍammah","D. Sukūn"]'::jsonb, 'C',
   'Rafʿ is marked by ḍammah (ـُ, or tanween ḍammah ـٌ when indefinite).', 'easy', 'positions'),
  (v_q06, 3, 'What vowel marks النَّصْب on a singular ism (by default)?',
   '["A. Fatḥah","B. Kasrah","C. Ḍammah","D. Sukūn"]'::jsonb, 'A',
   'Naṣb is marked by fatḥah (ـَ, or tanween fatḥah ـً when indefinite).', 'easy', 'positions'),
  (v_q06, 4, 'What vowel marks الجَرّ on a singular ism (by default)?',
   '["A. Fatḥah","B. Kasrah","C. Ḍammah","D. Sukūn"]'::jsonb, 'B',
   'Jarr is marked by kasrah (ـِ, or tanween kasrah ـٍ when indefinite).', 'easy', 'positions'),
  (v_q06, 5, 'An ism after a preposition (مِنْ، فِي، عَلَى، إِلَى) is in which position?',
   '["A. Rafʿ","B. Naṣb","C. Jarr","D. None — prepositions don''t affect isms"]'::jsonb, 'C',
   'Prepositions put the following ism into jarr — hence "jarr" is sometimes called "the genitive / preposition case".', 'easy', 'positions'),
  (v_q06, 6, 'The subject (fāʿil) of a verb is in which position?',
   '["A. Rafʿ","B. Naṣb","C. Jarr","D. Any of the three"]'::jsonb, 'A',
   'The doer (fāʿil) of a verb sits in rafʿ.', 'easy', 'positions'),
  (v_q06, 7, 'The direct object (mafʿūl bih) of a verb is in which position?',
   '["A. Rafʿ","B. Naṣb","C. Jarr","D. It depends"]'::jsonb, 'B',
   'A direct object takes naṣb (fatḥah).', 'medium', 'positions'),
  (v_q06, 8, 'What is مَمْنُوعٌ مِنَ الصَّرْفِ (diptote)?',
   '["A. A word that cannot take ال","B. A word that refuses tanween, and whose jarr is marked by fatḥah instead of kasrah","C. A word that is always definite","D. A verb that cannot be conjugated"]'::jsonb, 'B',
   'Diptotes refuse tanween entirely, and in jarr they take fatḥah instead of kasrah.', 'medium', 'diptote'),
  (v_q06, 9, 'Which of these words is a diptote (مَمْنُوع مِنَ الصَّرْف)?',
   '["A. كِتَاب","B. إِبْرَاهِيم","C. رَجُل","D. قَلَم"]'::jsonb, 'B',
   'إِبْرَاهِيم is a well-known diptote (non-Arabic proper name of more than three letters).', 'medium', 'diptote'),
  (v_q06, 10, 'In ﴿قُلْ هُوَ اللَّهُ أَحَدٌ﴾, what position is أَحَدٌ in?',
   '["A. Rafʿ (ḍammah tanween — khabar)","B. Naṣb","C. Jarr","D. No position — it is a verb"]'::jsonb, 'A',
   'أَحَدٌ carries tanween ḍammah (ـٌ), marking rafʿ. It is the khabar in a nominal sentence.', 'medium', 'analysis'),
  (v_q06, 11, 'In ﴿خَلَقَ الإِنْسَانَ مِنْ عَلَقٍ﴾, identify the positions of الإِنْسَان and عَلَق.',
   '["A. Both rafʿ","B. الإِنْسَان = naṣb (mafʿūl bih); عَلَق = jarr (after مِنْ)","C. Both jarr","D. الإِنْسَان = rafʿ; عَلَق = naṣb"]'::jsonb, 'B',
   'الإِنْسَانَ has fatḥah — the direct object of خَلَقَ, so naṣb. عَلَقٍ has kasrah tanween after مِنْ — jarr.', 'medium', 'analysis'),
  (v_q06, 12, 'If إِبْرَاهِيم appears after a preposition (e.g., إِلَى إِبْرَاهِيمَ), what vowel does it take?',
   '["A. kasrah (normal jarr)","B. fatḥah (diptote rule — fatḥah instead of kasrah)","C. ḍammah","D. Any of the three"]'::jsonb, 'B',
   'Diptote jarr rule: kasrah is replaced by fatḥah, and no tanween appears.', 'hard', 'diptote'),
  (v_q06, 13, 'Which of these is NOT a reason for an ism to be مَمْنُوع مِنَ الصَّرْف?',
   '["A. It is a non-Arabic proper name of more than three letters (e.g., إِبْرَاهِيم)","B. It is a proper name ending in ة (e.g., مُعَاوِيَة)","C. It is a proper name with no vowels","D. It is feminine by usage (e.g., مَرْيَم, زَيْنَب)"]'::jsonb, 'C',
   'Diptote reasons include foreign origin, ة-ending names, feminine names, and certain patterns — but "no vowels" is not one.', 'hard', 'diptote'),
  (v_q06, 14, 'Compare أَحَدٌ (in ﴿قُلْ هُوَ اللَّهُ أَحَدٌ﴾) and أَحَدَ. What is the difference?',
   '["A. They are different words","B. أَحَدٌ is in rafʿ (tanween ḍammah); أَحَدَ would be in naṣb","C. أَحَدٌ is a verb; أَحَدَ is an ism","D. Same word, same position"]'::jsonb, 'B',
   'Same word, different positions. أَحَدٌ = rafʿ (tanween ḍammah). أَحَدَ = naṣb (fatḥah).', 'hard', 'analysis'),
  (v_q06, 15, 'In ﴿يَا مَرْيَمُ اقْنُتِي لِرَبِّكِ﴾, what position is مَرْيَمُ in, and why does it take ḍammah without tanween?',
   '["A. Naṣb — because it is after يا","B. Rafʿ — and it is a diptote, so no tanween","C. Jarr — and diptotes refuse tanween","D. It is a verb, so no position applies"]'::jsonb, 'B',
   'A proper name after يا (vocative) takes ḍammah; and مَرْيَم is a diptote, so no tanween appears.', 'hard', 'analysis');

  -- =========================================================================
  -- LESSON 07: المُثَنَّى — The Dual
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch07, 'Quiz: المُثَنَّى', 'The dual: ـَانِ in rafʿ, ـَيْنِ in naṣb and jarr; rules for ال on proper names and ة→ت.', 10, true, now())
  RETURNING id INTO v_q07;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q07, 1, 'Which suffix marks the dual in الرَّفْع?',
   '["A. ـَيْنِ","B. ـُونَ","C. ـَانِ","D. ـَات"]'::jsonb, 'C',
   'Dual rafʿ = ـَانِ (e.g., الكِتَابَانِ).', 'easy', 'suffixes'),
  (v_q07, 2, 'Which suffix marks the dual in النَّصْب and الجَرّ?',
   '["A. ـَانِ","B. ـَيْنِ","C. ـُونَ","D. ـِينَ"]'::jsonb, 'B',
   'Dual naṣb/jarr = ـَيْنِ (e.g., الكِتَابَيْنِ).', 'easy', 'suffixes'),
  (v_q07, 3, 'How many distinct shapes does the dual have across the three positions?',
   '["A. One","B. Two","C. Three","D. Four"]'::jsonb, 'B',
   'Two: ـَانِ for rafʿ, ـَيْنِ for both naṣb and jarr.', 'easy', 'suffixes'),
  (v_q07, 4, 'What is the dual of كِتَاب in rafʿ?',
   '["A. كِتَابُونَ","B. كِتَابَيْنِ","C. كِتَابَانِ","D. كِتَابَات"]'::jsonb, 'C',
   'Add ـَانِ: كِتَابَانِ.', 'easy', 'formation'),
  (v_q07, 5, 'What is the dual of مَدْرَسَة in rafʿ?',
   '["A. مَدْرَسَتَانِ","B. مَدْرَسَاتَانِ","C. مَدْرَسَةَانِ","D. مَدْرَسَيْنِ"]'::jsonb, 'A',
   'The ة becomes ت before adding ـَانِ → مَدْرَسَتَانِ.', 'easy', 'formation'),
  (v_q07, 6, 'When forming the dual of a feminine ism ending in ة, what happens to the ة?',
   '["A. It is dropped","B. It is doubled","C. It becomes an open ت before the suffix","D. Nothing — the suffix just adds"]'::jsonb, 'C',
   'The ة unties into open ت: فَاطِمَة → فَاطِمَتَان, مَدْرَسَة → مَدْرَسَتَان.', 'medium', 'formation'),
  (v_q07, 7, 'What is the dual of the proper name مُحَمَّد in rafʿ (referring to two men both named Muhammad)?',
   '["A. مُحَمَّدَانِ","B. المُحَمَّدَانِ","C. مُحَمَّدِينَ","D. مُحَمَّدَات"]'::jsonb, 'B',
   'A proper name when dualised takes ال: المُحَمَّدَانِ.', 'medium', 'al-rule'),
  (v_q07, 8, 'What is the dual of فَاطِمَة (two women named Fatima) in rafʿ?',
   '["A. فَاطِمَتَانِ","B. الفَاطِمَتَانِ","C. الفَاطِمَاتَانِ","D. فَاطِمَاتَانِ"]'::jsonb, 'B',
   'Two rules apply: (1) ة → ت, (2) proper name takes ال → الفَاطِمَتَانِ.', 'medium', 'al-rule'),
  (v_q07, 9, 'What is the dual of بَيْت in naṣb?',
   '["A. بَيْتَانِ","B. بَيْتَيْنِ","C. بُيُوتَيْنِ","D. بَيْتَات"]'::jsonb, 'B',
   'Naṣb/jarr dual = ـَيْنِ → بَيْتَيْنِ.', 'medium', 'formation'),
  (v_q07, 10, 'In ﴿لَا وِتْرَانِ فِي لَيْلَةٍ﴾, classify وِتْرَانِ.',
   '["A. Singular, rafʿ","B. Dual, rafʿ","C. Dual, naṣb","D. Sound masc plural, rafʿ"]'::jsonb, 'B',
   'وِتْرَانِ ends in ـَانِ — dual in rafʿ. (Hadith: there are no two witrs in one night.)', 'medium', 'analysis'),
  (v_q07, 11, 'In ﴿فَوَجَدَ فِيهَا رَجُلَيْنِ يَقْتَتِلَانِ﴾, classify رَجُلَيْنِ.',
   '["A. Singular","B. Dual, rafʿ","C. Dual, naṣb (after وَجَدَ)","D. Broken plural"]'::jsonb, 'C',
   'رَجُلَيْنِ is dual — the ending ـَيْنِ. It is the direct object of وَجَدَ, so naṣb.', 'hard', 'analysis'),
  (v_q07, 12, 'In ﴿لِغُلَامَيْنِ يَتِيمَيْنِ﴾, classify غُلَامَيْنِ and يَتِيمَيْنِ.',
   '["A. Dual, rafʿ for both","B. Dual, naṣb for both","C. Dual, jarr (after لـ) for both","D. Singular, naṣb"]'::jsonb, 'C',
   'Both are dual (ـَيْنِ). لـ is a preposition → jarr. يَتِيمَيْنِ is an adjective agreeing in number, gender, and case.', 'hard', 'analysis'),
  (v_q07, 13, 'In ﴿فَفِئَةٌ تُقَاتِلُ فِي سَبِيلِ اللَّهِ وَأُخْرَىٰ﴾ and ﴿الْتَقَتَا فِئَتَانِ﴾ — what position is فِئَتَانِ in?',
   '["A. Rafʿ — fāʿil of الْتَقَتَا","B. Naṣb","C. Jarr","D. Singular"]'::jsonb, 'A',
   'فِئَتَانِ ends in ـَانِ = dual rafʿ. It is the subject (fāʿil) of الْتَقَتَا.', 'hard', 'analysis'),
  (v_q07, 14, 'Which of these statements about the dual is FALSE?',
   '["A. Its rafʿ shape is ـَانِ","B. Its naṣb and jarr shapes are identical (ـَيْنِ)","C. Proper names in the dual drop ال","D. Feminine isms ending in ة change ة to ت before the suffix"]'::jsonb, 'C',
   'The opposite is true: proper names TAKE ال when dualised (المُحَمَّدَانِ, الفَاطِمَتَانِ), because dualising makes them general enough to accept ال.', 'hard', 'rules'),
  (v_q07, 15, 'Form the dual of الطَّالِبَة in jarr (after preposition لـ):',
   '["A. لِلطَّالِبَاتِ","B. لِلطَّالِبَتَانِ","C. لِلطَّالِبَتَيْنِ","D. لِلطَّالِبَتَيِن"]'::jsonb, 'C',
   'ة→ت, retain ال, dual jarr suffix ـَيْنِ: لِلطَّالِبَتَيْنِ (the ل merges with ال).', 'hard', 'formation');

  -- =========================================================================
  -- LESSON 08: جَمْعُ المُذَكَّرِ السَّالِمِ — The Sound Masculine Plural
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch08, 'Quiz: جَمْعُ المُذَكَّرِ السَّالِمِ', 'Sound masculine plural: ـُونَ / ـِينَ, conditions for jāmid vs ṣifah, and classical exemplars.', 10, true, now())
  RETURNING id INTO v_q08;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q08, 1, 'What suffix marks the sound masculine plural in الرَّفْع?',
   '["A. ـَانِ","B. ـُونَ","C. ـِينَ","D. ـَاتُ"]'::jsonb, 'B',
   'Rafʿ = ـُونَ (e.g., المُسْلِمُونَ).', 'easy', 'suffixes'),
  (v_q08, 2, 'What suffix marks the sound masculine plural in النَّصْب and الجَرّ?',
   '["A. ـَيْنِ","B. ـُونَ","C. ـِينَ","D. ـَاتِ"]'::jsonb, 'C',
   'Naṣb and jarr = ـِينَ (e.g., المُسْلِمِينَ).', 'easy', 'suffixes'),
  (v_q08, 3, 'The sound masculine plural can ONLY be formed from isms that refer to:',
   '["A. Any living thing","B. Human males (ʿāqil + mudhakkar)","C. Any masculine noun including objects","D. Non-Arabic words"]'::jsonb, 'B',
   'The ism must refer to a male human (ʿāqil mudhakkar). No ism for objects or animals takes this plural.', 'easy', 'conditions'),
  (v_q08, 4, 'What is the sound masculine plural of مُسْلِم in rafʿ?',
   '["A. مُسْلِمَانِ","B. مُسْلِمُونَ","C. مُسْلِمِينَ","D. مُسْلِمَات"]'::jsonb, 'B',
   'Add ـُونَ for rafʿ: مُسْلِمُونَ.', 'easy', 'formation'),
  (v_q08, 5, 'What is the sound masculine plural of مُؤْمِن in naṣb?',
   '["A. مُؤْمِنُونَ","B. مُؤْمِنِينَ","C. مُؤْمِنَانِ","D. مُؤْمِنَات"]'::jsonb, 'B',
   'Naṣb = ـِينَ → مُؤْمِنِينَ.', 'easy', 'formation'),
  (v_q08, 6, 'Which of these CANNOT form a sound masculine plural?',
   '["A. مُسْلِم","B. مُؤْمِن","C. كِتَاب","D. صَادِق"]'::jsonb, 'C',
   'كِتَاب is not ʿāqil (it''s an object), so no sound masc plural. It takes a broken plural: كُتُب.', 'medium', 'conditions'),
  (v_q08, 7, 'The classical exemplar for the JĀMID category (proper name) taking sound masc plural is:',
   '["A. صَادِق","B. زَيْد → الزَّيْدُونَ","C. عَامِر","D. رَجُل"]'::jsonb, 'B',
   'زَيْد is the classical exemplar: a proper name of a male human, non-compound, no ة — 5 conditions met → الزَّيْدُونَ.', 'medium', 'jamid'),
  (v_q08, 8, 'The classical exemplar for the ṢIFAH (descriptive) category is:',
   '["A. زَيْد","B. صَادِق → صَادِقُونَ","C. فَاطِمَة","D. كِتَاب"]'::jsonb, 'B',
   'صَادِق is the classical exemplar: a descriptive ism (active participle), male, ʿāqil, no ة, standard pattern — 6 conditions met → صَادِقُونَ.', 'medium', 'sifah'),
  (v_q08, 9, 'How many conditions (shurūṭ) apply to the JĀMID (proper name) category?',
   '["A. Three","B. Four","C. Five","D. Six"]'::jsonb, 'C',
   'Five: (1) proper name (ʿalam), (2) male, (3) ʿāqil, (4) no ة (else use ذَوُو), (5) not a compound name.', 'medium', 'shurut'),
  (v_q08, 10, 'How many conditions (shurūṭ) apply to the ṢIFAH (descriptive) category?',
   '["A. Four","B. Five","C. Six","D. Seven"]'::jsonb, 'C',
   'Six: (1) male, (2) ʿāqil, (3) no ة (else sound fem plural), (4) not أَفْعَل/فَعْلَاء pattern, (5) not فَعْلَان/فَعْلَى pattern, (6) not epicene فَعِيل/فَعُول.', 'hard', 'shurut'),
  (v_q08, 11, 'Why can the proper name طَلْحَة NOT take the sound masculine plural directly?',
   '["A. Because it''s a non-Arabic name","B. Because it ends in ة","C. Because it''s feminine","D. Because طَلْحَة has too many letters"]'::jsonb, 'B',
   'One of the 5 conditions for the jāmid category is that the name does not end in ة. For such names, use ذَوُو + singular: ذَوُو طَلْحَة (Basri position).', 'hard', 'conditions'),
  (v_q08, 12, 'In ﴿قَدْ أَفْلَحَ المُؤْمِنُونَ﴾ (23:1), classify المُؤْمِنُونَ.',
   '["A. Sound masc plural in rafʿ","B. Sound masc plural in naṣb","C. Dual in rafʿ","D. Broken plural"]'::jsonb, 'A',
   'المُؤْمِنُونَ ends in ـُونَ — sound masc plural in rafʿ. Fāʿil of أَفْلَحَ.', 'hard', 'analysis'),
  (v_q08, 13, 'In ﴿لِلَّذِينَ يُنْفِقُونَ فِي السَّرَّاءِ وَالضَّرَّاءِ وَالكَاظِمِينَ الغَيْظَ وَالعَافِينَ عَنِ النَّاسِ وَاللَّهُ يُحِبُّ المُحْسِنِينَ﴾ (3:134), classify المُحْسِنِينَ.',
   '["A. Sound masc plural in rafʿ","B. Sound masc plural in naṣb (after يُحِبُّ)","C. Sound masc plural in jarr","D. Broken plural"]'::jsonb, 'B',
   'ـِينَ is naṣb/jarr. Here it is the direct object of يُحِبُّ → naṣb.', 'hard', 'analysis'),
  (v_q08, 14, 'In ﴿إِنَّ المُسْلِمِينَ وَالمُسْلِمَاتِ﴾ (33:35), why is المُسْلِمِينَ in naṣb?',
   '["A. Because of إِنَّ (the ism of إِنَّ takes naṣb)","B. It is in rafʿ, not naṣb","C. Because it comes after a preposition","D. Because it is a direct object"]'::jsonb, 'A',
   'إِنَّ causes its following ism to be in naṣb. المُسْلِمِينَ ends in ـِينَ = sound masc plural in naṣb.', 'hard', 'analysis'),
  (v_q08, 15, 'Which of the following adjectives CANNOT take the sound masculine plural?',
   '["A. صَادِق (truthful)","B. مُؤْمِن (believer)","C. أَحْمَر (red — pattern أَفْعَل)","D. حَاكِم (ruler)"]'::jsonb, 'C',
   'Pattern أَفْعَل (like أَحْمَر) with feminine counterpart فَعْلَاء (حَمْرَاء) is excluded from the ṣifah category. It takes a broken plural (حُمْر).', 'hard', 'conditions');

  -- =========================================================================
  -- LESSON 09: جَمْعُ المُؤَنَّثِ السَّالِمِ — The Sound Feminine Plural
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch09, 'Quiz: جَمْعُ المُؤَنَّثِ السَّالِمِ', 'Sound feminine plural: ـَات suffix, ة-drop rule, and kasrah replacing fatḥah in naṣb.', 10, true, now())
  RETURNING id INTO v_q09;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q09, 1, 'What is the suffix of the sound feminine plural?',
   '["A. ـَانِ","B. ـُونَ","C. ـَات","D. ـِينَ"]'::jsonb, 'C',
   'ـَات (e.g., مُسْلِمَات, مَدْرَسَات).', 'easy', 'suffix'),
  (v_q09, 2, 'When adding ـَات to a singular ending in ة, what happens to the ة?',
   '["A. Stays unchanged","B. Doubles into ـّة","C. Is dropped before adding ـَات","D. Becomes an alif"]'::jsonb, 'C',
   'Drop the ة first, then add ـَات: مَدْرَسَة → مَدْرَسَات.', 'easy', 'formation'),
  (v_q09, 3, 'What is the sound feminine plural of مُسْلِمَة?',
   '["A. مُسْلِمُونَ","B. مُسْلِمَات","C. مُسْلِمَتَانِ","D. مُسْلِمِينَ"]'::jsonb, 'B',
   'Drop ة, add ـَات: مُسْلِمَات.', 'easy', 'formation'),
  (v_q09, 4, 'What is the sound feminine plural of مَدْرَسَة?',
   '["A. مَدَارِس","B. مَدْرَسَات","C. مَدْرَسُونَ","D. مَدْرَسَتَانِ"]'::jsonb, 'B',
   'Drop ة, add ـَات: مَدْرَسَات.', 'easy', 'formation'),
  (v_q09, 5, 'What shape does the sound feminine plural take in naṣb?',
   '["A. ـَاتُ / ـَاتٌ","B. ـَاتِ / ـَاتٍ","C. ـُونَ","D. ـَيْنِ"]'::jsonb, 'B',
   'Naṣb = ـَاتِ (definite) or ـَاتٍ (indefinite). The fatḥah is replaced by kasrah.', 'medium', 'positions'),
  (v_q09, 6, 'In the sound feminine plural, naṣb and jarr share the SAME shape. What is that shape?',
   '["A. ـَاتُ","B. ـَاتِ / ـَاتٍ","C. ـُونَ / ـِينَ","D. ـَانِ / ـَيْنِ"]'::jsonb, 'B',
   'Both naṣb and jarr use ـَاتِ (or ـَاتٍ with tanween). Kasrah stands in for fatḥah in naṣb — a feature unique to sound fem plural.', 'medium', 'positions'),
  (v_q09, 7, 'What does the sound fem plural of فَاطِمَة look like in rafʿ (referring to multiple women named Fatima)?',
   '["A. فَاطِمَاتُ","B. الفَاطِمَاتُ","C. فَاطِمُونَ","D. فَوَاطِم"]'::jsonb, 'B',
   'Proper feminine names take ال when pluralised: الفَاطِمَاتُ. (فَوَاطِم is the broken plural.)', 'medium', 'proper-names'),
  (v_q09, 8, 'Which of these feminine isms does NOT take the sound feminine plural?',
   '["A. مُسْلِمَة","B. مَدْرَسَة","C. امْرَأَة","D. طَبِيبَة"]'::jsonb, 'C',
   'امْرَأَة takes a broken plural (النِّسَاء), not a sound fem plural. The others all take ـَات.', 'medium', 'exceptions'),
  (v_q09, 9, 'What is the correct plural of امْرَأَة?',
   '["A. امْرَأَات","B. امْرَآت","C. النِّسَاء","D. نَاس"]'::jsonb, 'C',
   'امْرَأَة → النِّسَاء (broken plural).', 'medium', 'exceptions'),
  (v_q09, 10, 'The plural of عَيْن (eye) is:',
   '["A. عَيْنَات","B. عُيُون","C. أَعْيُن","D. Both B and C are correct"]'::jsonb, 'D',
   'عَيْن → عُيُون (most common) or أَعْيُن — both are broken plurals. It refuses the sound fem plural (عَيْنَات is wrong).', 'hard', 'exceptions'),
  (v_q09, 11, 'In ﴿وَالمُطَلَّقَاتُ يَتَرَبَّصْنَ بِأَنْفُسِهِنَّ﴾ (2:228), classify المُطَلَّقَاتُ.',
   '["A. Sound fem plural in rafʿ (subject — mubtadaʾ)","B. Sound masc plural","C. Dual, rafʿ","D. Broken plural"]'::jsonb, 'A',
   'ـَاتُ signals sound fem plural in rafʿ. It is the subject (mubtadaʾ).', 'hard', 'analysis'),
  (v_q09, 12, 'In ﴿إِنَّ المُسْلِمِينَ وَالمُسْلِمَاتِ﴾ (33:35), classify المُسْلِمَاتِ.',
   '["A. Sound fem plural in rafʿ","B. Sound fem plural in naṣb (kasrah stands for fatḥah, after إِنَّ)","C. Sound fem plural in jarr","D. Sound masc plural"]'::jsonb, 'B',
   'إِنَّ causes naṣb. المُسْلِمَاتِ has ـَاتِ. For the sound fem plural, naṣb is marked by kasrah, not fatḥah.', 'hard', 'analysis'),
  (v_q09, 13, 'In ﴿فِي جَنَّاتٍ وَنَهَرٍ﴾ (54:54), classify جَنَّاتٍ.',
   '["A. Singular in jarr","B. Sound fem plural in rafʿ","C. Sound fem plural in jarr (indefinite — ـَاتٍ with tanween kasrah, after فِي)","D. Broken plural in naṣb"]'::jsonb, 'C',
   'ـَاتٍ after فِي = sound fem plural, indefinite, in jarr.', 'hard', 'analysis'),
  (v_q09, 14, 'Which statement about the sound feminine plural is TRUE?',
   '["A. It takes tanween when indefinite, and a single vowel when definite","B. It never takes tanween","C. It always takes tanween","D. Its naṣb and rafʿ shapes are identical"]'::jsonb, 'A',
   'Unlike the sound masc plural, the sound fem plural DOES take tanween: ـَاتٌ (rafʿ indef.) vs ـَاتُ (rafʿ def.), ـَاتٍ (naṣb/jarr indef.) vs ـَاتِ (naṣb/jarr def.).', 'hard', 'features'),
  (v_q09, 15, 'Form the sound fem plural of طَبِيبَة in naṣb (as the direct object of a verb):',
   '["A. طَبِيبَاتُ","B. طَبِيبَاتٌ","C. طَبِيبَاتِ / طَبِيبَاتٍ","D. طَبِيبَانِ"]'::jsonb, 'C',
   'Drop ة, add ـَات, naṣb indefinite = ـَاتٍ (with tanween kasrah replacing fatḥah), definite = ـَاتِ.', 'hard', 'formation');

  -- =========================================================================
  -- LESSON 10: جَمْعُ التَّكْسِيرِ — The Broken Plural
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch10, 'Quiz: جَمْعُ التَّكْسِيرِ', 'The broken plural: patterns, scope, diptote behaviour, and non-human agreement.', 10, true, now())
  RETURNING id INTO v_q10;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q10, 1, 'Why is it called جَمْعُ التَّكْسِيرِ ("broken plural")?',
   '["A. Because the word breaks during writing","B. Because the singular is re-shaped — vowels shift, letters get added or dropped","C. Because it only applies to broken/damaged things","D. Because the plural is always incomplete"]'::jsonb, 'B',
   'The singular is "broken apart" and reshaped, not just suffixed. So it is not سَالِم (sound).', 'easy', 'definition'),
  (v_q10, 2, 'Which of these is the default plural for most non-human masculine isms?',
   '["A. Sound masc plural","B. Sound fem plural","C. Broken plural","D. Dual"]'::jsonb, 'C',
   'Non-human masculine isms refuse the sound masc plural, so they default to the broken plural (e.g., كِتَاب → كُتُب).', 'easy', 'when'),
  (v_q10, 3, 'What is the plural of كِتَاب?',
   '["A. كِتَابَان","B. كِتَابُونَ","C. كِتَابَات","D. كُتُب"]'::jsonb, 'D',
   'كُتُب — broken plural.', 'easy', 'examples'),
  (v_q10, 4, 'What is the plural of رَجُل?',
   '["A. رَجُلُونَ","B. رِجَال","C. رَجُلَات","D. رَجُلَانِ"]'::jsonb, 'B',
   'رَجُل → رِجَال (broken plural). Note: رَجُل does NOT take the sound masc plural.', 'easy', 'examples'),
  (v_q10, 5, 'What is the plural of بَيْت?',
   '["A. بَيْتَات","B. أَبْيَات","C. بُيُوت","D. بَيْتُونَ"]'::jsonb, 'C',
   'بَيْت → بُيُوت (broken plural).', 'easy', 'examples'),
  (v_q10, 6, 'What is the plural of قَلَم?',
   '["A. أَقْلَام","B. قَلَمَات","C. قَلَمُونَ","D. قُلُوم"]'::jsonb, 'A',
   'قَلَم → أَقْلَام (broken plural).', 'medium', 'examples'),
  (v_q10, 7, 'Once a broken plural is formed, its positions (rafʿ/naṣb/jarr) are marked like:',
   '["A. The dual","B. The sound masc plural","C. A singular ism (ḍammah/fatḥah/kasrah)","D. None of the above"]'::jsonb, 'C',
   'A broken plural declines like a singular: ḍammah for rafʿ, fatḥah for naṣb, kasrah for jarr.', 'medium', 'positions'),
  (v_q10, 8, 'What does it mean for a broken plural to be a "diptote" (ممنوع من الصرف)?',
   '["A. It cannot take ال","B. It refuses tanween, and in jarr it takes fatḥah instead of kasrah","C. It cannot be used in a sentence","D. It is a singular in disguise"]'::jsonb, 'B',
   'Many broken plural patterns (مَفَاعِل, مَفَاعِيل, فَوَاعِل, etc.) are diptotes. They refuse tanween, and in jarr they take fatḥah.', 'medium', 'diptote'),
  (v_q10, 9, 'A non-human plural (broken or sound) takes what agreement on adjectives?',
   '["A. Masculine plural","B. Feminine plural","C. Feminine singular","D. Masculine singular"]'::jsonb, 'C',
   'Non-human plurals (الكُتُب, الأَقْلَام, البُيُوت) take feminine singular agreement — e.g., الكُتُب الجَدِيدَة, not الجُدُد.', 'medium', 'agreement'),
  (v_q10, 10, 'In ﴿الرِّجَالُ قَوَّامُونَ عَلَى النِّسَاءِ﴾ (4:34), classify الرِّجَالُ.',
   '["A. Sound masc plural in rafʿ","B. Broken plural in rafʿ (fāʿil/subject)","C. Broken plural in naṣb","D. Dual in rafʿ"]'::jsonb, 'B',
   'الرِّجَال is the broken plural of رَجُل. It takes ḍammah here → rafʿ (subject).', 'hard', 'analysis'),
  (v_q10, 11, 'In ﴿فِي بُيُوتٍ أَذِنَ اللَّهُ أَنْ تُرْفَعَ﴾ (24:36), classify بُيُوتٍ.',
   '["A. Singular in jarr","B. Broken plural in rafʿ","C. Broken plural in jarr (tanween kasrah after فِي)","D. Sound fem plural"]'::jsonb, 'C',
   'بُيُوت is a broken plural of بَيْت. بُيُوتٍ has tanween kasrah after فِي — indefinite jarr.', 'hard', 'analysis'),
  (v_q10, 12, 'In ﴿وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ﴾ (67:5), why does مَصَابِيحَ take FATḤAH (not kasrah) after the preposition بـ?',
   '["A. It is not in jarr","B. It is a diptote (pattern مَفَاعِيل); diptotes take fatḥah in jarr when indefinite and not in iḍāfah","C. It is a verb","D. Arabic just works that way"]'::jsonb, 'B',
   'مَصَابِيح is a diptote broken plural on the pattern مَفَاعِيل. As an indefinite diptote in jarr, it takes fatḥah instead of kasrah, and no tanween.', 'hard', 'analysis'),
  (v_q10, 13, 'What is the broken plural of أَخ?',
   '["A. أَخَوَات","B. إِخْوَة / إِخْوَان","C. أَخُونَ","D. أَخَانِ"]'::jsonb, 'B',
   'أَخ → إِخْوَة or إِخْوَان (both are broken plurals; إِخْوَة is the most common).', 'hard', 'examples'),
  (v_q10, 14, 'What is the broken plural of ابْن?',
   '["A. ابْنَات","B. أَبْنَاء","C. ابْنُونَ","D. ابْنَانِ"]'::jsonb, 'B',
   'ابْن → أَبْنَاء (broken plural).', 'hard', 'examples'),
  (v_q10, 15, 'In ﴿وَاذْكُرُوا اللَّهَ كَذِكْرِكُمْ آبَاءَكُمْ﴾ (2:200), classify آبَاءَ.',
   '["A. Singular","B. Broken plural in rafʿ","C. Broken plural in naṣb (fatḥah — direct object)","D. Sound masc plural"]'::jsonb, 'C',
   'آبَاء is a broken plural of أَب. Here fatḥah marks naṣb — it is the direct object.', 'hard', 'analysis');

  -- =========================================================================
  -- LESSON 11: الخُلَاصَةُ الكُبْرَى — The Grand Summary
  -- =========================================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch11, 'Quiz: الخُلَاصَةُ الكُبْرَى', 'Integrated review: recognise number, family, and position from the ending of an ism.', 10, true, now())
  RETURNING id INTO v_q11;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q11, 1, 'If you see a word ending in ـُونَ, which number and position is it?',
   '["A. Dual in rafʿ","B. Sound masc plural in rafʿ","C. Sound fem plural in naṣb","D. Singular in rafʿ"]'::jsonb, 'B',
   'ـُونَ = sound masc plural in rafʿ.', 'easy', 'recognition'),
  (v_q11, 2, 'If you see a word ending in ـِينَ, which number and position is it?',
   '["A. Sound masc plural in rafʿ","B. Sound masc plural in naṣb or jarr","C. Dual in naṣb","D. Singular in jarr"]'::jsonb, 'B',
   'ـِينَ = sound masc plural in naṣb or jarr (these share a shape).', 'easy', 'recognition'),
  (v_q11, 3, 'If you see a word ending in ـَانِ, which number and position is it?',
   '["A. Dual in rafʿ","B. Dual in naṣb","C. Sound fem plural","D. Broken plural"]'::jsonb, 'A',
   'ـَانِ = dual in rafʿ.', 'easy', 'recognition'),
  (v_q11, 4, 'If you see a word ending in ـَيْنِ, which number and position is it?',
   '["A. Dual in rafʿ","B. Dual in naṣb or jarr","C. Sound masc plural","D. Singular in naṣb"]'::jsonb, 'B',
   'ـَيْنِ = dual in naṣb or jarr.', 'easy', 'recognition'),
  (v_q11, 5, 'If you see a word ending in ـَاتُ / ـَاتٌ, which is it?',
   '["A. Sound fem plural in rafʿ","B. Sound fem plural in naṣb","C. Dual in rafʿ","D. Broken plural"]'::jsonb, 'A',
   'ـَاتُ (definite) or ـَاتٌ (indefinite) = sound fem plural in rafʿ.', 'easy', 'recognition'),
  (v_q11, 6, 'If you see a word ending in ـَاتِ / ـَاتٍ, which is it?',
   '["A. Sound fem plural in rafʿ","B. Sound fem plural in naṣb or jarr","C. Dual in naṣb","D. Singular in jarr"]'::jsonb, 'B',
   'ـَاتِ / ـَاتٍ = sound fem plural in naṣb or jarr (they share a shape; kasrah stands for fatḥah in naṣb).', 'medium', 'recognition'),
  (v_q11, 7, 'In ﴿قَدْ أَفْلَحَ المُؤْمِنُونَ﴾ (23:1), classify المُؤْمِنُونَ completely: number, family, position.',
   '["A. Sound masc plural, rafʿ (fāʿil)","B. Sound masc plural, naṣb","C. Dual, rafʿ","D. Broken plural, rafʿ"]'::jsonb, 'A',
   'Suffix ـُونَ → sound masc plural in rafʿ. It is the fāʿil of أَفْلَحَ.', 'medium', 'analysis'),
  (v_q11, 8, 'In ﴿الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ﴾ (23:2), classify خَاشِعُونَ.',
   '["A. Sound masc plural in rafʿ (khabar)","B. Sound masc plural in naṣb","C. Broken plural","D. Singular"]'::jsonb, 'A',
   'ـُونَ → sound masc plural in rafʿ. It is the khabar of the pronoun هُمْ.', 'medium', 'analysis'),
  (v_q11, 9, 'In ﴿وَالمُطَلَّقَاتُ يَتَرَبَّصْنَ﴾ (2:228), classify المُطَلَّقَاتُ.',
   '["A. Sound fem plural in rafʿ (subject)","B. Sound fem plural in naṣb","C. Dual in rafʿ","D. Broken plural in naṣb"]'::jsonb, 'A',
   'ـَاتُ (definite, ḍammah) → sound fem plural in rafʿ.', 'medium', 'analysis'),
  (v_q11, 10, 'In ﴿خَلَقَ السَّمَاوَاتِ وَالأَرْضَ﴾ (6:1), classify السَّمَاوَاتِ.',
   '["A. Sound fem plural in rafʿ","B. Sound fem plural in naṣb (kasrah replaces fatḥah)","C. Singular in jarr","D. Broken plural"]'::jsonb, 'B',
   'السَّمَاوَاتِ has ـَاتِ. Here it is the direct object of خَلَقَ, so naṣb — marked by kasrah (the unique sound-fem-plural naṣb rule).', 'hard', 'analysis'),
  (v_q11, 11, 'In ﴿إِنَّ المُتَّقِينَ فِي جَنَّاتٍ وَنَهَرٍ﴾ (54:54), classify المُتَّقِينَ and جَنَّاتٍ.',
   '["A. Both sound masc plural in rafʿ","B. المُتَّقِينَ = sound masc plural, naṣb (after إِنَّ); جَنَّاتٍ = sound fem plural, jarr (after فِي)","C. Both are singular","D. Both are broken plurals"]'::jsonb, 'B',
   'المُتَّقِينَ ends in ـِينَ = sound masc plural; اسم إنّ → naṣb. جَنَّاتٍ ends in ـَاتٍ after فِي = sound fem plural in jarr.', 'hard', 'analysis'),
  (v_q11, 12, 'In ﴿إِنَّ إِبْرَاهِيمَ كَانَ أُمَّةً قَانِتًا لِلَّهِ﴾ (16:120), classify إِبْرَاهِيمَ.',
   '["A. Diptote (ممنوع من الصرف) singular in naṣb (as ism of إنّ)","B. Sound masc plural","C. Broken plural","D. Dual"]'::jsonb, 'A',
   'إبراهيم is a diptote. As the ism of إنّ, it is in naṣb — marked by fatḥah with no tanween.', 'hard', 'analysis'),
  (v_q11, 13, 'In ﴿الرِّجَالُ قَوَّامُونَ عَلَى النِّسَاءِ﴾ (4:34), classify النِّسَاءِ.',
   '["A. Singular, jarr","B. Sound fem plural, jarr","C. Broken plural, jarr (after عَلَى)","D. Dual, naṣb"]'::jsonb, 'C',
   'النِّسَاء is the broken plural of امْرَأَة. After عَلَى it is in jarr — marked by kasrah.', 'hard', 'analysis'),
  (v_q11, 14, 'Which ending CANNOT exist on a sound masculine plural?',
   '["A. ـُونَ","B. ـِينَ","C. ـَاتُ","D. Any of A, B, C — a sound masc plural can have all of them"]'::jsonb, 'C',
   'Sound masc plural only has two shapes: ـُونَ (rafʿ) and ـِينَ (naṣb/jarr). ـَاتُ belongs to the sound fem plural.', 'hard', 'features'),
  (v_q11, 15, 'Which of the following statements combining everything from Lessons 06–10 is FALSE?',
   '["A. Dual and sound masc plural use letter endings; sound fem plural and broken plural use vowel endings","B. Diptotes take fatḥah in jarr instead of kasrah, when indefinite and not in iḍāfah","C. Non-human plurals take feminine singular agreement on adjectives","D. The sound feminine plural marks naṣb with fatḥah, like the singular"]'::jsonb, 'D',
   'D is false. The sound feminine plural marks naṣb with KASRAH (ـَاتِ / ـَاتٍ), not fatḥah — this is the unique feature: naṣb and jarr share a shape.', 'hard', 'integration');

END $$;

