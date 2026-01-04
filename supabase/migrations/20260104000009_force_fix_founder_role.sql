-- Force fix founder role by disabling RLS temporarily
-- This migration uses a security definer function to bypass RLS

-- Create a function that runs with owner privileges
CREATE OR REPLACE FUNCTION fix_founder_role()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Temporarily disable RLS for this operation
  ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

  -- Drop the constraint
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

  -- Force update the founder's role
  UPDATE profiles
  SET
    role = 'director',
    is_admin = true
  WHERE email = 'abdulquadrialaka@gmail.com';

  -- Re-add the constraint
  ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('director', 'teacher', 'student', 'madrasah_admin', 'blog_admin', 'store_admin'));

  -- Clean up any other invalid roles
  UPDATE profiles
  SET role = NULL
  WHERE role NOT IN ('director', 'teacher', 'student', 'madrasah_admin', 'blog_admin', 'store_admin')
    AND email != 'abdulquadrialaka@gmail.com';

  -- Re-enable RLS
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  RAISE NOTICE 'Founder role fixed successfully';
END;
$$;

-- Execute the function
SELECT fix_founder_role();

-- Drop the function (cleanup)
DROP FUNCTION fix_founder_role();

-- Verify the change
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
    RAISE WARNING 'FAILED: Role is %, is_admin is %', current_role, is_admin_flag;
  END IF;
END $$;
