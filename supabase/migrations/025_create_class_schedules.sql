-- =============================================
-- Create Class Schedules Table
-- =============================================
-- Track student class schedules and progress

CREATE TABLE IF NOT EXISTS class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Class details
  academic_year INTEGER NOT NULL CHECK (academic_year IN (1, 2)),
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 52),
  class_type TEXT NOT NULL CHECK (class_type IN ('main', 'short')), -- 'main' = 2hr, 'short' = 30min

  -- Schedule
  day_of_week TEXT CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  class_time TIME,
  meeting_link TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  completed_at TIMESTAMP,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure only one class per student per week per type
  UNIQUE(student_id, academic_year, week_number, class_type)
);

-- Create indexes for faster queries
CREATE INDEX idx_schedules_student ON class_schedules(student_id);
CREATE INDEX idx_schedules_status ON class_schedules(status);
CREATE INDEX idx_schedules_week ON class_schedules(academic_year, week_number);
CREATE INDEX idx_schedules_upcoming ON class_schedules(day_of_week, class_time) WHERE status = 'scheduled';

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_class_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER class_schedules_updated_at
  BEFORE UPDATE ON class_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_class_schedule_updated_at();

-- Create view for student progress
CREATE OR REPLACE VIEW student_class_progress AS
SELECT
  s.id as student_id,
  s.student_id as student_number,
  s.full_name,
  s.enrolled_date,

  -- Year 1 progress
  COUNT(CASE WHEN cs.academic_year = 1 AND cs.status = 'completed' THEN 1 END) as year1_completed,
  52 * 2 as year1_total, -- 52 weeks × 2 classes
  ROUND((COUNT(CASE WHEN cs.academic_year = 1 AND cs.status = 'completed' THEN 1 END)::NUMERIC / (52 * 2)) * 100, 1) as year1_progress_pct,

  -- Year 2 progress
  COUNT(CASE WHEN cs.academic_year = 2 AND cs.status = 'completed' THEN 1 END) as year2_completed,
  52 * 2 as year2_total,
  ROUND((COUNT(CASE WHEN cs.academic_year = 2 AND cs.status = 'completed' THEN 1 END)::NUMERIC / (52 * 2)) * 100, 1) as year2_progress_pct,

  -- Overall progress
  COUNT(CASE WHEN cs.status = 'completed' THEN 1 END) as total_completed,
  104 * 2 as total_classes, -- 104 weeks × 2 classes
  ROUND((COUNT(CASE WHEN cs.status = 'completed' THEN 1 END)::NUMERIC / (104 * 2)) * 100, 1) as overall_progress_pct,

  -- Current week info
  MAX(CASE WHEN cs.status = 'completed' THEN cs.week_number END) as current_week,
  MAX(CASE WHEN cs.status = 'completed' THEN cs.academic_year END) as current_year

FROM students s
LEFT JOIN class_schedules cs ON s.id = cs.student_id
WHERE s.status = 'enrolled'
GROUP BY s.id, s.student_id, s.full_name, s.enrolled_date;

-- Disable RLS for admin access
ALTER TABLE class_schedules DISABLE ROW LEVEL SECURITY;

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Class schedules table created with progress tracking!' as message;
