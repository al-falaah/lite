-- =============================================
-- Add Availability Fields to Applications
-- =============================================
-- This migration adds student availability preferences to the applications table
-- so admin can schedule classes based on student preferred times

-- Add availability columns to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS preferred_days TEXT[], -- Array of days: ['monday', 'tuesday', ...]
ADD COLUMN IF NOT EXISTS preferred_times TEXT[], -- Array of time slots: ['morning', 'afternoon', ...]
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Pacific/Auckland', -- New Zealand timezone
ADD COLUMN IF NOT EXISTS availability_notes TEXT; -- Additional availability notes from student

-- Add comments for documentation
COMMENT ON COLUMN applications.preferred_days IS 'Array of preferred days for classes (e.g., [monday, tuesday, wednesday])';
COMMENT ON COLUMN applications.preferred_times IS 'Array of preferred time slots (e.g., [morning, afternoon, evening])';
COMMENT ON COLUMN applications.timezone IS 'Student timezone for scheduling (default: Pacific/Auckland for NZ)';
COMMENT ON COLUMN applications.availability_notes IS 'Additional notes about student availability or scheduling preferences';

-- Create index for faster querying by availability
CREATE INDEX IF NOT EXISTS idx_applications_preferred_days ON applications USING GIN(preferred_days);
CREATE INDEX IF NOT EXISTS idx_applications_preferred_times ON applications USING GIN(preferred_times);

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Availability fields added to applications table!' as message;
