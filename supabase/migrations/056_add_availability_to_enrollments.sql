-- =============================================
-- Add Availability Fields to Enrollments
-- =============================================
-- This migration adds program-specific availability preferences to enrollments
-- so each program enrollment can have its own schedule preferences

-- Add availability columns to enrollments table
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS preferred_days TEXT[], -- Array of days: ['monday', 'tuesday', ...]
ADD COLUMN IF NOT EXISTS preferred_times TEXT[], -- Array of time slots: ['morning', 'afternoon', ...]
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Pacific/Auckland', -- New Zealand timezone
ADD COLUMN IF NOT EXISTS availability_notes TEXT; -- Additional availability notes from student

-- Add comments for documentation
COMMENT ON COLUMN enrollments.preferred_days IS 'Array of preferred days for classes (e.g., [monday, tuesday, wednesday])';
COMMENT ON COLUMN enrollments.preferred_times IS 'Array of preferred time slots (e.g., [morning, afternoon, evening])';
COMMENT ON COLUMN enrollments.timezone IS 'Student timezone for scheduling (default: Pacific/Auckland for NZ)';
COMMENT ON COLUMN enrollments.availability_notes IS 'Additional notes about student availability or scheduling preferences';

-- Create indexes for faster querying by availability
CREATE INDEX IF NOT EXISTS idx_enrollments_preferred_days ON enrollments USING GIN(preferred_days);
CREATE INDEX IF NOT EXISTS idx_enrollments_preferred_times ON enrollments USING GIN(preferred_times);

-- =============================================
-- Backfill availability from applications
-- =============================================
-- Copy availability data from applications to enrollments where available
UPDATE enrollments e
SET
  preferred_days = a.preferred_days,
  preferred_times = a.preferred_times,
  timezone = COALESCE(a.timezone, 'Pacific/Auckland'),
  availability_notes = a.availability_notes
FROM applications a
WHERE e.application_id = a.id
  AND e.preferred_days IS NULL
  AND a.preferred_days IS NOT NULL;

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Availability fields added to enrollments table!' as message;
