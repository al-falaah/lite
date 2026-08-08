-- Markaz Tafsir integration: tafsir, word-grammar, asbab al-nuzul, and the
-- imla'i verification spine — sourced from the Tafsir Center for Quranic
-- Studies (tafsir.net) quran.db, CC BY 4.0. Attribution to
-- "Tafsir Center for Quranic Studies (tafsir.net)" is mandatory on any
-- surface that displays this text; text is shown verbatim.
--
-- Additive: these tables sit ALONGSIDE quran_tajweed_aya (the vowelled
-- Uthmani + tajweed authority), joined on (sura_number, aya_number).
-- Markaz uses standard Hafs/Kufan numbering (6236 ayat).

-- Imla'i (undiacritized) ayah text — the verification spine. Reconstructed
-- by joining word_content_rasm.word in wordNo order.
CREATE TABLE IF NOT EXISTS quran_ayah_ref (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  aya_number INTEGER NOT NULL,
  ayah_imlai TEXT NOT NULL,
  UNIQUE(sura_number, aya_number)
);

-- Trilingual Mukhtasar tafsir (Arabic / English / Bengali)
CREATE TABLE IF NOT EXISTS quran_tafsir_mukhtasar (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  aya_number INTEGER NOT NULL,
  ar TEXT,
  en TEXT,
  bn TEXT,
  UNIQUE(sura_number, aya_number)
);

-- Classical tafsir sources (tabary, katheer, baghawy, saadi, moyassar),
-- one row per (ayah, source).
CREATE TABLE IF NOT EXISTS quran_tafsir_classical (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  aya_number INTEGER NOT NULL,
  source TEXT NOT NULL,   -- 'tabary' | 'katheer' | 'baghawy' | 'saadi' | 'moyassar'
  tafsir TEXT NOT NULL,
  UNIQUE(sura_number, aya_number, source)
);

-- I'rab (grammatical parsing) per ayah
CREATE TABLE IF NOT EXISTS quran_ayah_irab (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  aya_number INTEGER NOT NULL,
  irab TEXT NOT NULL,
  UNIQUE(sura_number, aya_number)
);

-- Asbab al-nuzul (reasons for revelation) — only ~201 ayat have this
CREATE TABLE IF NOT EXISTS quran_ayah_nozool (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  aya_number INTEGER NOT NULL,
  nozool TEXT NOT NULL,
  UNIQUE(sura_number, aya_number)
);

-- Word-level grammar: irab + sarf + meaning joined per word (77432 rows)
CREATE TABLE IF NOT EXISTS quran_word_grammar (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  aya_number INTEGER NOT NULL,
  word_number INTEGER NOT NULL,
  word TEXT NOT NULL,
  irab TEXT,
  sarf TEXT,
  meaning TEXT,
  UNIQUE(sura_number, aya_number, word_number)
);

-- Per-page fawa'id from the Mukhtasar (2212 entries across 604 pages —
-- multiple fawa'id per page, so page is NOT unique). See migration
-- 20260808000002 which drops the UNIQUE(page) this shipped with.
CREATE TABLE IF NOT EXISTS quran_page_fawaed (
  id BIGSERIAL PRIMARY KEY,
  page INTEGER NOT NULL,
  fawaed TEXT NOT NULL
);

-- Lookup indexes
CREATE INDEX IF NOT EXISTS idx_markaz_ayah_ref_sa ON quran_ayah_ref(sura_number, aya_number);
CREATE INDEX IF NOT EXISTS idx_markaz_mukhtasar_sa ON quran_tafsir_mukhtasar(sura_number, aya_number);
CREATE INDEX IF NOT EXISTS idx_markaz_classical_sa ON quran_tafsir_classical(sura_number, aya_number);
CREATE INDEX IF NOT EXISTS idx_markaz_irab_sa ON quran_ayah_irab(sura_number, aya_number);
CREATE INDEX IF NOT EXISTS idx_markaz_nozool_sa ON quran_ayah_nozool(sura_number, aya_number);
CREATE INDEX IF NOT EXISTS idx_markaz_word_grammar_sa ON quran_word_grammar(sura_number, aya_number);

-- Trigram index for text search / paste-verify on the imla'i spine
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_markaz_ayah_ref_imlai_trgm ON quran_ayah_ref USING gin(ayah_imlai gin_trgm_ops);

-- RLS: public read (these back public learning tools), service-role write
ALTER TABLE quran_ayah_ref ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_tafsir_mukhtasar ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_tafsir_classical ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_ayah_irab ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_ayah_nozool ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_word_grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_page_fawaed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON quran_ayah_ref FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_tafsir_mukhtasar FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_tafsir_classical FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_ayah_irab FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_ayah_nozool FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_word_grammar FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_page_fawaed FOR SELECT USING (true);

CREATE POLICY "Service role write" ON quran_ayah_ref FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_tafsir_mukhtasar FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_tafsir_classical FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_ayah_irab FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_ayah_nozool FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_word_grammar FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_page_fawaed FOR ALL USING (auth.role() = 'service_role');
