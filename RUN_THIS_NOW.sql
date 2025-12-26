-- ===================================================================
-- IMMEDIATE FIX: Disable RLS on applications table
-- ===================================================================
-- Copy and paste this entire block into Supabase Dashboard > SQL Editor
-- Then click "Run" or press Cmd+Enter
-- ===================================================================

ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Verify it worked (should show rowsecurity = f)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'applications';
