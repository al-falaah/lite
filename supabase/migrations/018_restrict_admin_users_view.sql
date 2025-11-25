-- =============================================
-- Restrict admin_users View to Admins Only
-- =============================================
-- Security Fix: The admin_users view was unrestricted, allowing any
-- authenticated user to view all user emails and admin status.
-- This migration restricts access to admins only.

-- Revoke the broad access granted earlier
REVOKE SELECT ON admin_users FROM authenticated;
REVOKE SELECT ON admin_users FROM anon;

-- Create a security definer function that checks admin status
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  signed_up_at TIMESTAMPTZ,
  full_name TEXT,
  is_admin BOOLEAN,
  profile_created_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return all users if admin
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.created_at as signed_up_at,
    p.full_name,
    p.is_admin,
    p.created_at as profile_created_at
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id;
END;
$$;

-- Grant execute permission to authenticated users
-- (The function itself will check if they're admin)
GRANT EXECUTE ON FUNCTION get_admin_users() TO authenticated;

-- =============================================
-- USAGE
-- =============================================
-- Instead of: SELECT * FROM admin_users;
-- Use:        SELECT * FROM get_admin_users();
--
-- Non-admin users will get an error: "Access denied: Admin privileges required"
-- Admin users will see all user data

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ admin_users view access restricted to admins only!' as message;
