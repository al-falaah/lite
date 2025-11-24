-- This migration creates an admin user
-- You'll need to update the email and run this after the user signs up

-- INSTRUCTIONS:
-- 1. First, sign up at your app with your admin email
-- 2. Then run this SQL to make that user an admin:
--    UPDATE profiles SET is_admin = true WHERE email = 'your-admin-email@example.com';

-- Alternatively, you can insert directly if you know the user ID from auth.users:
-- INSERT INTO profiles (id, email, full_name, is_admin)
-- SELECT id, email, raw_user_meta_data->>'full_name', true
-- FROM auth.users
-- WHERE email = 'your-admin-email@example.com'
-- ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- For now, let's just create a helper view to see all users
CREATE OR REPLACE VIEW admin_users AS
SELECT
  u.id,
  u.email,
  u.created_at as signed_up_at,
  p.full_name,
  p.is_admin,
  p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id;

-- Grant access to authenticated users to view this
GRANT SELECT ON admin_users TO authenticated;
