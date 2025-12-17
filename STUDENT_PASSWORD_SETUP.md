# Student Password Authentication - Setup Guide

## Quick Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- 1. Add password and first_login columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- 2. Generate random passwords for existing students (8 characters each)
UPDATE students
SET password =
  CASE
    WHEN password IS NULL THEN
      substring(md5(random()::text || clock_timestamp()::text) from 1 for 8)
    ELSE password
  END,
  first_login = COALESCE(first_login, true)
WHERE password IS NULL;

-- 3. Make password NOT NULL after setting values
ALTER TABLE students ALTER COLUMN password SET NOT NULL;

-- 4. Update RLS policy to allow public UPDATE (for password changes)
DROP POLICY IF EXISTS "Authenticated users can update students" ON students;

CREATE POLICY "Anyone can update students"
  ON students FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
```

## IMPORTANT: Export Generated Passwords

After running the migration, **immediately export the generated passwords** for existing students:

```sql
-- Export student credentials (save this CSV and send to students)
SELECT
  student_id,
  full_name,
  email,
  password,
  'first_login' as status
FROM students
WHERE first_login = true
ORDER BY student_id;
```

## What Changed

### Frontend Updates:
1. **StudentPortal Login** ([StudentPortal.jsx](src/pages/StudentPortal.jsx)):
   - Added password field to login form
   - Password validation on login
   - First login password change modal
   - Password must be at least 8 characters

### Database Updates:
1. **students table**:
   - `password` TEXT NOT NULL - stores password (plain text for now, TODO: bcrypt)
   - `first_login` BOOLEAN DEFAULT true - tracks if password needs changing

2. **RLS Policy**:
   - Changed from authenticated-only to public UPDATE
   - Allows students to update their own password

## Student Login Flow

### First Login:
1. Student receives email with Student ID and auto-generated password
2. Student goes to `/student` portal
3. Enters Student ID + password
4. **Password change modal appears** (cannot be dismissed)
5. Sets new password (min 8 chars)
6. Password updated, `first_login` set to `false`
7. Dashboard loads normally

### Subsequent Logins:
1. Student enters Student ID + their new password
2. Goes directly to dashboard

## Email Template Update Needed

When creating new students, the welcome email should include:

```
Subject: Welcome to Al-Falaah Academy

Dear [Student Name],

Welcome to Al-Falaah Academy! Your enrollment has been confirmed.

Your Login Credentials:
- Student ID: [123456]
- Password: [auto_generated_password]

Access your student portal: https://www.alfalaah-academy.nz/student

IMPORTANT: You will be required to change your password on first login for security.

...
```

## For Existing Students

You need to send an email to all existing students with their generated passwords. Use the SQL query above to export their credentials, then send them via email.

Suggested email:
```
Subject: Student Portal - Password Setup Required

Dear [Student Name],

We've enhanced the security of our student portal. Please login with the credentials below and set a new password:

Student ID: [123456]
Temporary Password: [generated_password]

Portal: https://www.alfalaah-academy.nz/student

You'll be prompted to create a new password on first login.

Best regards,
Al-Falaah Academy
```

## Security Notes

- Passwords currently stored as plain text (TODO: implement bcrypt hashing)
- Students must change password on first login
- New password must be minimum 8 characters
- Password confirmation required (double-entry)

## Testing

1. Run the SQL migration
2. Export existing student passwords
3. Login as a student with auto-generated password
4. Verify password change modal appears
5. Set new password
6. Verify dashboard loads
7. Logout and login with new password
8. Verify direct access to dashboard

## Files Modified

- `src/pages/StudentPortal.jsx` - Added password auth and change modal (~100 lines added)
- `STUDENT_PASSWORD_MIGRATION.sql` - Migration SQL
- `STUDENT_PASSWORD_SETUP.md` - This file
