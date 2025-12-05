-- =============================================
-- Sync student.status with enrollment.status
-- =============================================
-- This trigger keeps the student's overall status in sync with their enrollments
-- Logic:
--   - If ANY enrollment is 'active' → student.status = 'enrolled'
--   - If ALL enrollments are 'withdrawn' → student.status = 'dropout'
--   - If ALL enrollments are 'completed' → student.status = 'graduated'
--   - If no enrollments exist → student.status = 'pending_payment'

CREATE OR REPLACE FUNCTION sync_student_status()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_active_count INTEGER;
  v_completed_count INTEGER;
  v_withdrawn_count INTEGER;
  v_total_count INTEGER;
  v_new_status TEXT;
BEGIN
  -- Get the student_id from the enrollment
  IF TG_OP = 'DELETE' THEN
    v_student_id := OLD.student_id;
  ELSE
    v_student_id := NEW.student_id;
  END IF;

  -- Count enrollments by status
  SELECT
    COUNT(*) FILTER (WHERE status = 'active') as active,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'withdrawn') as withdrawn,
    COUNT(*) as total
  INTO v_active_count, v_completed_count, v_withdrawn_count, v_total_count
  FROM enrollments
  WHERE student_id = v_student_id;

  -- Determine new student status based on enrollment statuses
  IF v_total_count = 0 THEN
    -- No enrollments → pending_payment
    v_new_status := 'pending_payment';
  ELSIF v_active_count > 0 THEN
    -- At least one active enrollment → enrolled
    v_new_status := 'enrolled';
  ELSIF v_completed_count = v_total_count THEN
    -- All enrollments completed → graduated
    v_new_status := 'graduated';
  ELSIF v_withdrawn_count = v_total_count THEN
    -- All enrollments withdrawn → dropout
    v_new_status := 'dropout';
  ELSE
    -- Mixed states (some completed, some withdrawn, no active) → graduated
    -- Reasoning: They've completed at least one program
    v_new_status := 'graduated';
  END IF;

  -- Update student status
  UPDATE students
  SET
    status = v_new_status,
    updated_at = NOW()
  WHERE id = v_student_id;

  RAISE NOTICE 'Student % status updated to: %', v_student_id, v_new_status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync student status after enrollment changes
DROP TRIGGER IF EXISTS sync_student_status_trigger ON enrollments;
CREATE TRIGGER sync_student_status_trigger
AFTER INSERT OR UPDATE OF status OR DELETE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION sync_student_status();

-- Sync all existing students' statuses
DO $$
DECLARE
  v_student RECORD;
  v_active_count INTEGER;
  v_completed_count INTEGER;
  v_withdrawn_count INTEGER;
  v_total_count INTEGER;
  v_new_status TEXT;
BEGIN
  FOR v_student IN SELECT id FROM students LOOP
    -- Count enrollments by status
    SELECT
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'withdrawn') as withdrawn,
      COUNT(*) as total
    INTO v_active_count, v_completed_count, v_withdrawn_count, v_total_count
    FROM enrollments
    WHERE student_id = v_student.id;

    -- Determine new student status
    IF v_total_count = 0 THEN
      v_new_status := 'pending_payment';
    ELSIF v_active_count > 0 THEN
      v_new_status := 'enrolled';
    ELSIF v_completed_count = v_total_count THEN
      v_new_status := 'graduated';
    ELSIF v_withdrawn_count = v_total_count THEN
      v_new_status := 'dropout';
    ELSE
      v_new_status := 'graduated';
    END IF;

    -- Update student status
    UPDATE students
    SET status = v_new_status
    WHERE id = v_student.id;
  END LOOP;

  RAISE NOTICE '✅ All student statuses synced with enrollments';
END $$;

COMMENT ON FUNCTION sync_student_status IS
  'Automatically syncs student.status based on their enrollment statuses';

-- Show updated student statuses
SELECT
  s.student_id,
  s.full_name,
  s.status as student_status,
  COUNT(e.id) as total_enrollments,
  COUNT(e.id) FILTER (WHERE e.status = 'active') as active_enrollments,
  COUNT(e.id) FILTER (WHERE e.status = 'withdrawn') as withdrawn_enrollments,
  COUNT(e.id) FILTER (WHERE e.status = 'completed') as completed_enrollments
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id
GROUP BY s.id, s.student_id, s.full_name, s.status
ORDER BY s.student_id;
