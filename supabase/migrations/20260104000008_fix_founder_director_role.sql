-- Force update the founder to director role
-- The previous migration failed because of existing 'postgres' role value

-- First, temporarily drop the check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Update the founder's profile
UPDATE profiles
SET
  role = 'director',
  is_admin = true
WHERE email = 'abdulquadrialaka@gmail.com';

-- Re-add the check constraint with correct values
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('director', 'teacher', 'student', 'madrasah_admin', 'blog_admin', 'store_admin'));

-- Clean up any other invalid role values (set them to NULL)
UPDATE profiles
SET role = NULL
WHERE role NOT IN ('director', 'teacher', 'student', 'madrasah_admin', 'blog_admin', 'store_admin')
  AND email != 'abdulquadrialaka@gmail.com';

-- Verify the founder is now director
DO $$
DECLARE
  current_role TEXT;
  is_admin_flag BOOLEAN;
BEGIN
  SELECT role, is_admin INTO current_role, is_admin_flag
  FROM profiles
  WHERE email = 'abdulquadrialaka@gmail.com';

  IF current_role = 'director' AND is_admin_flag = true THEN
    RAISE NOTICE 'SUCCESS: abdulquadrialaka@gmail.com is now director with admin access';
  ELSE
    RAISE WARNING 'Current state - Role: %, is_admin: %', current_role, is_admin_flag;
  END IF;
END $$;
