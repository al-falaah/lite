-- ===================================================================
-- COMPLETE FIX: Remove ALL RLS policies and disable RLS
-- ===================================================================
-- This fixes blog post publishing and schedule generation timeouts
-- ===================================================================

-- Step 1: Drop ALL policies on blog_posts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'blog_posts'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON blog_posts';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 2: Disable RLS on blog_posts
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL policies on class_schedules
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'class_schedules'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON class_schedules';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 4: Disable RLS on class_schedules
ALTER TABLE class_schedules DISABLE ROW LEVEL SECURITY;

-- Step 5: Verify both tables have RLS disabled and no policies
SELECT
    tablename,
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename AND schemaname = 'public') as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('blog_posts', 'class_schedules')
ORDER BY tablename;

-- Expected result:
-- tablename        | rowsecurity | policy_count
-- -----------------|-------------|-------------
-- blog_posts       | f           | 0
-- class_schedules  | f           | 0
