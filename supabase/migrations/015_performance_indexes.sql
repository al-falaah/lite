-- =============================================
-- Performance Optimization - Add Indexes
-- =============================================
-- Add indexes on frequently queried columns for better performance

-- Applications table indexes
CREATE INDEX IF NOT EXISTS idx_applications_status
  ON applications(status);

CREATE INDEX IF NOT EXISTS idx_applications_email
  ON applications(email);

CREATE INDEX IF NOT EXISTS idx_applications_created_at
  ON applications(created_at DESC);

-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_email
  ON students(email);

CREATE INDEX IF NOT EXISTS idx_students_student_id
  ON students(student_id);

CREATE INDEX IF NOT EXISTS idx_students_status
  ON students(status);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_student_id
  ON payments(student_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
  ON payments(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_applications_status_created
  ON applications(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_student_status
  ON payments(student_id, status);

-- =============================================
-- Analyze tables for query optimization
-- =============================================
ANALYZE applications;
ANALYZE students;
ANALYZE payments;

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Performance indexes created!' as message;
