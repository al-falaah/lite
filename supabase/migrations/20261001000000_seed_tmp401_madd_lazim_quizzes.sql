-- TMP 401 (Rules of Al-Madd) — quizzes for the remaining madd chapters.
--
-- Course e524733d (slug tmp-401-rules-of-al-madd-sound-elongation). Chapters 1–3
-- already have quizzes (natural madd, hamza madd, sukoon madd part 1). This seeds
-- the three the user asked for:
--   ch5  Secondary Madd Influenced By Sukoon - Part 2  — al-madd al-laazim (its 4 types)
--   ch6  Disjointed Letters                            — al-huroof al-muqatta'ah (surah openers)
--   ch7  Auxiliary Madd Types                           — madd al-'iwad, al-silah, al-tamkeen
--
-- 10 questions per quiz (30 total), difficulty ramps medium → hard. Each question
-- has one clearly-correct answer and plausible (real madd-type) distractors — no
-- trick wording. Questions test standard, well-established tajweed of these rules;
-- every Qur'anic example is verbatim from quran_tajweed_aya (vowelled Uthmani,
-- tafsir.net sourced) and was confirmed to contain the exact phenomenon it shows.
--
-- Bidi: every ﴿…﴾ ayah span is wrapped in U+2067 (RLI) … U+2069 (PDI) so the
-- ornate brackets render in the right order inside the English sentence.
--
-- Idempotent: deletes any existing quiz on these chapters before reseeding.

DO $$
DECLARE
  v_ch5 UUID; v_ch6 UUID; v_ch7 UUID;
  v_q UUID;
