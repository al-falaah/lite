-- Add auth_user_id column to students table for Supabase Auth integration
ALTER TABLE students
ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- Add auth_user_id column to teachers table for Supabase Auth integration
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- Add foreign key constraint to reference auth.users (optional, for data integrity)
-- Note: This assumes auth.users table exists and is accessible
ALTER TABLE students
ADD CONSTRAINT students_auth_user_id_fkey
FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE teachers
ADD CONSTRAINT teachers_auth_user_id_fkey
FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_auth_user_id ON teachers(auth_user_id);

-- Add comments
COMMENT ON COLUMN students.auth_user_id IS 'Foreign key to auth.users - Supabase Auth user ID';
COMMENT ON COLUMN teachers.auth_user_id IS 'Foreign key to auth.users - Supabase Auth user ID';

-- Drop password columns as they are now managed by Supabase Auth
-- Keep them for now during migration, will drop later after confirming everything works
-- ALTER TABLE students DROP COLUMN IF EXISTS password;
-- ALTER TABLE teachers DROP COLUMN IF EXISTS password;
