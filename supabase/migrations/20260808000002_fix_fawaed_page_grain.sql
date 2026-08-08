-- quran_page_fawaed: page is NOT unique — the Mukhtasar has multiple fawa'id
-- entries per mushaf page (2212 entries across 604 pages). Drop the UNIQUE(page)
-- constraint so all entries load; keep an index on page for lookups.
ALTER TABLE quran_page_fawaed DROP CONSTRAINT IF EXISTS quran_page_fawaed_page_key;
CREATE INDEX IF NOT EXISTS idx_markaz_fawaed_page ON quran_page_fawaed(page);
