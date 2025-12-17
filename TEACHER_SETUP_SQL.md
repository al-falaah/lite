# Teacher Management System - Database Setup

## Execute this SQL in your Supabase SQL Editor

Go to your Supabase Dashboard → SQL Editor → New Query, then copy and paste this entire script:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR(5) UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  country_of_residence TEXT NOT NULL,
  password TEXT NOT NULL,
  first_login BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for teachers
CREATE INDEX IF NOT EXISTS idx_teachers_staff_id ON teachers(staff_id);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_is_active ON teachers(is_active);

-- Create teacher_student_assignments table
CREATE TABLE IF NOT EXISTS teacher_student_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  program TEXT CHECK (program IN ('essentials', 'tajweed')),
  status TEXT NOT NULL CHECK (status IN ('assigned', 'removed')) DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for assignments
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_student_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_student ON teacher_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_status ON teacher_student_assignments(status);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_program ON teacher_student_assignments(program);

-- Unique constraint: one teacher can only have one active assignment per student per program
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_student_program_active
  ON teacher_student_assignments(teacher_id, student_id, program)
  WHERE status = 'assigned';

-- Enable RLS on teachers table
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teachers
-- Allow public SELECT for teacher login (staff_id lookup)
CREATE POLICY "Anyone can view teachers for login"
  ON teachers FOR SELECT
  TO public
  USING (true);

-- Allow public UPDATE for teachers to change their own password
CREATE POLICY "Anyone can update teachers"
  ON teachers FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can insert/delete (admin only)
CREATE POLICY "Authenticated users can insert teachers"
  ON teachers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete teachers"
  ON teachers FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on teacher_student_assignments
ALTER TABLE teacher_student_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments
-- Allow public SELECT for teacher portal (to view assigned students)
CREATE POLICY "Anyone can view assignments"
  ON teacher_student_assignments FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can modify (admin only)
CREATE POLICY "Authenticated users can insert assignments"
  ON teacher_student_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update assignments"
  ON teacher_student_assignments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete assignments"
  ON teacher_student_assignments FOR DELETE
  TO authenticated
  USING (true);

-- Triggers
CREATE OR REPLACE FUNCTION update_teachers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teachers_updated_at_trigger
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_teachers_updated_at();

CREATE OR REPLACE FUNCTION update_teacher_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teacher_assignments_updated_at_trigger
  BEFORE UPDATE ON teacher_student_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_assignments_updated_at();

-- Auto-set removed_at when status changes to 'removed'
CREATE OR REPLACE FUNCTION set_removed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'removed' AND OLD.status != 'removed' THEN
    NEW.removed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teacher_assignments_set_removed_at_trigger
  BEFORE UPDATE ON teacher_student_assignments
  FOR EACH ROW
  EXECUTE FUNCTION set_removed_at();
```

## After Running the SQL

Once you've executed this SQL successfully in your Supabase dashboard, the teacher tables will be created and ready to use!

The frontend code will handle:
- Auto-generating 5-digit staff IDs
- Auto-generating random alphanumeric passwords
- Sending welcome emails to teachers with credentials
- All CRUD operations through the admin dashboard
- Program-aware teacher-student assignments