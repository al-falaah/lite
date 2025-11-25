-- Add 'pending_payment' status to students table
-- Students with this status have been approved but haven't paid yet

ALTER TABLE students DROP CONSTRAINT IF EXISTS students_status_check;

ALTER TABLE students
  ADD CONSTRAINT students_status_check
  CHECK (status IN ('pending_payment', 'enrolled', 'graduated', 'dropout'));

-- Update default to pending_payment (will be changed to enrolled after payment)
ALTER TABLE students ALTER COLUMN status SET DEFAULT 'pending_payment';

COMMENT ON COLUMN students.status IS 'Student enrollment status:
  - pending_payment: Approved but awaiting first payment
  - enrolled: Active student (payment verified)
  - graduated: Completed program
  - dropout: Left program';
