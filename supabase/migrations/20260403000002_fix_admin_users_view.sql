-- Fix admin_users view to only show actual admin users, not students/teachers
CREATE OR REPLACE VIEW admin_users AS
SELECT
  u.id,
  u.email,
  u.created_at AS signed_up_at,
  p.full_name,
  p.is_admin,
  p.created_at AS profile_created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.role IN ('director', 'madrasah_admin', 'blog_admin', 'store_admin', 'research_admin')
   OR p.is_admin = true;
