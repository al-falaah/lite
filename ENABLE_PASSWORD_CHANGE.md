# Enable Password Change on First Login

## Quick Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- 1. Add first_login column to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- 2. Update existing teachers to require password change on first login
UPDATE teachers SET first_login = true WHERE first_login IS NULL;

-- 3. Drop old restrictive UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can update teachers" ON teachers;

-- 4. Create new public UPDATE policy (allows teachers to change their own password)
CREATE POLICY "Anyone can update teachers"
  ON teachers FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
```

## What This Does

1. **Adds `first_login` column**: Defaults to `true` for all new teachers
2. **Updates existing teachers**: Sets `first_login = true` for any teachers already in the database
3. **Updates RLS policy**: Allows public (unauthenticated) users to UPDATE the teachers table
   - This is needed because teachers aren't Supabase auth users
   - They need to be able to update their own password

## How It Works

### Teacher First Login Flow:
1. Teacher logs in with Staff ID and auto-generated password
2. System checks `first_login` field
3. If `first_login === true`:
   - Shows "Change Password" modal (cannot be dismissed)
   - Requires new password (minimum 8 characters)
   - Updates password and sets `first_login = false`
   - Loads teacher dashboard
4. If `first_login === false`:
   - Normal login, goes straight to dashboard

### Security Notes:
- Teachers must change password before accessing the portal
- New password must be at least 8 characters
- Password must be confirmed (double-entry)
- TODO: Add bcrypt password hashing in production (currently plain text)

## Testing

After running the SQL:
1. Create a new teacher in admin dashboard
2. Note the auto-generated credentials
3. Login at `/teacher` with those credentials
4. You should see the password change modal
5. Set a new password
6. Dashboard should load after successful password change
7. Logout and login again with new password (should go straight to dashboard)

## Files Modified

- `src/pages/TeacherPortal.jsx` - Added password change modal and logic
- `TEACHER_SETUP_SQL.md` - Updated to include `first_login` column and RLS policy
- `TEACHER_PASSWORD_CHANGE_MIGRATION.sql` - Migration SQL for existing installations
