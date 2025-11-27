-- =============================================
-- Add Availability Fields to Students Table
-- =============================================
-- This migration adds availability preferences from applications to students table
-- so the scheduling information is preserved after enrollment

-- Add availability columns to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS preferred_days TEXT[], -- Array of days: ['Monday', 'Tuesday', ...]
ADD COLUMN IF NOT EXISTS preferred_times TEXT[], -- Array of time slots: ['Morning', 'Afternoon', ...]
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Pacific/Auckland', -- Student timezone
ADD COLUMN IF NOT EXISTS availability_notes TEXT; -- Additional availability notes

-- Add comments for documentation
COMMENT ON COLUMN students.preferred_days IS 'Preferred days for classes from application (e.g., [Monday, Tuesday, Wednesday])';
COMMENT ON COLUMN students.preferred_times IS 'Preferred time slots from application (e.g., [Morning, Afternoon, Evening])';
COMMENT ON COLUMN students.timezone IS 'Student timezone for scheduling (copied from application)';
COMMENT ON COLUMN students.availability_notes IS 'Additional notes about availability from application';

-- Create index for faster querying by availability
CREATE INDEX IF NOT EXISTS idx_students_preferred_days ON students USING GIN(preferred_days);
CREATE INDEX IF NOT EXISTS idx_students_preferred_times ON students USING GIN(preferred_times);

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Availability fields added to students table!' as message;
