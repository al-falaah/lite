-- Update role field to include ALL user types, not just admin types
-- New comprehensive role system:
-- - director: Full access (founder)
-- - teacher: Teacher portal access
-- - student: Student portal access
-- - madrasah_admin: Madrasah management (students/teachers/applications)
-- - blog_admin: Blog management only
-- - store_admin: Store management only

-- First, drop the old constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Update the role column to allow all user types
ALTER TABLE profiles
ALTER COLUMN role DROP DEFAULT;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('director', 'teacher', 'student', 'madrasah_admin', 'blog_admin', 'store_admin'));

-- Set default to NULL so we can determine role based on context
ALTER TABLE profiles
ALTER COLUMN role SET DEFAULT NULL;

-- Update existing profiles to have appropriate roles based on is_admin flag
-- Keep existing admin roles if they exist
UPDATE profiles
SET role = 'madrasah_admin'
WHERE is_admin = true AND role IS NULL;

-- Update comment to reflect new role system
COMMENT ON COLUMN profiles.role IS
'Comprehensive user role system:
- director: Full access to everything (founder)
- teacher: Access to teacher portal
- student: Access to student portal
- madrasah_admin: Manage students, teachers, and applications
- blog_admin: Manage blog posts and content
- store_admin: Manage store products and orders

Note: is_admin flag is still used for quick admin checks.
Admin roles are: director, madrasah_admin, blog_admin, store_admin';

-- Create a helper function to check if a role is an admin role
CREATE OR REPLACE FUNCTION is_admin_role(role_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN role_value IN ('director', 'madrasah_admin', 'blog_admin', 'store_admin');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a comment explaining the relationship between role and is_admin
COMMENT ON COLUMN profiles.is_admin IS
'Quick admin flag. Should be true if role is director, madrasah_admin, blog_admin, or store_admin.
Use role field for fine-grained access control.';
