-- Fixes discovered when loading the Bahouth data (20260811000001):
--
-- 1. Qira'at is per-READING, not per-word: a single word can carry multiple
--    variant readings (e.g. 50:35:3 has separate Warsh and Hisham entries).
--    The word-level UNIQUE(sura,aya,word_number) is wrong. Re-key on
--    (sura,aya,word_number,content) so multiple readings per word are allowed
--    and re-runs still upsert idempotently.
--
-- 2. Compound-particle words (956 rows, e.g. وممّا -> root "مِن/ما") store the
--    per-part counts as TEXT ("مِن: 3226، ما: 2591"), not integers. The count
--    and sequence columns must be TEXT to hold these verbatim.

-- 1. Qira'at grain fix
ALTER TABLE quran_word_qiraat
  DROP CONSTRAINT IF EXISTS quran_word_qiraat_sura_number_aya_number_word_number_key;
ALTER TABLE quran_word_qiraat
  ADD CONSTRAINT quran_word_qiraat_sawc_key
  UNIQUE(sura_number, aya_number, word_number, content);

-- 2. Root stat columns -> TEXT (they carry compound-part annotations verbatim)
ALTER TABLE quran_word_root  ALTER COLUMN sequence_in_root TYPE TEXT;
ALTER TABLE quran_root_stats ALTER COLUMN occurrence_count TYPE TEXT;
ALTER TABLE quran_root_stats ALTER COLUMN surah_count      TYPE TEXT;
ALTER TABLE quran_root_stats ALTER COLUMN ayah_count       TYPE TEXT;
