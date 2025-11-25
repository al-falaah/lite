-- Find pending_payment students (who likely paid but webhook didn't fire)
SELECT id, full_name, email, status, created_at 
FROM students 
WHERE status = 'pending_payment'
ORDER BY created_at DESC;

-- To manually enroll a student, uncomment and run this:
-- (Replace the email with actual student email)
/*
DO $$
DECLARE
  v_student_id TEXT;
  v_random_num INTEGER;
  v_student_record RECORD;
BEGIN
  -- Generate random 6-digit student ID
  v_random_num := 100000 + floor(random() * 900000)::INTEGER;
  v_student_id := 'STU-' || v_random_num;
  
  -- Get student details
  SELECT * INTO v_student_record 
  FROM students 
  WHERE email = 'STUDENT_EMAIL_HERE' AND status = 'pending_payment';
  
  IF FOUND THEN
    -- Update student
    UPDATE students 
    SET student_id = v_student_id,
        status = 'enrolled'
    WHERE id = v_student_record.id;
    
    RAISE NOTICE 'Student enrolled with ID: %', v_student_id;
    RAISE NOTICE 'Student UUID: %', v_student_record.id;
    RAISE NOTICE 'Student Name: %', v_student_record.full_name;
    RAISE NOTICE 'Student Email: %', v_student_record.email;
  ELSE
    RAISE NOTICE 'Student not found or already enrolled';
  END IF;
END $$;
*/
