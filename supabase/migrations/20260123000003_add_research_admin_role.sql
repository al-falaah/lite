-- Add research_admin role to profiles table

-- First, ensure no profiles have NULL or invalid roles
UPDATE profiles 
SET role = 'madrasah_admin' 
WHERE role IS NULL OR role NOT IN ('director', 'madrasah_admin', 'store_admin', 'blog_admin');

-- Drop the existing constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with research_admin included
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('director', 'madrasah_admin', 'store_admin', 'blog_admin', 'research_admin'));

-- Update the comment to include the new role
COMMENT ON COLUMN profiles.role IS
'User role for access control:
- director: Full access to everything (founder)
- madrasah_admin: Access to student/teacher/application management
- store_admin: Access only to store management
- blog_admin: Access only to blog management
- research_admin: Access to lesson notes and research materials management';
