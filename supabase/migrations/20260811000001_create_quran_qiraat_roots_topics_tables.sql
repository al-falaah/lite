-- Bahouth extension: qira'at (variant readings), root words, and thematic
-- topics — sourced from the Tafsir Center for Quranic Studies (tafsir.net).
-- Qira'at and roots come from the same Markaz quran.db (CC BY 4.0) as the
-- 20260808000001 tables; topics are harvested from the Bahouth MCP
-- (bahouth.tafsir.net/mcp). Attribution to "Tafsir Center for Quranic
-- Studies (tafsir.net)" is mandatory on any surface that displays this
-- text; text is shown verbatim.
--
-- Additive: these sit ALONGSIDE quran_tajweed_aya and the Markaz tables,
-- joined on (sura_number, aya_number). Roots use the Markaz word_statistics
-- normalization (e.g. بسم -> root سمي), NOT the QAC root_index.json used by
-- the existing RootExplorer.

-- Qira'at commentary (variant readings) per word. From qeraat_info; the word
-- text is filled by joining word_content_rasm on (sura, aya, word_number).
-- A word can carry MULTIPLE readings (e.g. 50:35:3 has separate Warsh and
-- Hisham entries), so the grain is per-reading: UNIQUE on (…word_number, content).
CREATE TABLE IF NOT EXISTS quran_word_qiraat (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  aya_number INTEGER NOT NULL,
  word_number INTEGER NOT NULL,
  word TEXT NOT NULL,
  content TEXT NOT NULL,
  note TEXT,
  UNIQUE(sura_number, aya_number, word_number, content)
);

-- Word -> root mapping (77432 words). Enables root -> verses lookup.
-- sequence_in_root is TEXT: compound-particle words (e.g. وممّا -> "مِن/ما")
-- store per-part sequences as text ("مِن: 1، ما: 1"), not integers.
CREATE TABLE IF NOT EXISTS quran_word_root (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  aya_number INTEGER NOT NULL,
  word_number INTEGER NOT NULL,
  word TEXT NOT NULL,
  root TEXT NOT NULL,
  sequence_in_root TEXT,
  UNIQUE(sura_number, aya_number, word_number)
);

-- Root dictionary / occurrence stats (~1891 distinct roots). Count columns are
-- TEXT: compound-particle roots carry per-part counts ("مِن: 3226، ما: 2591").
CREATE TABLE IF NOT EXISTS quran_root_stats (
  id BIGSERIAL PRIMARY KEY,
  root TEXT NOT NULL,
  occurrence_count TEXT NOT NULL,
  surah_count TEXT,
  ayah_count TEXT,
  UNIQUE(root)
);

-- Verse <-> topic mapping (many-to-many). title = the raw colon-delimited
-- hierarchy path (category:subcategory:topic), stored verbatim.
CREATE TABLE IF NOT EXISTS quran_ayah_topic (
  id BIGSERIAL PRIMARY KEY,
  sura_number INTEGER NOT NULL,
  aya_number INTEGER NOT NULL,
  topic_id INTEGER NOT NULL,
  category_id INTEGER,
  subcategory_id INTEGER,
  title TEXT NOT NULL,
  UNIQUE(sura_number, aya_number, topic_id)
);

-- Lookup indexes (btree on the (sura, aya) key per table)
CREATE INDEX IF NOT EXISTS idx_qiraat_sa ON quran_word_qiraat(sura_number, aya_number);
CREATE INDEX IF NOT EXISTS idx_word_root_sa ON quran_word_root(sura_number, aya_number);
CREATE INDEX IF NOT EXISTS idx_ayah_topic_sa ON quran_ayah_topic(sura_number, aya_number);

-- Reverse-lookup indexes: root -> verses, topic -> verses (the composite
-- (sura, aya) index does not serve these).
CREATE INDEX IF NOT EXISTS idx_word_root_root ON quran_word_root(root);
CREATE INDEX IF NOT EXISTS idx_root_stats_root ON quran_root_stats(root);
CREATE INDEX IF NOT EXISTS idx_ayah_topic_tid ON quran_ayah_topic(topic_id);

-- Trigram indexes for text search on the Arabic text columns
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_qiraat_content_trgm ON quran_word_qiraat USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_word_root_word_trgm ON quran_word_root USING gin(word gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_root_stats_root_trgm ON quran_root_stats USING gin(root gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ayah_topic_title_trgm ON quran_ayah_topic USING gin(title gin_trgm_ops);

-- RLS: public read (these back public learning tools), service-role write
ALTER TABLE quran_word_qiraat ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_word_root ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_root_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_ayah_topic ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON quran_word_qiraat FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_word_root FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_root_stats FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_ayah_topic FOR SELECT USING (true);

CREATE POLICY "Service role write" ON quran_word_qiraat FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_word_root FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_root_stats FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON quran_ayah_topic FOR ALL USING (auth.role() = 'service_role');
