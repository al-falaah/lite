-- TMP Milestone 4 — Madd lesson quizzes (10 Q each, difficulty medium → hard).
-- Reseed of 20260913000001 with bidi isolates: each ﴿…﴾ ayah span is
-- wrapped in U+2067 (RLI) … U+2069 (PDI) so the ornate brackets render in the
-- correct order inside the surrounding English sentence (they were reversed).
--
-- Three lessons in TMP milestone 4 (course e524733d, all milestone_index = 4):
--   ch1  Natural Madd (المد الطبيعي)                    — madd al-tabi'iyy
--   ch2  Secondary Madd Influenced by Hamza             — muttasil, munfasil, badal
--   ch3  Secondary Madd Influenced by Sukoon - Part 1   — 'aaridh li-s-sukoon, leen
--
-- Questions test the rule with PRACTICAL, verified Qur'anic examples. Every
-- ayah cited is verbatim from quran_tajweed_aya (vowelled Uthmani, tafsir.net
-- sourced) and confirmed to contain the exact madd it illustrates. Questions
-- are clear and unambiguous — one correct answer, real (not trick) distractors.
-- Idempotent: deletes any existing quiz on these chapters before reseeding.

DO $$
DECLARE
  v_course UUID;
  v_ch1 UUID; v_ch2 UUID; v_ch3 UUID;
  v_q UUID;
