-- Remove password columns from students and teachers tables
-- Passwords are now managed by Supabase Auth, not stored in our tables

-- Make password column nullable first (for backwards compatibility during transition)
ALTER TABLE students ALTER COLUMN password DROP NOT NULL;
ALTER TABLE teachers ALTER COLUMN password DROP NOT NULL;

-- Optional: Drop the columns entirely (commented out for safety)
-- ALTER TABLE students DROP COLUMN IF EXISTS password;
-- ALTER TABLE teachers DROP COLUMN IF EXISTS password;

-- Also remove first_login columns as they're now in user_metadata
-- ALTER TABLE students DROP COLUMN IF EXISTS first_login;
-- ALTER TABLE teachers DROP COLUMN IF EXISTS first_login;

COMMENT ON TABLE students IS 'Student records - passwords managed by Supabase Auth';
COMMENT ON TABLE teachers IS 'Teacher (Staff) records - passwords managed by Supabase Auth';
