-- Set the founder/owner as director role
-- This ensures the main admin can access everything

-- Update the founder's profile to have director role
-- Replace 'abdulquadrialaka@gmail.com' with your actual admin email if different
UPDATE profiles
SET
  role = 'director',
  is_admin = true
WHERE email = 'abdulquadrialaka@gmail.com';

-- If no rows were updated, it means the profile doesn't exist yet
-- Check if user exists in auth.users but not in profiles
DO $$
DECLARE
  founder_user_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO founder_user_id
  FROM auth.users
  WHERE email = 'abdulquadrialaka@gmail.com';

  -- Check if profile exists
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'abdulquadrialaka@gmail.com'
  ) INTO profile_exists;

  -- If user exists but profile doesn't, create it
  IF founder_user_id IS NOT NULL AND NOT profile_exists THEN
    INSERT INTO profiles (id, email, role, is_admin, full_name)
    VALUES (
      founder_user_id,
      'abdulquadrialaka@gmail.com',
      'director',
      true,
      'Abdul Quadri Alaka'
    );
    RAISE NOTICE 'Created director profile for abdulquadrialaka@gmail.com';
  ELSIF founder_user_id IS NOT NULL AND profile_exists THEN
    RAISE NOTICE 'Updated existing profile to director role';
  ELSE
    RAISE WARNING 'User abdulquadrialaka@gmail.com not found in auth.users - please create the account first';
  END IF;
END $$;

-- Verify the update
DO $$
DECLARE
  current_role TEXT;
BEGIN
  SELECT role INTO current_role FROM profiles WHERE email = 'abdulquadrialaka@gmail.com';
  IF current_role = 'director' THEN
    RAISE NOTICE 'SUCCESS: abdulquadrialaka@gmail.com is now set as director';
  ELSE
    RAISE WARNING 'Profile role is: % (expected: director)', current_role;
  END IF;
END $$;
