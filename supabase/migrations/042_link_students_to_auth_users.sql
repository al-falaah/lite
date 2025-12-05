-- =============================================
-- Link students to auth users by email
-- =============================================
-- Many students have null user_id but auth accounts exist
-- This migration links them by matching email addresses

-- Update students to link them with their auth users
UPDATE students s
SET user_id = p.id,
    updated_at = NOW()
FROM profiles p
WHERE s.email = p.email
AND s.user_id IS NULL
AND p.id IS NOT NULL;

-- Report results
DO $$
DECLARE
  v_linked INTEGER;
  v_orphans INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_linked
  FROM students
  WHERE user_id IS NOT NULL;

  SELECT COUNT(*) INTO v_orphans
  FROM students
  WHERE user_id IS NULL;

  RAISE NOTICE '==============================';
  RAISE NOTICE 'Students linked to auth: %', v_linked;
  RAISE NOTICE 'Students still orphaned: %', v_orphans;
  RAISE NOTICE '==============================';
END $$;

-- Verify Yesirat specifically
SELECT
  s.student_id,
  s.full_name,
  s.email,
  s.user_id,
  CASE
    WHEN s.user_id IS NOT NULL THEN '✅ Linked'
    ELSE '❌ Not linked'
  END as status
FROM students s
WHERE s.student_id = '621370';
