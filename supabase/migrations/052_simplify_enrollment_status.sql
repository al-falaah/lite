-- =============================================
-- Simplify Enrollment Status
-- =============================================
-- Remove 'completed' from enrollments.status
-- Admin marks students as 'graduated' in students.status instead
-- Enrollments are either 'active' or 'withdrawn'

-- Update the constraint to only allow 'active' and 'withdrawn'
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_status_check
  CHECK (status IN ('active', 'withdrawn'));

-- Update the status sync function to reflect new logic
CREATE OR REPLACE FUNCTION sync_student_status()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_active_count INTEGER;
  v_withdrawn_count INTEGER;
  v_total_count INTEGER;
  v_new_status TEXT;
  v_current_status TEXT;
BEGIN
  -- Get the student_id from the enrollment
  IF TG_OP = 'DELETE' THEN
    v_student_id := OLD.student_id;
  ELSE
    v_student_id := NEW.student_id;
  END IF;

  -- Get current student status
  SELECT status INTO v_current_status
  FROM students
  WHERE id = v_student_id;

  -- Don't override manually set 'graduated' status
  -- Admin manually sets graduated, we shouldn't change it
  IF v_current_status = 'graduated' THEN
    RAISE NOTICE 'Student % is marked as graduated by admin, skipping auto-sync', v_student_id;
    RETURN NEW;
  END IF;

  -- Count enrollments by status
  SELECT
    COUNT(*) FILTER (WHERE status = 'active') as active,
    COUNT(*) FILTER (WHERE status = 'withdrawn') as withdrawn,
    COUNT(*) as total
  INTO v_active_count, v_withdrawn_count, v_total_count
  FROM enrollments
  WHERE student_id = v_student_id;

  -- Determine new student status based on enrollment statuses
  IF v_total_count = 0 THEN
    -- No enrollments → pending_payment
    v_new_status := 'pending_payment';
  ELSIF v_active_count > 0 THEN
    -- At least one active enrollment → enrolled
    v_new_status := 'enrolled';
  ELSIF v_withdrawn_count = v_total_count THEN
    -- All enrollments withdrawn → dropout
    v_new_status := 'dropout';
  ELSE
    -- Shouldn't happen with only 'active' and 'withdrawn', but fallback
    v_new_status := 'enrolled';
  END IF;

  -- Update student status (only if not manually set to graduated)
  UPDATE students
  SET
    status = v_new_status,
    updated_at = NOW()
  WHERE id = v_student_id
  AND status != 'graduated'; -- Don't override graduated status

  RAISE NOTICE 'Student % status updated to: %', v_student_id, v_new_status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN enrollments.status IS
  'Enrollment status: active (currently enrolled) or withdrawn (dropped out). Admin marks students as graduated in students.status.';

-- Show current enrollment statuses
SELECT
  s.student_id,
  s.full_name,
  s.status as student_status,
  e.program,
  e.status as enrollment_status
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id
WHERE e.id IS NOT NULL
ORDER BY s.student_id;

SELECT '✅ Enrollment status simplified to: active or withdrawn only' as message;
SELECT '✅ Admin manually sets students.status = graduated in admin dashboard' as message;