BEGIN
  SELECT id INTO v_course FROM lesson_courses
    WHERE id = 'e524733d-fb6e-43e1-90ee-fa928f48dee7';
  IF v_course IS NULL THEN
    RAISE EXCEPTION 'TMP madd course e524733d not found';
  END IF;

  SELECT id INTO v_ch1 FROM lesson_chapters WHERE course_id = v_course AND chapter_number = 1;
  SELECT id INTO v_ch2 FROM lesson_chapters WHERE course_id = v_course AND chapter_number = 2;
  SELECT id INTO v_ch3 FROM lesson_chapters WHERE course_id = v_course AND chapter_number = 3;
  IF v_ch1 IS NULL OR v_ch2 IS NULL OR v_ch3 IS NULL THEN
    RAISE EXCEPTION 'One or more madd chapters not found (ch1=%, ch2=%, ch3=%)', v_ch1, v_ch2, v_ch3;
  END IF;

  DELETE FROM lesson_quizzes WHERE chapter_id IN (v_ch1, v_ch2, v_ch3);

  -- ============================================================
  -- Lesson 1 — Natural Madd (المد الطبيعي)
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch1, 'Quiz: Natural Madd (المد الطبيعي)',
          'The natural elongation — its letters, its length, and telling it apart from secondary madd.',
          7, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'How many harakat (counts) is madd tabi''iyy (natural madd) held for?',
   '["A. 1 harakah","B. 2 harakat","C. 4 harakat","D. 6 harakat"]'::jsonb, 'B',
   'Natural madd is held for 2 harakat — the base length of all elongation.', 'medium', 'definition'),
  (v_q, 2, 'What are the three letters of madd?',
   '["A. ا و ي","B. ن م و","C. ء ه ع","D. ل ر ن"]'::jsonb, 'A',
   'The madd letters are alif (ا), waw (و) and yaa (ي), each preceded by its matching harakah.', 'medium', 'letters'),
  (v_q, 3, 'Natural madd occurs when a madd letter is NOT followed by:',
   '["A. Any letter at all","B. A hamza or a sukoon","C. A fathah or a kasrah","D. A shaddah"]'::jsonb, 'B',
   'Natural madd needs no external cause. If a hamza or sukoon follows the madd letter, it becomes a SECONDARY madd instead.', 'medium', 'definition'),
  (v_q, 4, 'For the waw of madd to be a true madd letter, it must be a sukoon preceded by which harakah?',
   '["A. Fathah","B. Kasrah","C. Dammah","D. Tanween"]'::jsonb, 'C',
   'Madd waw = sakin waw after a dammah (e.g. نُوحِيهَا). A sakin waw after a fathah is a LEEN letter, not madd.', 'hard', 'letters'),
  (v_q, 5, 'In ⁧﴿قُلْ هُوَ اللَّهُ أَحَدٌ﴾⁩, which word contains a natural madd?',
   '["A. قُلْ","B. هُوَ","C. اللَّهُ","D. أَحَدٌ"]'::jsonb, 'C',
   'In ٱللَّهُ the laam is followed by an alif of madd (the aa sound) with no hamza/sukoon after it — natural madd, 2 harakat.', 'hard', 'application'),
  (v_q, 6, 'In ⁧﴿إِيَّاكَ نَعْبُدُ﴾⁩, the word نَعْبُدُ ends in a dammah on the daal. Why is there NO madd on it in continuous reading?',
   '["A. Because the daal has a sukoon","B. Because there is no sakin waw/alif/yaa letter after the harakah","C. Because it is the end of the verse","D. Because a hamza follows it"]'::jsonb, 'B',
   'A short vowel alone is not madd. Madd needs an actual madd LETTER (sakin ا/و/ي). نَعْبُدُ has only a dammah, no waw of madd.', 'hard', 'application'),
  (v_q, 7, 'Which of these is an example of natural madd with the yaa of madd?',
   '["A. فِي (a kasrah then sakin yaa)","B. بَيْت (a fathah then sakin yaa)","C. شَيْء (a fathah then sakin yaa)","D. إِلَيْهِ (a fathah then sakin yaa)"]'::jsonb, 'A',
   'Madd yaa = sakin yaa after a kasrah, as in فِي. In بَيْت / شَيْء / إِلَيْهِ the yaa follows a FATHAH, making it leen, not madd.', 'hard', 'letters'),
  (v_q, 8, 'What distinguishes natural madd from all the secondary madds?',
   '["A. It is longer than they are","B. It has no external cause (no hamza and no sukoon after the madd letter)","C. It only occurs at the end of a verse","D. It is only found in short surahs"]'::jsonb, 'B',
   'Natural madd stands on its own with no cause. Every secondary madd exists because a hamza or a sukoon follows the madd letter.', 'hard', 'concept'),
  (v_q, 9, 'In ⁧﴿الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ﴾⁩ read WITHOUT stopping, the alif in الْعَالَمِينَ is:',
   '["A. A natural madd (2 harakat)","B. Madd muttasil","C. Madd aaridh li-s-sukoon","D. Not a madd at all"]'::jsonb, 'A',
   'Joined to what follows, the alif in ٱلۡعَٰلَمِينَ has no hamza or sukoon after it — a natural madd of 2 harakat. (At a STOP the final syllable becomes aaridh — see Lesson 3.)', 'hard', 'application'),
  (v_q, 10, 'Natural madd is also called al-madd al-asli (the original madd) because:',
   '["A. It is the first madd taught to beginners","B. It is the foundation from which the secondary (far''i) madds branch","C. It was revealed first","D. It is only 1 harakah"]'::jsonb, 'B',
   'Asli means original/foundational: all secondary (far''i) madds are the natural madd lengthened by a cause (hamza or sukoon).', 'hard', 'concept');

  -- ============================================================
  -- Lesson 2 — Secondary Madd Influenced by Hamza
  --   (muttasil, munfasil, badal)
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch2, 'Quiz: Secondary Madd Influenced by Hamza',
          'Muttasil, munfasil and badal — the three madds caused by a hamza.',
          7, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'Madd muttasil (the connected madd) occurs when:',
   '["A. A madd letter and a hamza are in the SAME word","B. A madd letter ends a word and a hamza starts the next","C. A hamza comes before the madd letter","D. A sukoon follows the madd letter"]'::jsonb, 'B',
   'Muttasil = "connected": the madd letter and the hamza sit together in ONE word.', 'medium', 'muttasil'),
  (v_q, 2, 'Madd munfasil (the separated madd) occurs when:',
   '["A. A madd letter and hamza are in the same word","B. A madd letter ends one word and a hamza begins the next word","C. A hamza precedes the madd letter","D. Two madd letters meet"]'::jsonb, 'B',
   'Munfasil = "separated": the madd letter is at the end of one word and the hamza begins the following word.', 'medium', 'munfasil'),
  (v_q, 3, 'Madd badal occurs when:',
   '["A. A hamza comes BEFORE the madd letter","B. A madd letter comes before a hamza","C. A sukoon follows the madd letter","D. Two hamzas meet"]'::jsonb, 'A',
   'In badal the hamza comes first, then the madd letter (e.g. ءَامَنُوا). It is held for the natural 2 harakat.', 'medium', 'badal'),
  (v_q, 4, 'Which madd is OBLIGATORY (wajib) — always lengthened beyond the natural 2 counts?',
   '["A. Madd munfasil","B. Madd badal","C. Madd muttasil","D. Natural madd"]'::jsonb, 'C',
   'Muttasil is madd wajib: because the madd letter and hamza are in one word, it must be lengthened (commonly 4–5 harakat in Hafs).', 'hard', 'muttasil'),
  (v_q, 5, 'For how many harakat is madd badal held in the narration of Hafs?',
   '["A. 2 harakat","B. 4 harakat","C. 5 harakat","D. 6 harakat"]'::jsonb, 'A',
   'Badal is held for 2 harakat — the same length as natural madd.', 'hard', 'badal'),
  (v_q, 6, 'In ⁧﴿أَوْ كَصَيِّبٍ مِّنَ السَّمَاءِ﴾⁩, the word السَّمَاءِ (an alif of madd followed by a hamza in the same word) is an example of:',
   '["A. Madd munfasil","B. Madd muttasil","C. Madd badal","D. Natural madd"]'::jsonb, 'B',
   'The alif and the hamza are in ONE word (ٱلسَّمَآء) — madd muttasil, lengthened.', 'hard', 'application'),
  (v_q, 7, 'In ⁧﴿يُؤْمِنُونَ بِمَا أُنزِلَ﴾⁩, the alif ending بِمَا followed by the hamza starting أُنزِلَ is an example of:',
   '["A. Madd muttasil","B. Madd badal","C. Madd munfasil","D. Natural madd"]'::jsonb, 'C',
   'The madd letter ends one word (بِمَا) and the hamza begins the next (أُنزِلَ) — madd munfasil.', 'hard', 'application'),
  (v_q, 8, 'In ⁧﴿إِنَّ الَّذِينَ كَفَرُوا سَوَاءٌ عَلَيْهِمْ أَأَنذَرْتَهُمْ﴾⁩, the word ءَأَنذَرْتَهُمْ (hamza then a madd alif) is an example of:',
   '["A. Madd badal","B. Madd muttasil","C. Madd munfasil","D. Madd leen"]'::jsonb, 'A',
   'The hamza comes first, then the madd letter (ءَا) — madd badal, held 2 harakat.', 'hard', 'application'),
  (v_q, 9, 'A reciter lengthens muttasil to 4 counts. To keep the recitation consistent, munfasil in the same reading should be:',
   '["A. Left at 2 counts","B. Lengthened to a comparable length (e.g. 4 counts)","C. Lengthened to 6 counts","D. Dropped entirely"]'::jsonb, 'B',
   'Muttasil and munfasil are kept at a matching length in one recitation (commonly both 4, or both 5). Badal stays at 2.', 'hard', 'concept'),
  (v_q, 10, 'What do madd muttasil, munfasil and badal all have in COMMON?',
   '["A. They are all held for 6 harakat","B. Their cause is a hamza","C. Their cause is a sukoon","D. They only occur at the end of a verse"]'::jsonb, 'B',
   'All three are secondary madds caused by a HAMZA — differing only in where the hamza sits relative to the madd letter.', 'hard', 'concept');

  -- ============================================================
  -- Lesson 3 — Secondary Madd Influenced by Sukoon (Part 1)
  --   ('aaridh li-s-sukoon, leen)
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch3, 'Quiz: Secondary Madd Influenced by Sukoon',
          'Madd aaridh li-s-sukoon and madd leen — the madds caused by stopping.',
          7, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'Madd ''aaridh li-s-sukoon occurs when:',
   '["A. A madd letter is followed by a permanent sukoon","B. A madd letter is followed by a letter made sakin only because we STOP on it","C. A hamza follows the madd letter","D. A hamza precedes the madd letter"]'::jsonb, 'B',
   '"Aaridh" means temporary/presented: the sukoon appears only because we stop on the final letter after a madd letter.', 'medium', 'aaridh'),
  (v_q, 2, 'A madd leen letter is:',
   '["A. A sakin waw or yaa preceded by a FATHAH","B. A sakin alif preceded by a fathah","C. A sakin waw preceded by a dammah","D. A sakin yaa preceded by a kasrah"]'::jsonb, 'A',
   'Leen letters are a sakin waw or yaa after a FATHAH (e.g. خَوْف, بَيْت). (After a matching dammah/kasrah they would be madd letters.)', 'medium', 'leen'),
  (v_q, 3, 'What are the permitted lengths for madd ''aaridh li-s-sukoon?',
   '["A. 2 only","B. 2, 4, or 6 harakat","C. 4 or 5 only","D. 6 only"]'::jsonb, 'B',
   'Aaridh may be read at 2 (qasr), 4 (tawassut) or 6 (tool) harakat — the reciter chooses one and stays consistent.', 'medium', 'aaridh'),
  (v_q, 4, 'Madd ''aaridh and madd leen only take their extra length when the reciter:',
   '["A. Joins the words together","B. Stops (does waqf) on the word","C. Reads quickly","D. Begins a new surah"]'::jsonb, 'B',
   'Both are caused by the sukoon of STOPPING. Joined in continuous reading, there is no lengthening from this cause.', 'hard', 'concept'),
  (v_q, 5, 'When STOPPING on ⁧﴿رَبِّ الْعَالَمِينَ﴾⁩, the yaa in الْعَالَمِينَ followed by the (now sakin) noon is an example of:',
   '["A. Natural madd","B. Madd muttasil","C. Madd aaridh li-s-sukoon","D. Madd badal"]'::jsonb, 'C',
   'Stopping makes the final noon sakin; the madd yaa before it becomes aaridh li-s-sukoon (read 2, 4 or 6).', 'hard', 'application'),
  (v_q, 6, 'When stopping on ⁧﴿اللَّهُ الصَّمَدُ﴾⁩, the madd in ٱلصَّمَدُ that is lengthened is a madd:',
   '["A. aaridh li-s-sukoon","B. leen","C. muttasil","D. badal"]'::jsonb, 'A',
   'Stopping on ٱلصَّمَد makes the final daal sakin; the alif of madd before it becomes aaridh li-s-sukoon.', 'hard', 'application'),
  (v_q, 7, 'In ⁧﴿وَآمَنَهُم مِّنْ خَوْفٍ﴾⁩, stopping on خَوْف gives a madd leen because:',
   '["A. The waw is sakin after a fathah, then followed by the sukoon of stopping","B. A hamza follows the waw","C. The waw is preceded by a dammah","D. There is a shaddah on the faa"]'::jsonb, 'A',
   'خَوْف has a leen waw (sakin waw after fathah). On stopping, the faa becomes sakin, so the leen letter is lengthened — madd leen.', 'hard', 'application'),
  (v_q, 8, 'In ⁧﴿لِإِيلَافِ قُرَيْشٍ﴾⁩, stopping on قُرَيْشٍ produces a madd leen on which letter?',
   '["A. The qaaf","B. The sakin yaa after the fathah (قُرَيْـ)","C. The shin","D. The raa"]'::jsonb, 'B',
   'قُرَيْش has a sakin yaa after a fathah (a leen letter). Stopping on the shin lengthens it — madd leen.', 'hard', 'application'),
  (v_q, 9, 'The key difference between a madd leen letter and a madd yaa/waw letter is the harakah BEFORE it. Leen follows a __, while madd follows a matching __:',
   '["A. fathah ... dammah/kasrah","B. kasrah ... fathah","C. dammah ... fathah","D. sukoon ... fathah"]'::jsonb, 'A',
   'Leen = sakin waw/yaa after a FATHAH. Madd = sakin waw after a dammah, or sakin yaa after a kasrah (matching harakah).', 'hard', 'concept'),
  (v_q, 10, 'A reciter reads madd ''aaridh in a passage at 4 harakat. For the recitation to be consistent, other ''aaridh stops in the same passage should be:',
   '["A. Read at 2 harakat","B. Read at 6 harakat","C. Also read at 4 harakat","D. Read at any length freely"]'::jsonb, 'C',
   'Once a length (2, 4 or 6) is chosen for aaridh, it is kept consistent throughout that recitation.', 'hard', 'concept');

END $$;
