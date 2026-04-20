-- Seed 15-question quizzes for all 8 published TMP chapters (TMP 101 + TMP 102).
-- Chapters are resolved by course slug + chapter_number.
-- Options use the lettered format expected by ChapterQuiz.jsx:
--   options:        ["A. text","B. text","C. text","D. text"]
--   correct_answer: single letter "A" | "B" | "C" | "D"
-- Difficulty rises within each quiz: easy → medium → hard.
-- Idempotent: deletes any existing quiz on these chapters before reseeding.

DO $$
DECLARE
  v_c101 UUID; v_c102 UUID;
  v_t01 UUID; v_t02 UUID; v_t03 UUID;                          -- TMP 101 chapters
  v_u01 UUID; v_u02 UUID; v_u03 UUID; v_u04 UUID; v_u05 UUID;  -- TMP 102 chapters
  v_q UUID;
BEGIN
  SELECT id INTO v_c101 FROM lesson_courses WHERE slug = 'tmp-101-introduction-to-quranic-sciences';
  SELECT id INTO v_c102 FROM lesson_courses WHERE slug = 'tmp-102-introduction-to-tajweed';

  IF v_c101 IS NULL THEN RAISE EXCEPTION 'TMP 101 course not found'; END IF;
  IF v_c102 IS NULL THEN RAISE EXCEPTION 'TMP 102 course not found'; END IF;

  SELECT id INTO v_t01 FROM lesson_chapters WHERE course_id = v_c101 AND chapter_number = 1;
  SELECT id INTO v_t02 FROM lesson_chapters WHERE course_id = v_c101 AND chapter_number = 2;
  SELECT id INTO v_t03 FROM lesson_chapters WHERE course_id = v_c101 AND chapter_number = 3;
  SELECT id INTO v_u01 FROM lesson_chapters WHERE course_id = v_c102 AND chapter_number = 1;
  SELECT id INTO v_u02 FROM lesson_chapters WHERE course_id = v_c102 AND chapter_number = 2;
  SELECT id INTO v_u03 FROM lesson_chapters WHERE course_id = v_c102 AND chapter_number = 3;
  SELECT id INTO v_u04 FROM lesson_chapters WHERE course_id = v_c102 AND chapter_number = 4;
  SELECT id INTO v_u05 FROM lesson_chapters WHERE course_id = v_c102 AND chapter_number = 5;

  DELETE FROM lesson_quizzes WHERE chapter_id IN (v_t01,v_t02,v_t03,v_u01,v_u02,v_u03,v_u04,v_u05);

  -- ============================================================
  -- TMP 101 · Chapter 1 — How the Qur'an Reached Us
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_t01, 'Quiz: How the Qur''an Reached Us',
          'Preservation, compilation, standardisation and the chains that brought the Qur''an to us.',
          10, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'What does the word Huffaz (حُفَّاظ) refer to?',
   '["A. Professional scribes of the Prophet ﷺ","B. Those who have memorised the entire Qur''an","C. Judges trained in Qur''anic rulings","D. Companions who emigrated to Medina"]'::jsonb, 'B',
   'Huffaz is the plural of Hafiz — one who has memorised the whole Qur''an.', 'easy', 'terminology'),
  (v_q, 2, 'The scribes appointed by the Prophet ﷺ to write down revelation as it came were called:',
   '["A. Al-Qurra''","B. Al-Tabi''een","C. Kuttab al-Wahy","D. Al-Huffaz"]'::jsonb, 'C',
   'Kuttab al-Wahy literally means "the Scribes of the Revelation".', 'easy', 'prophetic-era'),
  (v_q, 3, 'A Mushaf (مُصْحَف) is best described as:',
   '["A. An oral recitation style","B. A written, bound copy of the Qur''an","C. A specific chain of narrators","D. A scholarly commentary on the Qur''an"]'::jsonb, 'B',
   'Mushaf refers to the written, bound codex of the Qur''an — the physical book form.', 'easy', 'terminology'),
  (v_q, 4, 'Which verse is cited as Allah''s promise to preserve the Qur''an?',
   '["A. Surah Al-Hijr 15:9","B. Surah Al-Fatihah 1:1","C. Surah Al-Baqarah 2:255","D. Surah An-Nas 114:1"]'::jsonb, 'A',
   '﴿إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ﴾ — Al-Hijr 15:9.', 'easy', 'preservation'),
  (v_q, 5, 'Allah preserved the Qur''an through two complementary methods. They are:',
   '["A. Memorisation and writing","B. Translation and commentary","C. Recitation and prayer","D. Calligraphy and printing"]'::jsonb, 'A',
   'Thousands memorised it (hifẓ) and the Kuttab al-Wahy wrote every verse — the two methods verified each other.', 'easy', 'preservation'),
  (v_q, 6, 'Who led the first compilation of the Qur''an under the caliphate of Abu Bakr ؓ?',
   '["A. Umar ibn al-Khattab","B. Ali ibn Abi Talib","C. Zayd ibn Thabit","D. Ubayy ibn Ka''ab"]'::jsonb, 'C',
   'Zayd ibn Thabit was chosen because he had been a personal scribe of the Prophet ﷺ and witnessed the final review (Al-''Ardah al-Akhiirah).', 'easy', 'first-compilation'),
  (v_q, 7, 'What event directly triggered Umar ؓ to urge the first compilation of the Qur''an?',
   '["A. The conquest of Mecca","B. The death of many Huffaz in the Ridda wars","C. Disputes over translation","D. The death of the Prophet ﷺ"]'::jsonb, 'B',
   'Many memorisers were killed in battle during the apostasy (Ridda) wars — Umar feared large portions of Qur''an could be lost.', 'medium', 'first-compilation'),
  (v_q, 8, 'After the first compilation, the master manuscript was ultimately kept by which Mother of the Believers?',
   '["A. Aisha ؓ","B. Khadijah ؓ","C. Hafsa ؓ","D. Umm Salamah ؓ"]'::jsonb, 'C',
   'It was kept with Abu Bakr → Umar → then entrusted to Hafsa bint Umar ؓ.', 'medium', 'first-compilation'),
  (v_q, 9, 'Which companion alerted Uthman ؓ to differences in recitation across the provinces?',
   '["A. Ali ibn Abi Talib ؓ","B. Hudhayfah ibn al-Yaman ؓ","C. Ibn Mas''ood ؓ","D. Mu''awiyah ؓ"]'::jsonb, 'B',
   'Hudhayfah returned from campaigns in Armenia and Azerbaijan and urged Uthman to act before disagreement spread.', 'medium', 'standardisation'),
  (v_q, 10, 'What is the "Imam Mushaf"?',
   '["A. The personal copy of the Prophet ﷺ","B. The master Uthmani copy kept by Uthman in Medina","C. The copy sent to Kufa","D. The first printed Qur''an"]'::jsonb, 'B',
   'Uthman kept one copy for himself in Medina — the Mushaf al-Imam — from which the other copies were made.', 'medium', 'standardisation'),
  (v_q, 11, 'Mutawātir (مُتَوَاتِر) transmission means a report:',
   '["A. Comes through only a single narrator","B. Is narrated by so many in every generation that fabrication is impossible","C. Has been written in just one manuscript","D. Is permitted in Hadith but not in Qur''an"]'::jsonb, 'B',
   'Mutawātir = mass-transmission through so many independent chains that a lie is impossible.', 'medium', 'terminology'),
  (v_q, 12, 'According to Ibn al-Jazari''s Al-Nashr, how many recitations (Qirā''āt) are affirmed as mutawātir?',
   '["A. Seven","B. Ten","C. Fourteen","D. Four"]'::jsonb, 'B',
   'The Muslim nation has agreed by consensus on ten mutawātir recitations — the Seven of Ibn Mujahid plus three more.', 'medium', 'qiraat'),
  (v_q, 13, 'A Qira''ah is only accepted as authentic if it meets three conditions. Which set is correct?',
   '["A. Matches the Uthmani mushaf, is correct Arabic, has an unbroken chain to the Prophet ﷺ","B. Comes from Medina, is memorised by 40 imams, is in poetic form","C. Has a single narrator, is popular, is easy to read","D. Is recited in prayer, is short, is in rhyme"]'::jsonb, 'A',
   'All three conditions must be met for a recitation to be considered valid.', 'hard', 'qiraat'),
  (v_q, 14, 'Which distinction is CORRECT regarding Wajh al-Riwāyah and Wajh al-Dirāyah?',
   '["A. Both are scholarly opinions of equal weight","B. Riwāyah is transmitted with an unbroken isnād; Dirāyah is based on linguistic reasoning","C. Dirāyah is binding on the reader; Riwāyah is optional","D. Both refer to the same level of transmission"]'::jsonb, 'B',
   'The Qur''an''s text is governed by Riwāyah (transmission with chain), never by Dirāyah (scholarly reasoning) alone.', 'hard', 'terminology'),
  (v_q, 15, 'Which sequence correctly orders the three levels in the chain of recitation (from top down)?',
   '["A. Ṭarīq → Riwāyah → Qirā''ah","B. Riwāyah → Qirā''ah → Ṭarīq","C. Qirā''ah → Riwāyah → Ṭarīq","D. Qirā''ah → Ṭarīq → Riwāyah"]'::jsonb, 'C',
   'Qirā''ah = the imam''s reading; Riwāyah = the direct narrator from the imam; Ṭarīq = sub-narrators further down.', 'hard', 'terminology');

  -- ============================================================
  -- TMP 101 · Chapter 2 — Brief Biographies of Imam Asim & Hafs
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_t02, 'Quiz: Imam Asim and Hafs ibn Sulayman',
          'The scholars who carried the world''s most widely recited narration.',
          10, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'The most widely recited narration of the Qur''an in the world today is known as:',
   '["A. Warsh ''an Nafi''","B. Hafs ''an Asim","C. Qalun ''an Nafi''","D. Al-Duri ''an Abi Amr"]'::jsonb, 'B',
   'Hafs ''an Asim — Hafs''s narration from Imam Asim — is the dominant global standard.', 'easy', 'hafs-an-asim'),
  (v_q, 2, 'Imam Asim was the Sheikh of Qur''anic recitation in which city?',
   '["A. Medina","B. Basra","C. Kufa","D. Damascus"]'::jsonb, 'C',
   'Imam Asim ibn Abi al-Nujud was the Imam of recitation in Kufa.', 'easy', 'asim'),
  (v_q, 3, 'What was the kunya of Imam Asim?',
   '["A. Abu Umar","B. Abu Bakr","C. Abu al-Qasim","D. Abu Hurayrah"]'::jsonb, 'B',
   'His kunya was Abu Bakr — not to be confused with Hafs, whose kunya was Abu Umar.', 'easy', 'asim'),
  (v_q, 4, 'What is a Riwayah (رواية)?',
   '["A. A chain of teachers going back to the Prophet ﷺ","B. A specific narration of a Qira''ah, passed down through a particular student","C. The full memorisation of the Qur''an","D. A printed copy of the Mushaf"]'::jsonb, 'B',
   'A Riwayah is the version of a Qira''ah as transmitted by one of the imam''s direct students.', 'easy', 'terminology'),
  (v_q, 5, 'Imam Asim is counted among which famous group of reciters?',
   '["A. The Ten Readers only","B. Al-Qurra'' al-Sab''ah — The Seven Readers","C. The Rightly-Guided Caliphs","D. The Four Imams of Fiqh"]'::jsonb, 'B',
   'He is one of the Seven Readers (Al-Qurra'' al-Sab''ah) formalised by Ibn Mujahid.', 'easy', 'asim'),
  (v_q, 6, 'Who were Imam Asim''s two famous narrators?',
   '["A. Warsh and Qalun","B. Al-Bazzi and Qunbul","C. Hafs and Shu''bah","D. Al-Duri and Al-Susi"]'::jsonb, 'C',
   'Hafs ibn Sulayman and Shu''bah (Abu Bakr ibn Ayyash) — both transmitted Asim''s recitation.', 'medium', 'asim'),
  (v_q, 7, 'Through whom did Imam Asim read the Qur''an?',
   '["A. Directly from the Prophet ﷺ","B. From Abu Abd al-Rahman al-Sulami, who read under Ali ibn Abi Talib ؓ","C. From Zayd ibn Thabit","D. From Ibn al-Jazari"]'::jsonb, 'B',
   'Asim → al-Sulami → Ali ibn Abi Talib ؓ → the Prophet ﷺ.', 'medium', 'asim'),
  (v_q, 8, 'What was the personal relationship between Hafs and Imam Asim?',
   '["A. Hafs was Asim''s biological son","B. Hafs was Asim''s brother","C. Hafs was the stepson and student of Asim","D. They were unrelated teacher and student"]'::jsonb, 'C',
   'Hafs was the son of Asim''s wife from a previous marriage — both his stepson and his student.', 'medium', 'hafs'),
  (v_q, 9, 'What was the kunya of Hafs ibn Sulayman?',
   '["A. Abu Bakr","B. Abu Umar","C. Abu Tahir","D. Abu Ja''far"]'::jsonb, 'B',
   'Hafs''s kunya was Abu Umar, distinct from Asim''s kunya (Abu Bakr).', 'medium', 'hafs'),
  (v_q, 10, 'What was the scholarly quality most associated with Hafs ibn Sulayman?',
   '["A. Poetry","B. Itqan — abundant memorisation and precision","C. Jurisprudence (fiqh)","D. Hadith criticism"]'::jsonb, 'B',
   'He was renowned for itqan — consistent, precise mastery of the recitation.', 'medium', 'hafs'),
  (v_q, 11, 'What are the birth and death dates given for Hafs ibn Sulayman?',
   '["A. Born 45 AH, died 120 AH","B. Born 90 AH, died 180 AH","C. Born 150 AH, died 229 AH","D. Born 119 AH, died 189 AH"]'::jsonb, 'B',
   'Born 90 AH, died 180 AH — the more accurate opinion among scholars.', 'hard', 'hafs'),
  (v_q, 12, 'A Tabi''ee (تابعي) refers to:',
   '["A. A Companion of the Prophet ﷺ","B. A member of the generation that came directly after the Companions","C. A scholar of the 7th century AH","D. A narrator who never met the Companions"]'::jsonb, 'B',
   'Tabi''ee = a member of the generation immediately after the Sahabah.', 'medium', 'terminology'),
  (v_q, 13, 'Al-Sulami, the teacher of Imam Asim, read the Qur''an under which Companion?',
   '["A. Ibn Mas''ood ؓ","B. Ubayy ibn Ka''ab ؓ","C. Ali ibn Abi Talib ؓ","D. Uthman ibn Affan ؓ"]'::jsonb, 'C',
   'Abu Abd al-Rahman al-Sulami read under Ali ibn Abi Talib ؓ, directly from the Prophet ﷺ.', 'hard', 'asim'),
  (v_q, 14, 'Shu''bah''s narration traces back through a different Companion. Which chain is correct?',
   '["A. Through Zar ibn Hubaysh from Abdullah ibn Mas''ood ؓ","B. Through Ubayy ibn Ka''ab ؓ directly","C. Through Zayd ibn Thabit ؓ","D. Through Abu Hurayrah ؓ"]'::jsonb, 'A',
   'Shu''bah narrated what Asim himself read — through Zar ibn Hubaysh, from Abdullah ibn Mas''ood ؓ.', 'hard', 'asim'),
  (v_q, 15, 'Which notable student is mentioned as one who travelled to learn directly from Hafs?',
   '["A. Al-Dani","B. Al-Shatibi","C. Amr ibn al-Sabbah","D. Ibn al-Jazari"]'::jsonb, 'C',
   'Amr ibn al-Sabbah is named in the lesson as one of the most notable of Hafs''s students.', 'hard', 'hafs');

  -- ============================================================
  -- TMP 101 · Chapter 3 — How Hafs's Recitation Reached the World
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_t03, 'Quiz: How Hafs''s Recitation Reached the World',
          'The chain from Hafs through al-Dani, al-Shatibi, and Ibn al-Jazari.',
          10, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'A Ṭarīq (طريق) in the science of Qira''at refers to:',
   '["A. The imam himself","B. The direct narrator from the imam","C. The sub-narrators who received from the narrator and passed it further","D. The handwritten Mushaf"]'::jsonb, 'C',
   'Ṭarīq = level 3, sub-narrators further down the chain, below the Riwāyah level.', 'easy', 'terminology'),
  (v_q, 2, 'Hafs transmitted his recitation through how many direct sub-narrators (Ṭuruq)?',
   '["A. One","B. Two","C. Three","D. Four"]'::jsonb, 'B',
   'Hafs has two primary Ṭuruq: ʿUbayd ibn al-Ṣabbāḥ and ʿAmr ibn al-Ṣabbāḥ.', 'easy', 'turuq'),
  (v_q, 3, 'Who are the two direct sub-narrators (Ṭuruq) of Hafs?',
   '["A. Qalun and Warsh","B. ʿUbayd ibn al-Ṣabbāḥ and ʿAmr ibn al-Ṣabbāḥ","C. Al-Bazzi and Qunbul","D. Shuʿbah and Asim"]'::jsonb, 'B',
   'ʿUbayd ibn al-Ṣabbāḥ (d. 219 AH) and ʿAmr ibn al-Ṣabbāḥ (d. 221 AH).', 'easy', 'turuq'),
  (v_q, 4, 'Which scholar compiled the readings of the Seven into a single written reference?',
   '["A. Ibn Mujahid","B. Abu ʿAmr al-Dānī","C. Al-Shāṭibī","D. Ibn al-Jazarī"]'::jsonb, 'B',
   'Al-Dānī authored Kitāb al-Taysīr fil Qirāʾāt al-Sabʿ — the definitive compiled reference.', 'easy', 'al-dani'),
  (v_q, 5, 'From which region did Abu ʿAmr al-Dānī hail?',
   '["A. Iraq","B. Egypt","C. Al-Andalus (Islamic Spain)","D. Persia"]'::jsonb, 'C',
   'Al-Dānī was an Andalusian scholar who dedicated his life to documenting the chains of recitation.', 'medium', 'al-dani'),
  (v_q, 6, 'In which year did Abu ʿAmr al-Dānī die?',
   '["A. 307 AH","B. 368 AH","C. 444 AH","D. 590 AH"]'::jsonb, 'C',
   'Al-Dānī died in 444 AH.', 'medium', 'al-dani'),
  (v_q, 7, 'What is the title of al-Dānī''s famous book?',
   '["A. Al-Nashr fil Qirāʾāt al-ʿAshr","B. Kitāb al-Taysīr fil Qirāʾāt al-Sabʿ","C. Ḥirz al-Amānī wa Wajh al-Tahānī","D. Al-Sabʿa fil Qirāʾāt"]'::jsonb, 'B',
   'Kitāb al-Taysīr fil Qirāʾāt al-Sabʿ — the direct basis for al-Shāṭibī''s poem.', 'medium', 'al-dani'),
  (v_q, 8, 'What did al-Shāṭibī do with al-Dānī''s book?',
   '["A. Translated it into Persian","B. Transformed its entire contents into a memorisable poem","C. Destroyed it for containing errors","D. Shortened it into three chapters"]'::jsonb, 'B',
   'Al-Shāṭibī versified al-Dānī''s Al-Taysīr in his poem Al-Shāṭibiyyah.', 'easy', 'al-shatibi'),
  (v_q, 9, 'Al-Shāṭibī''s famous poem is commonly known as:',
   '["A. Al-Muqaddimah al-Jazariyyah","B. Ḥirz al-Amānī wa Wajh al-Tahānī (Al-Shāṭibiyyah)","C. Tayyibat al-Nashr","D. Al-Fatḥ ar-Rabbānī"]'::jsonb, 'B',
   'Ḥirz al-Amānī wa Wajh al-Tahānī — known simply as Al-Shāṭibiyyah — is still memorised today.', 'medium', 'al-shatibi'),
  (v_q, 10, 'In which year did al-Shāṭibī die?',
   '["A. 444 AH","B. 564 AH","C. 590 AH","D. 725 AH"]'::jsonb, 'C',
   'Al-Shāṭibī died in 590 AH.', 'medium', 'al-shatibi'),
  (v_q, 11, 'How many teachers did Ibn al-Jazari learn from?',
   '["A. 10","B. 20","C. More than 45","D. Exactly 100"]'::jsonb, 'C',
   'Ibn al-Jazari sat with over 45 teachers from across the Muslim world.', 'medium', 'ibn-jazari'),
  (v_q, 12, 'Ibn al-Jazari''s encyclopaedic work on the Ten Recitations is:',
   '["A. Al-Shāṭibiyyah","B. Al-Nashr fil Qirāʾāt al-ʿAshr","C. Al-Taysīr","D. Al-Sabʿa"]'::jsonb, 'B',
   'Al-Nashr fil Qirāʾāt al-ʿAshr — "The Spreading of the Ten Recitations."', 'easy', 'ibn-jazari'),
  (v_q, 13, 'In which year did Ibn al-Jazari die?',
   '["A. 590 AH","B. 725 AH","C. 781 AH","D. 833 AH"]'::jsonb, 'D',
   'Ibn al-Jazari died in 833 AH.', 'medium', 'ibn-jazari'),
  (v_q, 14, 'Which of these scholars fell in the chain BETWEEN al-Shāṭibī and Ibn al-Jazari?',
   '["A. Abu Dāwūd Sulaymān ibn Najāḥ","B. Muḥammad al-Ṣāʾigh","C. ʿUbayd ibn al-Ṣabbāḥ","D. Al-Fīrūzānī (al-Ashnanī)"]'::jsonb, 'B',
   'Between al-Shāṭibī and Ibn al-Jazari: ʿAlī ibn Shujāʿ (d. 661), Muḥammad al-Ṣāʾigh (d. 725), and ʿAbd al-Raḥmān al-Baghdādī (d. 781).', 'hard', 'chain'),
  (v_q, 15, 'Arrange the chain from the first Ṭarīq of Hafs to al-Dānī correctly:',
   '["A. ʿUbayd ibn al-Ṣabbāḥ → al-Fīrūzānī (al-Ashnanī) → Muḥammad ibn Ṣāliḥ al-Baṣrī → al-Dānī","B. al-Dānī → al-Baṣrī → al-Ashnanī → ʿUbayd","C. ʿAmr ibn al-Ṣabbāḥ → Zarʿān → al-Dānī","D. Hafs → Asim → al-Sulami → Ali ؓ"]'::jsonb, 'A',
   'The path: Hafs → ʿUbayd ibn al-Ṣabbāḥ (d. 219) → al-Fīrūzānī "al-Ashnanī" (d. 307) → al-Baṣrī (d. 368) → al-Dānī.', 'hard', 'chain');

  -- ============================================================
  -- TMP 102 · Chapter 1 — The Virtues of the Noble Qur'an
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_u01, 'Quiz: Virtues of the Noble Qur''an',
          'What Allah and His Messenger ﷺ said about the Book of Allah.',
          10, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'The Arabic term Faḍl (فضل) means:',
   '["A. Chain of narration","B. Virtue, merit or excellence","C. Memorisation","D. Commentary"]'::jsonb, 'B',
   'Faḍl means virtue, merit or excellence — the distinguishing qualities of something.', 'easy', 'terminology'),
  (v_q, 2, 'In the lesson, the Qur''an is described as Shifāʾ (شفاء). This means:',
   '["A. Light","B. Guidance","C. Cure or healing","D. Rope"]'::jsonb, 'C',
   'Shifāʾ = cure/healing — the Qur''an heals the heart from doubt and spiritual disease.', 'easy', 'terminology'),
  (v_q, 3, 'The phrase Ḥabl Allāh (حبل الله), used to describe the Qur''an, means:',
   '["A. The Book of Allah","B. The Rope of Allah — the unbreakable connection to Him","C. The Sword of Allah","D. The Shade of Allah"]'::jsonb, 'B',
   'The Qur''an is called the Strong Rope of Allah — the unbreakable link between Allah and His servants.', 'easy', 'terminology'),
  (v_q, 4, 'Who are the "Ahl al-Qurʾān" (أهل القرآن)?',
   '["A. Any Muslim who owns a Mushaf","B. Arab tribes of the Hijaz","C. Those who dedicate themselves to learning, reciting, and living by the Qur''an","D. The Prophet''s immediate family only"]'::jsonb, 'C',
   'Ahl al-Qurʾān are described in the hadith as "the People of Allah and His special ones".', 'easy', 'terminology'),
  (v_q, 5, 'In which surah does Allah say: "And recite the Qur''an with measured recitation"?',
   '["A. Al-Fatihah","B. Al-Muzzammil","C. Al-Muddaththir","D. Al-Baqarah"]'::jsonb, 'B',
   '﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾ — Sūrat Al-Muzzammil (73):4.', 'easy', 'quranic-virtues'),
  (v_q, 6, 'According to the hadith, what reward is given for reading one letter of the Book of Allah?',
   '["A. One hasanah","B. One hasanah, multiplied ten times","C. Ten hasanat multiplied by seventy","D. Nothing unless understood"]'::jsonb, 'B',
   '"A hasanah is multiplied ten times — I do not say Alif-Lām-Mīm is one letter, but Alif is a letter, Lām is a letter, Mīm is a letter."', 'medium', 'hadith'),
  (v_q, 7, 'The hadith of the skilled and struggling reciter states:',
   '["A. Both receive one reward","B. The skilled is with the noble scribes; the one struggling has two rewards","C. Only the skilled is rewarded","D. The struggler is sinful"]'::jsonb, 'B',
   'The skilled reciter is with the noble righteous angel-scribes; the one struggling has two rewards.', 'medium', 'hadith'),
  (v_q, 8, 'In the hadith "Read and ascend…", the companion of the Qur''an is told their station will be at:',
   '["A. The first verse they memorised","B. The last verse they recite","C. The middle of the Qur''an","D. Sūrat al-Baqarah"]'::jsonb, 'B',
   '"…for your station will be at the last verse you recite." — the higher your memorisation, the higher your station.', 'medium', 'hadith'),
  (v_q, 9, 'Which hadith states "The best among you is one who learns the Qur''an and teaches it"?',
   '["A. Hadith 2 — Reward for Every Letter","B. Hadith 3 — The Skilled Reciter","C. Hadith 6 — The Best Among You","D. Hadith 9 — Superiority of Allah''s Speech"]'::jsonb, 'C',
   'Hadith 6, narrated by al-Bukhārī: « خَيرُكُم مَن تَعَلَّمَ القُرآنَ وَعَلَّمَهُ ».', 'medium', 'hadith'),
  (v_q, 10, 'In the four-fruits analogy, a BELIEVER who reads the Qur''an is compared to:',
   '["A. A date — no fragrance, sweet taste","B. An orange (utrujjah) — sweet fragrance and sweet taste","C. Basil (rayḥānah) — sweet fragrance but bitter taste","D. Colocynth (ḥanẓalah) — no fragrance, bitter taste"]'::jsonb, 'B',
   'Orange (utrujjah): fragrance and taste both sweet — representing the believer who reads the Qur''an.', 'medium', 'analogy'),
  (v_q, 11, 'In the same four-fruits analogy, a HYPOCRITE who reads the Qur''an is compared to:',
   '["A. An orange (utrujjah)","B. A date","C. Basil (rayḥānah) — sweet fragrance but bitter taste","D. Colocynth (ḥanẓalah)"]'::jsonb, 'C',
   'Basil (rayḥānah): sweet fragrance, bitter taste — apparent beauty, corrupt reality.', 'hard', 'analogy'),
  (v_q, 12, 'The "only praiseworthy envy" hadith mentions two kinds of people. They are:',
   '["A. A giver of charity and a fighter in jihad","B. One given the Qur''an (reciting it night and day) and one given wealth (spending it night and day)","C. A ruler and a scholar","D. A Hafiz and a muezzin"]'::jsonb, 'B',
   '« لا حَسَدَ إِلّا في اثنَتَين » — the one given Qur''an and the one given wealth, both using the gift night and day.', 'medium', 'hadith'),
  (v_q, 13, 'Which verse is cited to show Allah''s promise to guard the Qur''an?',
   '["A. Al-Hijr 15:9 — ''We sent down the Reminder and We are its Guardian''","B. An-Nahl 16:98","C. Al-Isrāʾ 17:82","D. Ṣād 38:29"]'::jsonb, 'A',
   '﴿إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ﴾ — Al-Ḥijr 15:9.', 'hard', 'quranic-virtues'),
  (v_q, 14, '"The superiority of the speech of Allah over all other speech is like the superiority of Allah over His creation." This hadith teaches that:',
   '["A. Human poetry can rival the Qur''an","B. The Qur''an is unparalleled — no speech resembles or rivals it","C. The Qur''an is only superior in Arabic","D. Only the Fatihah is special"]'::jsonb, 'B',
   'Hadith 9 — Allah''s speech has no equal, just as Allah Himself has no equal among creation.', 'hard', 'hadith'),
  (v_q, 15, 'The verse ﴿وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ﴾ is from:',
   '["A. Sūrat Al-Fatihah","B. Sūrat Al-Isrāʾ (17):82","C. Sūrat An-Nisāʾ (4):87","D. Sūrat Al-Māʾidah (5):15"]'::jsonb, 'B',
   '"And We send down of the Qur''an that which is healing and mercy for the believers." — Al-Isrāʾ 17:82.', 'hard', 'quranic-virtues');

  -- ============================================================
  -- TMP 102 · Chapter 2 — The Etiquettes of Reciting the Qur'an
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_u02, 'Quiz: Etiquettes of Reciting the Qur''an',
          'The ten ādāb taught through the Qur''an, the Sunnah, and the practice of the Companions.',
          10, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'The word Ādāb (آداب) refers to:',
   '["A. Chains of narrators","B. Etiquettes or manners","C. Letters of the alphabet","D. Schools of fiqh"]'::jsonb, 'B',
   'Ādāb = etiquettes/manners — the proper conduct observed in worship.', 'easy', 'terminology'),
  (v_q, 2, 'Ikhlāṣ (إخلاص) means:',
   '["A. Speed in recitation","B. Sincerity — worship for Allah alone","C. Beautifying the voice","D. Memorising the Qur''an"]'::jsonb, 'B',
   'Ikhlāṣ = sincerity; performing the act solely for Allah.', 'easy', 'terminology'),
  (v_q, 3, 'Tadabbur (تدبر) means:',
   '["A. Reciting quickly","B. Reflection and pondering over the verses","C. Memorisation","D. Speaking loudly"]'::jsonb, 'B',
   'Tadabbur = reflecting deeply on the meaning of each verse.', 'easy', 'terminology'),
  (v_q, 4, 'How many etiquettes of Qur''anic recitation are listed in this lesson?',
   '["A. Five","B. Seven","C. Ten","D. Twelve"]'::jsonb, 'C',
   'The lesson lists ten ādāb drawn from the Qur''an, Sunnah, and practice of the Companions.', 'easy', 'overview'),
  (v_q, 5, 'Which verse is cited as evidence for sincerity (Ikhlāṣ) in worship?',
   '["A. Al-Bayyinah (98):5","B. Ṣād (38):29","C. Al-Aʿrāf (7):204","D. Al-Muzzammil (73):4"]'::jsonb, 'A',
   '﴿وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ حُنَفَاءَ﴾ — Al-Bayyinah 98:5.', 'medium', 'ayat'),
  (v_q, 6, 'The lesson names three realities of greatness to bring to mind before recitation. Which set is CORRECT?',
   '["A. The Imam, the Mushaf, the scholar","B. The One who sent it down (Allah), what was sent down (the Qur''an), and the one upon whom it was sent (the Prophet ﷺ)","C. The angels, the jinn, and mankind","D. The past, the present, and the future"]'::jsonb, 'B',
   'Allah (the Sender), the Qur''an (what was sent), the Prophet ﷺ (the recipient).', 'medium', 'adab-2'),
  (v_q, 7, 'When passing a verse of warning and punishment, the reciter should:',
   '["A. Skip it quickly","B. Laugh to lift the mood","C. Listen attentively with the heart and seek refuge with Allah from His punishment","D. Translate it aloud"]'::jsonb, 'C',
   'The lesson: incline to mercy verses with longing; for warning verses, seek refuge with Allah from His punishment.', 'medium', 'tadabbur'),
  (v_q, 8, 'The verse ﴿كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ﴾ is from which sūrah?',
   '["A. Al-Muzzammil","B. Ṣād (38):29","C. An-Naḥl","D. Al-Aʿrāf"]'::jsonb, 'B',
   '"A blessed Book which We have revealed to you, that they might reflect upon its verses" — Ṣād 38:29.', 'medium', 'ayat'),
  (v_q, 9, 'While beautifying the voice, the reciter should avoid all of the following EXCEPT:',
   '["A. Being self-admiring about one''s voice","B. Looking at oneself with a self-congratulating eye","C. Directing all focus to Tajweed alone and forgetting meaning","D. Remembering there is no power or strength except with Allah"]'::jsonb, 'D',
   'Remembering ḥawla wa-lā quwwata illā billāh is encouraged — the others are pitfalls to avoid.', 'hard', 'adab-4'),
  (v_q, 10, 'The Siwāk (سواك) mentioned in the adab of purification is:',
   '["A. A ritual bath","B. A natural toothstick from the Arāk tree","C. A posture for prayer","D. A form of dhikr"]'::jsonb, 'B',
   'Siwāk is the toothstick from the Arāk tree — sunnah before recitation to purify and honour the act.', 'medium', 'terminology'),
  (v_q, 11, 'Which verse commands listeners to be silent and attentive during recitation?',
   '["A. Al-Aʿrāf (7):204","B. Al-Isrāʾ (17):106","C. An-Naḥl (16):98","D. Al-Ḥijr (15):9"]'::jsonb, 'A',
   '﴿وَإِذَا قُرِئَ الْقُرْآنُ فَاسْتَمِعُوا لَهُ وَأَنصِتُوا﴾ — Al-Aʿrāf 7:204.', 'medium', 'ayat'),
  (v_q, 12, 'When Ibn Masʿūd ؓ recited Sūrat al-Nisāʾ to the Prophet ﷺ, at which verse did the Prophet ﷺ say "That is enough" with tears in his eyes?',
   '["A. Al-Nisāʾ: 1","B. Al-Nisāʾ: 41 — ''So how will it be when We bring from every nation a witness…''","C. Al-Nisāʾ: 59","D. Al-Nisāʾ: 176"]'::jsonb, 'B',
   'The narration specifies verse 41 — the verse about bringing a witness from every nation.', 'hard', 'narration'),
  (v_q, 13, 'Anas ibn Mālik ؓ described the recitation of the Prophet ﷺ as:',
   '["A. Fast and brief","B. With prolongation — lengthening Bismillāh, then al-Raḥmān, then al-Raḥīm","C. Without any madd at all","D. Only in whisper"]'::jsonb, 'B',
   'Anas: "He would say Bismillāh and lengthen it, al-Raḥmān and lengthen it, al-Raḥīm and lengthen it."', 'medium', 'narration'),
  (v_q, 14, 'Ibn Masʿūd ؓ corrected a man who recited "Innamā al-ṣadaqātu lil-fuqarāʾ" quickly. What did he insist the correct recitation required?',
   '["A. Faster reading","B. Proper elongation (madd) on lil-fuqarāʾ","C. Dropping the lām","D. Reading it silently"]'::jsonb, 'B',
   'He said: "The Messenger of Allah ﷺ did not recite it like this" and recited it with the proper madd.', 'hard', 'narration'),
  (v_q, 15, 'Regarding the Muṣḥaf, the lesson says all of the following are prohibited EXCEPT:',
   '["A. Placing anything on top of it","B. Placing it on the ground","C. Placing it in an unworthy location","D. Holding it with clean hands and full reverence"]'::jsonb, 'D',
   'Holding the Muṣḥaf with clean hands and reverence is precisely what is commanded — the others are prohibited.', 'hard', 'adab-10');

  -- ============================================================
  -- TMP 102 · Chapter 3 — The Science of Tajweed
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_u03, 'Quiz: The Science of Tajweed',
          'Definition, letter rights, characteristics, and purpose of Tajweed.',
          10, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'Linguistically, the word "Tajweed" comes from a root meaning:',
   '["A. To shorten","B. To do something well, beautifully, and with mastery","C. To break down","D. To memorise"]'::jsonb, 'B',
   'Tajweed linguistically = beautification and perfection — doing something excellently.', 'easy', 'definition'),
  (v_q, 2, 'Technically, Tajweed is defined as:',
   '["A. Reading the Qur''an as fast as possible","B. Producing the letters from their articulation points and giving each letter its due rights","C. Memorising the Qur''an without error","D. Writing the Qur''an in clear script"]'::jsonb, 'B',
   'Technical definition: producing letters from correct makhārij and giving each its rights and applied characteristics.', 'easy', 'definition'),
  (v_q, 3, 'Makhārij (مخارج) refers to:',
   '["A. The rules of madd","B. The articulation points where each letter is produced","C. The names of the seven imams","D. The 30 juz of the Qur''an"]'::jsonb, 'B',
   'Makhārij = articulation points — the exact places in the mouth, throat, or nose where each letter originates.', 'easy', 'terminology'),
  (v_q, 4, 'Haqq al-Harf (حق الحرف) is best described as:',
   '["A. Rights applied only in certain contexts","B. The inherent rights of a letter — its fixed, inseparable qualities","C. The number of letters in a word","D. The meaning of the letter"]'::jsonb, 'B',
   'Haqq al-Harf = fixed, inseparable qualities of a letter that always belong to it.', 'easy', 'letter-rights'),
  (v_q, 5, 'Mustahaqq al-Harf (مستحق الحرف) refers to:',
   '["A. The inherent qualities of a letter","B. Additional qualities that apply only in context","C. The writing shape of the letter","D. The meaning of the word"]'::jsonb, 'B',
   'Mustahaqq al-Harf = applied/contextual qualities — rules that appear depending on surrounding letters.', 'medium', 'letter-rights'),
  (v_q, 6, 'Al-Lahn (اللحن) means:',
   '["A. Beautiful recitation","B. Error in recitation — mispronouncing letters or applying rules incorrectly","C. Silence in prayer","D. Poetry"]'::jsonb, 'B',
   'Al-Lahn = error/mistake in recitation. Tajweed protects against it.', 'medium', 'terminology'),
  (v_q, 7, 'Al-Sifat al-Lazimah (الصفات اللازمة) are:',
   '["A. The contextual characteristics","B. The inherent, inseparable characteristics of a letter","C. The names of madd types","D. The seven readers"]'::jsonb, 'B',
   'Lazimah = "necessary/binding" — the fixed characteristics always present.', 'medium', 'characteristics'),
  (v_q, 8, 'Al-Sifat al-Mukammilah (الصفات المكملة) are:',
   '["A. The inherent characteristics","B. The contextual/applied characteristics (rules based on surroundings)","C. The ten sub-narrators","D. The rules of stopping"]'::jsonb, 'B',
   'Mukammilah = "complementary" — contextual qualities applied based on position/neighbours.', 'medium', 'characteristics'),
  (v_q, 9, 'Which of the following is an INHERENT characteristic (ṣifah lāzimah)?',
   '["A. Al-Tafkhim","B. Al-Idgham","C. Al-Jahr","D. Al-Madd"]'::jsonb, 'C',
   'Al-Jahr (voicing/resonance) is one of the 11 inherent ṣifāt lāzimah; the others listed are applied characteristics.', 'hard', 'characteristics'),
  (v_q, 10, 'Which of the following is a CONTEXTUAL characteristic (ṣifah mukammilah)?',
   '["A. Al-Shiddah","B. Al-Hams","C. Al-Ikhfaʾ","D. Al-Itbaq"]'::jsonb, 'C',
   'Al-Ikhfāʾ (concealment) is a mukammilah; Shiddah, Hams, and Itbaq are all inherent lāzimah.', 'hard', 'characteristics'),
  (v_q, 11, 'The famous Tajweed definition "giving the letters their due rights — from inherent qualities and applied ones" comes from:',
   '["A. Ibn Mujahid","B. Ibn al-Jazari (in Al-Muqaddimah al-Jazariyyah)","C. Imam Malik","D. Al-Shāfiʿī"]'::jsonb, 'B',
   'The verse: «وَهُوَ إِعْطَاءُ الْحُرُوفِ حَقَّهَا — مِنْ صِفَةٍ لَهَا وَمُسْتَحَقَّهَا».', 'medium', 'definition'),
  (v_q, 12, 'The stated purpose of Tajweed is to enable the Muslim to:',
   '["A. Recite the Qur''an as fast as possible","B. Recite the Noble Qur''an as it deserves, and protect the tongue from al-Lahn","C. Memorise it within a year","D. Translate it to all languages"]'::jsonb, 'B',
   'The purpose: recite the Qur''an as it truly deserves and avoid errors (al-Lahn).', 'medium', 'purpose'),
  (v_q, 13, 'Which pair lists one opposite pair of inherent characteristics?',
   '["A. Al-Isti''la'' and Al-Istifal","B. Al-Ikhfāʾ and Al-Iqlāb","C. Al-Madd and Al-Qaṣr","D. Al-Tafkhim and Al-Tarqiq"]'::jsonb, 'A',
   'Isti''la'' (tongue elevation) and Istifāl (tongue lowering) are opposite inherent characteristics.', 'hard', 'characteristics'),
  (v_q, 14, 'Which rule is NOT one of the inherent (lāzimah) characteristics listed in the lesson?',
   '["A. Al-Shiddah","B. Al-Rakhawah","C. Al-Safir","D. Al-Madd"]'::jsonb, 'D',
   'Al-Madd is an applied (mukammilah) characteristic, not an inherent one.', 'hard', 'characteristics'),
  (v_q, 15, 'Itqan (إتقان), referenced in the lesson, means:',
   '["A. Fast reading","B. Mastery and precision — consistent correctness without error","C. Repetition","D. Beautiful voice"]'::jsonb, 'B',
   'Itqan = doing something correctly and consistently without error.', 'medium', 'terminology');

  -- ============================================================
  -- TMP 102 · Chapter 4 — Al-Isti'aadhah and Al-Basmalah
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_u04, 'Quiz: Al-Isti''aadhah and Al-Basmalah',
          'Seeking refuge, the Basmalah, and the ways of joining them with the surah.',
          10, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'The word Isti''aadhah literally means:',
   '["A. Praising Allah","B. Seeking refuge/shelter with Allah","C. Beginning with Bismillah","D. Asking forgiveness"]'::jsonb, 'B',
   'Isti''aadhah = taking shelter and holding on tightly to Allah — asking Him for protection.', 'easy', 'istiaadhah'),
  (v_q, 2, 'What is the STANDARD wording of the Isti''aadhah (used by all reciters)?',
   '["A. Bismillāhi r-Raḥmāni r-Raḥīm","B. Aʿūdhu billāhi mina sh-shayṭāni r-rajīm","C. Subḥāna llāhi wa bi-ḥamdih","D. Allāhumma ṣalli ʿalā Muḥammad"]'::jsonb, 'B',
   'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ — the standard form used by all reciters.', 'easy', 'istiaadhah'),
  (v_q, 3, 'Which verse commands seeking refuge before recitation?',
   '["A. An-Naḥl (16):98","B. Al-Fātiḥah (1):1","C. An-Naṣr (110):3","D. Al-Ikhlāṣ (112):1"]'::jsonb, 'A',
   '﴿فَإِذَا قَرَأْتَ الْقُرْآنَ فَاسْتَعِذْ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ﴾ — An-Naḥl 16:98.', 'easy', 'istiaadhah'),
  (v_q, 4, 'According to the majority view, saying the Isti''aadhah before recitation is:',
   '["A. Forbidden (ḥarām)","B. Obligatory (wājib)","C. Recommended (mandūb)","D. Disliked (makrūh)"]'::jsonb, 'C',
   'The majority hold Mandūb — strongly encouraged but not sinful to leave out. Some scholars held it Wājib.', 'medium', 'istiaadhah'),
  (v_q, 5, 'In which single situation is the Isti''aadhah said ALOUD?',
   '["A. Reading silently alone","B. When beginning recitation aloud with listeners present","C. Inside prayer (ṣalāh)","D. When reading in a group but not starting"]'::jsonb, 'B',
   'Aloud only when others need to hear you begin. In prayer and silent/solo reading it is silent.', 'medium', 'istiaadhah'),
  (v_q, 6, 'For which surah is the Basmalah NOT recited at its beginning?',
   '["A. Sūrat al-Fātiḥah","B. Sūrat al-Tawbah (Barāʾah)","C. Sūrat al-Ikhlāṣ","D. Sūrat al-Baqarah"]'::jsonb, 'B',
   'Sūrat at-Tawbah is the one exception where the Basmalah is not said.', 'easy', 'basmalah'),
  (v_q, 7, 'When starting recitation from the MIDDLE of a surah, saying the Basmalah is:',
   '["A. Forbidden","B. Obligatory","C. Optional — your choice","D. Disliked"]'::jsonb, 'C',
   'From the middle of a surah, it is the reciter''s choice.', 'medium', 'basmalah'),
  (v_q, 8, 'When beginning a surah from its start, how many ALLOWED ways are there to combine Isti''aadhah, Basmalah, and surah?',
   '["A. Two","B. Three","C. Four","D. Five"]'::jsonb, 'C',
   'Four allowed ways when beginning a surah from its start.', 'easy', 'four-ways'),
  (v_q, 9, 'When moving BETWEEN two surahs (e.g., Falaq to Nās), how many allowed ways are there?',
   '["A. Two","B. Three","C. Four","D. Five"]'::jsonb, 'B',
   'Three allowed ways between two surahs — one combination is forbidden.', 'medium', 'between-surahs'),
  (v_q, 10, 'Which combination between two surahs is FORBIDDEN?',
   '["A. Stop at end of surah, stop at Basmalah, start next surah","B. Join everything through Basmalah into the next surah","C. Join the end of the previous surah to the Basmalah, then stop before the next surah","D. Stop at end of surah, then join the Basmalah to the next surah"]'::jsonb, 'C',
   'Joining the Basmalah to the end of the previous surah wrongly attaches the Basmalah to the surah that ended.', 'hard', 'between-surahs'),
  (v_q, 11, 'Why is option C above forbidden?',
   '["A. The Basmalah is too short","B. The Basmalah always belongs to the NEXT surah, not the previous one","C. It breaks a rule of tajweed","D. It makes recitation too fast"]'::jsonb, 'B',
   'The Basmalah announces the next surah; attaching it to the previous surah misrepresents it.', 'hard', 'between-surahs'),
  (v_q, 12, 'Of the four ways when beginning a surah, "وَصْلُ الجَمِيع" (joining everything) means:',
   '["A. Stop after Isti''aadhah, stop after Basmalah, then surah","B. Join Isti''aadhah + Basmalah + surah all together without stopping","C. Only Isti''aadhah joined to Basmalah","D. Only Basmalah joined to surah"]'::jsonb, 'B',
   'Waṣl al-jamīʿ = flow all three together without stopping in between.', 'medium', 'four-ways'),
  (v_q, 13, '"قَطْعُ الاسْتِعَاذَة، وَصْلُ البَسْمَلَة بِالسُّورَة" means:',
   '["A. Stop after each of the three","B. Stop after Isti''aadhah, then join Basmalah to the surah","C. Join Isti''aadhah with Basmalah, stop before surah","D. Join everything"]'::jsonb, 'B',
   'Stop after the Isti''aadhah; join the Basmalah directly into the surah.', 'hard', 'four-ways'),
  (v_q, 14, 'Which situation calls for saying the Isti''aadhah SILENTLY?',
   '["A. Starting recitation alone","B. Reading in a group but not the one starting","C. Reciting in prayer","D. All of the above"]'::jsonb, 'D',
   'All three are silent situations. The only aloud case is beginning recitation aloud with listeners.', 'hard', 'istiaadhah'),
  (v_q, 15, 'The LONGER form of the Isti''aadhah adds which divine names of Allah?',
   '["A. Al-Ghafūr, Al-Raḥīm","B. As-Samīʿ, Al-ʿAlīm","C. Al-Malik, Al-Qudūs","D. Al-Ḥayy, Al-Qayyūm"]'::jsonb, 'B',
   'أَعُوذُ بِاللَّهِ السَّمِيعِ الْعَلِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ — adding "the All-Hearing, the All-Knowing".', 'medium', 'istiaadhah');

  -- ============================================================
  -- TMP 102 · Chapter 5 — Maraatib al-Qira'ah
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_u05, 'Quiz: Maraatib al-Qira''ah',
          'The levels (speeds) of recitation: Tahqeeq, Tadweer, Hadr — and what makes them valid.',
          10, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, '"Maraatib al-Qira''ah" refers to:',
   '["A. The seven readers","B. The levels (speeds) of Qur''anic recitation","C. The ten mutawātir recitations","D. The chains of Hafs''s narrators"]'::jsonb, 'B',
   'Maraatib al-Qira''ah = the levels/speeds at which the Qur''an may be recited.', 'easy', 'overview'),
  (v_q, 2, 'The verse ﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾ is from:',
   '["A. Sūrat Al-Fātiḥah","B. Sūrat Al-Muzzammil: 4","C. Sūrat Al-Baqarah: 2","D. Sūrat Al-Kahf: 1"]'::jsonb, 'B',
   'Al-Muzzammil 73:4 — "Recite the Qur''an in a measured way."', 'easy', 'ayat'),
  (v_q, 3, 'Which of the three levels means SLOW and careful recitation?',
   '["A. Al-Hadr","B. At-Tadweer","C. At-Tahqeeq","D. At-Tarteel"]'::jsonb, 'C',
   'At-Tahqeeq = slow, careful — used primarily for teaching.', 'easy', 'tahqeeq'),
  (v_q, 4, 'Which level means MEDIUM pace?',
   '["A. Al-Hadr","B. At-Tadweer","C. At-Tahqeeq","D. At-Tarteel"]'::jsonb, 'B',
   'At-Tadweer = middle pace between slow and fast.', 'easy', 'tadweer'),
  (v_q, 5, 'Which level means FAST recitation (while still observing tajweed)?',
   '["A. Al-Hadr","B. At-Tadweer","C. At-Tahqeeq","D. At-Tarteel"]'::jsonb, 'A',
   'Al-Hadr = fast, but only if every rule of tajweed is still applied.', 'easy', 'hadr'),
  (v_q, 6, 'At-Tahqeeq is primarily used for which purpose?',
   '["A. Finishing the Qur''an quickly","B. Teaching and learning","C. Everyday recitation","D. Competitions"]'::jsonb, 'B',
   'Tahqeeq''s slow pace lets students hear every letter and rule clearly — best for teaching.', 'medium', 'tahqeeq'),
  (v_q, 7, 'According to the preferred view in the lesson, which three levels are correct?',
   '["A. Al-Hadr, At-Tadweer, At-Tarteel","B. Al-Hadr, At-Tadweer, At-Tahqeeq","C. At-Tahqeeq, At-Tarteel, At-Tadweer","D. At-Tahqeeq, Al-Hadr, At-Taḥbīr"]'::jsonb, 'B',
   'The preferred view is the first one: Al-Hadr, At-Tadweer, At-Tahqeeq.', 'medium', 'views'),
  (v_q, 8, 'The second scholarly view replaces At-Tahqeeq with which level?',
   '["A. Al-Jahr","B. At-Tarteel","C. At-Taḥbīr","D. At-Tamjeed"]'::jsonb, 'B',
   'The second view says the three levels are Al-Hadr, At-Tadweer, and At-Tarteel (instead of Tahqeeq).', 'medium', 'views'),
  (v_q, 9, 'The preferred view holds that all three valid levels are themselves considered:',
   '["A. Wājib","B. Tarteel","C. Makrūh","D. Unequal in reward"]'::jsonb, 'B',
   'All three — Hadr, Tadweer, Tahqeeq — are tarteel, provided tajweed rules are observed.', 'medium', 'tarteel'),
  (v_q, 10, 'Which Arabic grammatical form is "at-Tahqeeq"? (Analyse the word shape.)',
   '["A. A verb in past tense","B. A maṣdar (verbal noun) from the form تَفْعِيل (taf''īl)","C. A plural of taksīr","D. A particle (ḥarf)"]'::jsonb, 'B',
   'At-Tahqeeq is a maṣdar on the taf''īl pattern — like at-Tadweer and at-Tarteel — all nouns of the same shape.', 'hard', 'word-analysis'),
  (v_q, 11, 'Ibn al-Jazari''s poem that affirms the three levels is called:',
   '["A. Al-Muqaddimah al-Jazariyyah","B. Tayyibat an-Nashr","C. Al-Shāṭibiyyah","D. Al-Taysīr"]'::jsonb, 'B',
   'He summarised the three levels in Tayyibat an-Nashr.', 'hard', 'ibn-jazari'),
  (v_q, 12, 'The lesson warns that speed WITHOUT tajweed is not "hadr" — it is:',
   '["A. Tarteel","B. Tadweer","C. Carelessness","D. Tahqeeq"]'::jsonb, 'C',
   'The lesson states plainly: speed without tajweed is not hadr — it is carelessness.', 'medium', 'hadr'),
  (v_q, 13, 'Al-Hadr is best suited for which purpose?',
   '["A. Teaching a new student","B. Reviewing or completing long portions of the Qur''an","C. Reciting in a classroom","D. Memorising for the first time"]'::jsonb, 'B',
   'Hadr''s fast pace is practical for reviewing or completing long portions.', 'medium', 'hadr'),
  (v_q, 14, 'The core requirement across ALL three levels is:',
   '["A. Loud voice","B. Applying the rules of tajweed (tarteel)","C. Perfect memorisation","D. Arabic accent"]'::jsonb, 'B',
   'No matter the speed, recitation must always be tarteel — clear, careful, and correct.', 'hard', 'tarteel'),
  (v_q, 15, 'In the line «مَعْ حُسْنِ صَوْتٍ بِلُحُونِ الْعَرَبِ», Ibn al-Jazari mentions that recitation should be accompanied by:',
   '["A. Musical instruments","B. A beautiful voice, in the melodies of the Arabs","C. Silence","D. Translation"]'::jsonb, 'B',
   'A beautiful voice in Arab melodies — while still being tarteel and mujawwad in Arabic.', 'hard', 'ibn-jazari');

END $$;