BEGIN
  SELECT id INTO v_ch5 FROM lesson_chapters WHERE id = 'f1f6d007-f845-4d3f-a6a8-dd561a42149c';
  SELECT id INTO v_ch6 FROM lesson_chapters WHERE id = '4dc4a913-a36f-45da-8301-773a087763c8';
  SELECT id INTO v_ch7 FROM lesson_chapters WHERE id = '3b6a752e-7364-43ef-a3cf-ede5d431488c';
  IF v_ch5 IS NULL OR v_ch6 IS NULL OR v_ch7 IS NULL THEN
    RAISE EXCEPTION 'TMP 401 chapter(s) not found (ch5=%, ch6=%, ch7=%)', v_ch5, v_ch6, v_ch7;
  END IF;

  DELETE FROM lesson_quizzes WHERE chapter_id IN (v_ch5, v_ch6, v_ch7);

  -- ============================================================
  -- Chapter 5 — Al-Madd Al-Laazim (the necessary madd)
  --   Four types: kalimi muthaqqal, kalimi mukhaffaf,
  --               harfi muthaqqal, harfi mukhaffaf. Always 6 harakat.
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch5, 'Quiz: Al-Madd Al-Lāzim (المد اللازم)',
          'The necessary madd — its cause, its fixed length of 6, and its four types.',
          7, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'What causes madd laazim (the necessary madd)?',
   '["A. A madd letter followed by a hamza","B. A madd letter followed by a PERMANENT (original) sukoon","C. A madd letter followed by a temporary sukoon from stopping","D. A hamza before the madd letter"]'::jsonb, 'B',
   'Madd laazim = a madd letter followed by a sukoon that is ALWAYS there — in both joining and stopping. (A temporary sukoon from stopping is aaridh, not laazim.)', 'medium', 'definition'),
  (v_q, 2, 'For how many harakat is madd laazim held?',
   '["A. 2 harakat","B. 4 harakat","C. 6 harakat","D. 2, 4 or 6 (reader''s choice)"]'::jsonb, 'C',
   'Madd laazim is always held for 6 harakat with no variation — the longest madd.', 'medium', 'length'),
  (v_q, 3, 'The four types of madd laazim are split by two pairs of terms. Which pair is correct?',
   '["A. kalimi / harfi  and  muthaqqal / mukhaffaf","B. muttasil / munfasil  and  wajib / jaaiz","C. asli / far''i  and  qasr / tool","D. sughra / kubra  and  badal / iwad"]'::jsonb, 'A',
   'Madd laazim is either kalimi (in a word) or harfi (in a letter-name), and each is either muthaqqal (the sukoon is in a shaddah/idghaam) or mukhaffaf (a plain sukoon).', 'medium', 'types'),
  (v_q, 4, 'What is the difference between muthaqqal and mukhaffaf?',
   '["A. Muthaqqal is 6 counts, mukhaffaf is 4","B. In muthaqqal the following sukoon is merged into a shaddah (idghaam); in mukhaffaf it is a plain, un-merged sukoon","C. Muthaqqal is in a word, mukhaffaf is in a letter","D. Muthaqqal has a hamza, mukhaffaf has a sukoon"]'::jsonb, 'B',
   'Muthaqqal (heavy) = the sakin letter is assimilated into a shaddah. Mukhaffaf (light) = the sakin letter is a clear, plain sukoon. Both are still 6 harakat.', 'hard', 'types'),
  (v_q, 5, 'In ⁧﴿فَإِذَا جَآءَتِ ٱلصَّآخَّةُ﴾⁩, the word ٱلصَّآخَّة (an alif of madd followed by a shaddah-bearing khaa) is an example of:',
   '["A. madd laazim kalimi muthaqqal","B. madd laazim kalimi mukhaffaf","C. madd aaridh li-s-sukoon","D. madd muttasil"]'::jsonb, 'A',
   'The madd alif is followed by a sakin khaa merged into a shaddah (ـخّ), inside one WORD — madd laazim kalimi muthaqqal, 6 harakat.', 'hard', 'kalimi'),
  (v_q, 6, 'In ⁧﴿وَلَا ٱلضَّآلِّينَ﴾⁩ (the last word of al-Faatihah), the alif of madd is followed by a laam with a shaddah. This is:',
   '["A. madd aaridh li-s-sukoon","B. madd laazim kalimi muthaqqal","C. madd laazim kalimi mukhaffaf","D. madd badal"]'::jsonb, 'B',
   'ٱلضَّآلِّين: the madd alif is followed by a doubled (shaddah) laam that stays sakin in joining and stopping — kalimi muthaqqal, 6 harakat.', 'hard', 'kalimi'),
  (v_q, 7, 'The only place in the Qur''an where madd laazim kalimi MUKHAFFAF occurs is the word ءَآلۡـَٰٔنَ (as in ⁧﴿ءَآلۡـَٰٔنَ وَقَدۡ عَصَيۡتَ﴾⁩, Yunus 10:91). Why is it MUKHAFFAF?',
   '["A. The sukoon after the madd letter is a plain (un-merged) sukoon, not in a shaddah","B. It is held for only 4 harakat","C. The madd letter is a yaa","D. It is caused by a hamza"]'::jsonb, 'A',
   'In ءَآلۡـَٰٔن the madd alif is followed by a plain sakin laam ( لْ) — a clear, un-merged sukoon — so it is mukhaffaf (light), still 6 harakat.', 'hard', 'kalimi'),
  (v_q, 8, 'Madd laazim HARFI occurs in:',
   '["A. Any word ending in a madd letter","B. Certain disjointed letters at the start of a surah whose spelled-out name has 3 letters with a madd in the middle","C. A hamza followed by a madd letter","D. The haa of the pronoun"]'::jsonb, 'B',
   'Harfi = it occurs in the NAME of a disjointed letter (e.g. the laam of الم is spelled laam-alif-meem) when that name is three letters with the middle one a madd letter ending in sukoon.', 'hard', 'harfi'),
  (v_q, 9, 'In the opening ⁧﴿الٓمٓ﴾⁩, the letter laam (spelled لَامْ, i.e. laam–alif–meem) carries madd laazim harfi muthaqqal. Why MUTHAQQAL?',
   '["A. Because the laam has a hamza","B. Because the sakin meem at the end of لَامْ merges (idghaam) into the meem of مّيم that follows","C. Because it is read at 4 harakat","D. Because the alif is doubled"]'::jsonb, 'B',
   'الٓمٓ = laam + meem. The final (sakin) meem of لَامْ assimilates into the following مّيم — a sukoon inside a shaddah — so the laam''s madd is muthaqqal, 6 harakat.', 'hard', 'harfi'),
  (v_q, 10, 'In ⁧﴿قٓ﴾⁩ (Qaf 50:1) and ⁧﴿نٓ﴾⁩ (al-Qalam 68:1), the single letters qaaf and noon are spelled with a madd and a final plain sukoon (قَافْ, نُونْ). Their madd is:',
   '["A. madd laazim harfi mukhaffaf (6 harakat)","B. madd laazim harfi muthaqqal","C. madd aaridh (2/4/6)","D. natural madd (2)"]'::jsonb, 'A',
   'قٓ and نٓ are read qaaaaaf / nuuuun: a madd letter then a PLAIN sakin letter (no merging) — madd laazim harfi mukhaffaf, 6 harakat.', 'hard', 'harfi');

  -- ============================================================
  -- Chapter 6 — Al-Huroof Al-Muqatta'ah (disjointed letters)
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch6, 'Quiz: Disjointed Letters (الحروف المقطعة)',
          'The letters that open some surahs — how they are read and the madd each one takes.',
          7, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'How are the disjointed letters (al-huroof al-muqatta''ah) at the start of a surah read?',
   '["A. As an ordinary word","B. Letter by letter, each by its spelled-out NAME","C. Silently","D. Only the first letter is pronounced"]'::jsonb, 'B',
   'They are read by their individual letter-names: الٓمٓ is read alif–laam–meem, not as a word.', 'medium', 'reading'),
  (v_q, 2, 'The disjointed letters are gathered in how many surah-openings, and the letters themselves number fourteen, famously collected in the phrase:',
   '["A. نَصٌّ حَكِيمٌ قَاطِعٌ لَهُ سِرٌّ","B. حَيٌّ طَاهِرٌ","C. أَبْجَد هَوَّز","D. كَلِمٌ طَيِّبٌ"]'::jsonb, 'A',
   'The fourteen disjointed letters are collected in the mnemonic نَصٌّ حَكِيمٌ قَاطِعٌ لَهُ سِرٌّ (and similar). They appear at the start of 29 surahs.', 'medium', 'overview'),
  (v_q, 3, 'The disjointed letters fall into groups by how they are read. The letter alif (as in الٓمٓ) is:',
   '["A. Read with a 6-harakat madd","B. Read with a 2-harakat madd","C. Read with NO madd at all — just the sound ''alif''","D. Not pronounced"]'::jsonb, 'C',
   'Alif has no madd here — it is simply sounded. It is the one letter in these openings with no elongation.', 'medium', 'groups'),
  (v_q, 4, 'Five letters — ح ي ط ه ر — when they open a surah are read with:',
   '["A. 6 harakat","B. A natural madd of 2 harakat","C. No madd","D. 4 harakat"]'::jsonb, 'B',
   'The group gathered in حَيٌّ طَهُرَ (ح ي ط ه ر) is read with a 2-harakat (natural) madd — their spelled names are two letters with no final sukoon cause (e.g. haa = حَا, yaa = يَا).', 'hard', 'groups'),
  (v_q, 5, 'Eight letters — ن ق ص ع س ل ك م — when they open a surah are read with a madd of:',
   '["A. 2 harakat","B. 4 harakat","C. 6 harakat (madd laazim harfi)","D. No madd"]'::jsonb, 'C',
   'The group in نَقَصَ عَسَلُكُمۡ (ن ق ص ع س ل ك م) each spells out to three letters with a middle madd and a final sukoon — madd laazim harfi, 6 harakat.', 'hard', 'groups'),
  (v_q, 6, 'In ⁧﴿كٓهيعٓصٓ﴾⁩ (Maryam 19:1), which letters are read with the 6-harakat madd laazim?',
   '["A. All five equally","B. ك, ع and ص (kaaf, ayn, saad) — ha and ya take a 2-count madd","C. Only ي","D. None of them"]'::jsonb, 'B',
   'كٓهيعٓصٓ: kaaf (كَافْ), ayn (عَيْنْ) and saad (صَادْ) are from the 6-count group; haa and yaa are from the 2-count group. (Ayn also permits 4.)', 'hard', 'application'),
  (v_q, 7, 'The letter ع (ayn), as in ⁧﴿كٓهيعٓصٓ﴾⁩ and ⁧﴿حمٓ • عٓسٓقٓ﴾⁩, is a special case because:',
   '["A. It is read with no madd","B. It may be read with EITHER 4 or 6 harakat","C. It must be read with 2 harakat","D. It is read as a word"]'::jsonb, 'B',
   'Ayn (spelled عَيْنْ) contains a leen letter, so it is permitted at either 4 or 6 harakat — both are correct.', 'hard', 'application'),
  (v_q, 8, 'In ⁧﴿الٓمٓصٓ﴾⁩ (al-A''raf 7:1), how many letters carry a 6-harakat madd laazim?',
   '["A. One","B. Two — laam (لَامْ) and meem (مِّيمْ)... plus saad (صَادْ): three","C. Three — laam, meem and saad","D. None"]'::jsonb, 'C',
   'الٓمٓصٓ = alif (no madd) + laam + meem + saad, and laam, meem and saad are all from the 6-count (نقص عسلكم) group.', 'hard', 'application'),
  (v_q, 9, 'Why does the meem in ⁧﴿الٓمٓ﴾⁩ carry madd laazim harfi MUTHAQQAL while the meem in ⁧﴿الٓمٓرۚ﴾⁩ (ar-Ra''d 13:1) carries MUKHAFFAF?',
   '["A. Because the surahs are different lengths","B. In الم the meem''s final sukoon merges into the following letter (idghaam → shaddah); in المر the meem is followed by raa with no merging, so its sukoon is plain","C. Because المر has a hamza","D. Because alif is doubled in one of them"]'::jsonb, 'B',
   'In الٓمٓ the sakin meem of مِّيم merges into the next letter (heavy). In الٓمٓرۚ the meem is not merged into the raa, so it is a plain sukoon (light). Both are still 6 harakat.', 'hard', 'concept'),
  (v_q, 10, 'A reciter reaches ⁧﴿قٓۚ وَٱلۡقُرۡءَانِ ٱلۡمَجِيدِ﴾⁩ (Qaf 50:1). How is the opening قٓ read?',
   '["A. As the word ''qaf''","B. Qaaaaaf — the qaaf stretched for 6 harakat (madd laazim harfi mukhaffaf)","C. Qa — a 2-harakat madd","D. With no elongation"]'::jsonb, 'B',
   'قٓ is spelled قَافْ: a madd alif then a plain sakin faa — madd laazim harfi mukhaffaf, held 6 harakat.', 'hard', 'application');

  -- ============================================================
  -- Chapter 7 — Auxiliary madd types
  --   madd al-'iwad, madd al-silah (sughra/kubra), madd al-tamkeen
  -- ============================================================
  INSERT INTO lesson_quizzes (chapter_id, title, subtitle, passing_score, is_published, published_at)
  VALUES (v_ch7, 'Quiz: Auxiliary Madd Types',
          'Madd al-ʿiwaḍ, madd al-ṣilah, and madd al-tamkīn — the supplementary elongations.',
          7, true, now()) RETURNING id INTO v_q;

  INSERT INTO quiz_questions (quiz_id, question_number, question, options, correct_answer, explanation, difficulty, section_tag) VALUES
  (v_q, 1, 'Madd al-''iwad (the madd of substitution) happens when you:',
   '["A. Stop on a word ending in tanween fath (ـً), replacing the tanween with a 2-harakat alif","B. Stop on a word ending in tanween damm","C. Join a hamza to a madd letter","D. Read a doubled yaa"]'::jsonb, 'A',
   'At a stop, a final tanween fath is dropped and SUBSTITUTED by a madd alif of 2 harakat — madd al-iwad. (Tanween damm/kasr simply become a plain sukoon, with no madd.)', 'medium', 'iwad'),
  (v_q, 2, 'Madd al-silah is the elongation of which letter?',
   '["A. The haa of the pronoun (haa al-dameer), e.g. the ـهُ / ـهِ meaning ''his/its''","B. Any haa","C. The taa marbutah","D. The alif of madd"]'::jsonb, 'A',
   'Madd al-silah lengthens the haa al-dameer (the attached pronoun haa) when it sits between two voweled letters.', 'medium', 'silah'),
  (v_q, 3, 'Madd al-tamkeen occurs when:',
   '["A. A doubled (shaddah) yaa with kasrah is followed by a sakin yaa of madd, or a waw of madd meets a sakin waw","B. A hamza precedes a madd letter","C. Tanween fath is stopped upon","D. A single letter opens a surah"]'::jsonb, 'A',
   'Madd al-tamkeen ''establishes'' a madd letter that meets its own kind, e.g. a mushaddad yaa + madd yaa (ـيِّيـ) or a madd waw + sakin waw.', 'medium', 'tamkeen'),
  (v_q, 4, 'For how many harakat is madd al-''iwad held?',
   '["A. 2 harakat","B. 4 harakat","C. 6 harakat","D. 2, 4 or 6 (reader''s choice)"]'::jsonb, 'A',
   'Madd al-iwad is held for 2 harakat — the substituted alif has the natural length.', 'medium', 'iwad'),
  (v_q, 5, 'Madd al-silah has two kinds. Silah SUGHRA (the minor) is when the haa al-dameer is followed by:',
   '["A. A hamza","B. Any letter EXCEPT a hamza — held 2 harakat","C. A sukoon","D. A shaddah"]'::jsonb, 'B',
   'Silah sughra: the haa dameer (between two voweled letters) is NOT followed by a hamza — a small 2-harakat madd.', 'hard', 'silah'),
  (v_q, 6, 'Madd al-silah KUBRA (the major) is when the haa al-dameer IS followed by a hamza. It is then treated like, and lengthened to the length of:',
   '["A. Madd badal","B. Madd munfasil (e.g. 4–5 harakat)","C. Madd laazim (6)","D. It is not lengthened"]'::jsonb, 'B',
   'When a hamza follows the haa dameer, the silah becomes KUBRA and takes the munfasil length (commonly 4–5 harakat).', 'hard', 'silah'),
  (v_q, 7, 'When STOPPING on ⁧﴿فَمَن يَعۡمَلۡ مِثۡقَالَ ذَرَّةٍ خَيۡرٗا يَرَهُۥ﴾⁩ (az-Zalzalah 99:7), the word خَيۡرٗا shows which madd?',
   '["A. madd al-silah","B. madd al-iwad (the tanween fath becomes a 2-harakat alif: khayraa)","C. madd al-tamkeen","D. madd laazim"]'::jsonb, 'B',
   'Stopping on خَيۡرٗا drops the tanween fath and substitutes a 2-harakat alif — khayraa — madd al-iwad.', 'hard', 'iwad'),
  (v_q, 8, 'In ⁧﴿يَحۡسَبُ أَنَّ مَالَهُۥٓ أَخۡلَدَهُۥ﴾⁩ (al-Humazah 104:3), the haa of مَالَهُۥٓ — followed by the hamza of أَخۡلَدَهُ — is an example of:',
   '["A. madd al-silah sughra","B. madd al-silah kubra","C. madd al-iwad","D. madd al-tamkeen"]'::jsonb, 'B',
   'The haa dameer in مَالَهُۥٓ is followed by a hamza (أخلده), so it is silah KUBRA, lengthened to the munfasil length.', 'hard', 'silah'),
  (v_q, 9, 'In ⁧﴿لَّهُۥ مَا فِي ٱلسَّمَٰوَٰتِ﴾⁩ (from Ayat al-Kursi, 2:255), the haa of لَّهُۥ followed by the meem of مَا is an example of:',
   '["A. madd al-silah kubra","B. madd al-silah sughra (2 harakat)","C. madd al-iwad","D. no madd"]'::jsonb, 'B',
   'The haa dameer in لَّهُۥ is between two voweled letters and NOT followed by a hamza — silah sughra, 2 harakat.', 'hard', 'silah'),
  (v_q, 10, 'In ⁧﴿وَإِذَا حُيِّيتُم بِتَحِيَّةٖ﴾⁩ (an-Nisa 4:86), the word حُيِّيتُم (a doubled yaa with kasrah, then a madd yaa) is an example of:',
   '["A. madd al-tamkeen","B. madd al-iwad","C. madd al-silah","D. madd laazim"]'::jsonb, 'A',
   'حُيِّيتُم has a mushaddad yaa (with kasrah) meeting a sakin madd yaa — the madd is firmly "established": madd al-tamkeen, 2 harakat.', 'hard', 'tamkeen');

END $$;
