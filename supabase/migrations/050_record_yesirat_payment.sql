-- =============================================
-- Record Yesirat's $25 Payment
-- =============================================
-- Yesirat paid $25 through Stripe but webhook wasn't configured yet

DO $$
DECLARE
  v_student_id UUID;
  v_enrollment_id UUID;
  v_payment_id UUID;
BEGIN
  -- Get Yesirat's student ID
  SELECT id INTO v_student_id
  FROM students
  WHERE student_id = '621370';

  IF v_student_id IS NULL THEN
    RAISE NOTICE '❌ Student 621370 not found';
    RETURN;
  END IF;

  -- Get her enrollment
  SELECT id INTO v_enrollment_id
  FROM enrollments
  WHERE student_id = v_student_id
  AND program = 'essentials'
  LIMIT 1;

  IF v_enrollment_id IS NULL THEN
    RAISE NOTICE '❌ Enrollment not found for student 621370';
    RETURN;
  END IF;

  -- Check if payment already exists
  SELECT id INTO v_payment_id
  FROM payments
  WHERE student_id = v_student_id
  AND enrollment_id = v_enrollment_id
  AND amount = 25.00
  AND status = 'verified';

  IF v_payment_id IS NOT NULL THEN
    RAISE NOTICE '✅ Payment already recorded (ID: %)', v_payment_id;
    RETURN;
  END IF;

  -- Record the $25 payment
  INSERT INTO payments (
    student_id,
    enrollment_id,
    amount,
    payment_method,
    status,
    academic_year,
    stripe_payment_id,
    verified_at,
    created_at,
    updated_at
  ) VALUES (
    v_student_id,
    v_enrollment_id,
    25.00,
    'stripe',
    'verified',
    1,
    'manual_entry_yesirat_first_payment',
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_payment_id;

  RAISE NOTICE '✅ Payment recorded! Payment ID: %', v_payment_id;
  RAISE NOTICE 'The database trigger will automatically update total_paid and balance_remaining';

END $$;

-- Display Yesirat's updated status
SELECT
  s.student_id,
  s.full_name,
  e.program,
  e.status,
  e.total_fees,
  e.total_paid,
  e.balance_remaining,
  (SELECT COUNT(*) FROM payments p WHERE p.enrollment_id = e.id AND p.status = 'verified') as verified_payments
FROM students s
JOIN enrollments e ON e.student_id = s.id
WHERE s.student_id = '621370';
