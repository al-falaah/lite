-- Add role field to profiles table for role-based access control
-- Roles: director, madrasah_admin, store_admin, blog_admin

-- Add role column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'madrasah_admin'
CHECK (role IN ('director', 'madrasah_admin', 'store_admin', 'blog_admin'));

-- Update existing admin users to have a role
-- Note: You'll need to manually set the director role for the founder
UPDATE profiles
SET role = 'madrasah_admin'
WHERE is_admin = true AND role IS NULL;

-- Add index for faster role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add comment to explain roles
COMMENT ON COLUMN profiles.role IS
'User role for access control:
- director: Full access to everything (founder)
- madrasah_admin: Access to student/teacher/application management
- store_admin: Access only to store management
- blog_admin: Access only to blog management';

-- Note: Keep is_admin for backward compatibility
-- is_admin = true means user has some admin access (any role except NULL)
