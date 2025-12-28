# Password Hashing Migration Guide

## Overview
Your application now uses **bcrypt password hashing** for secure password storage. All passwords are hashed before being stored in the database.

## What Changed

### 1. **Stripe Webhook** (`supabase/functions/stripe-webhook/index.ts`)
- Now imports bcrypt for Deno
- Generates plain-text password (sent to user via email)
- **Hashes password before storing** in database
- ✅ Already deployed to production

### 2. **Student Portal** (`src/pages/StudentPortal.jsx`)
- Login: Uses `bcrypt.compare()` to verify hashed passwords
- Password Change: Hashes new password with `bcrypt.hash()` before storing
- Does not store password in localStorage (security improvement)

### 3. **Teacher Portal** (`src/pages/TeacherPortal.jsx`)
- Login: Uses `bcrypt.compare()` to verify hashed passwords
- Password Change: Hashes new password with `bcrypt.hash()` before storing
- Does not store password in localStorage (security improvement)

## Migration Steps

### ⚠️ IMPORTANT: Run Migration Script

You need to hash all **existing plain-text passwords** in your database.

1. **Add Service Role Key to .env**:
   ```bash
   # Get this from Supabase Dashboard > Settings > API > service_role key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Run the migration script**:
   ```bash
   node migrate-passwords.js
   ```

3. **What the script does**:
   - Fetches all students and teachers from database
   - Checks if password is already hashed (skips if yes)
   - Hashes plain-text passwords using bcrypt
   - Updates database with hashed passwords
   - Shows progress and summary

4. **Expected output**:
   ```
   🔐 Starting password migration...

   📚 Fetching students with plain-text passwords...
      Found 25 students

      ✅ Student 123456: Password hashed
      ✅ Student 789012: Password hashed
      ⏭️  Student 345678: Already hashed, skipping

   📊 Students: 23 updated, 2 skipped

   👨‍🏫 Fetching teachers with plain-text passwords...
      Found 5 teachers

      ✅ Teacher T001: Password hashed
      ✅ Teacher T002: Password hashed

   📊 Teachers: 5 updated, 0 skipped

   ✨ Password migration completed successfully!

   📝 Summary:
      Students: 23 updated, 2 skipped
      Teachers: 5 updated, 0 skipped
      Total: 28 passwords hashed
   ```

5. **Run only ONCE**: The script is safe to run multiple times (skips already-hashed passwords), but only needs to be run once.

## How It Works

### Password Generation (New Students)
1. Stripe payment succeeds
2. Webhook generates random 8-character password
3. **Password is hashed with bcrypt** before storing in DB
4. **Plain-text password is sent to student via email** (they need it to login!)
5. Student logs in with plain-text password
6. System compares using `bcrypt.compare(plaintext, hashed)`

### Login Flow
1. User enters plain-text password
2. System fetches hashed password from database
3. Uses `bcrypt.compare()` to verify match
4. Grants access if password matches

### Password Change
1. User enters new password
2. Password is hashed with `bcrypt.hash(password, 10)`
3. Hashed password stored in database
4. User can login with new password

## Security Benefits

✅ **Before**: Passwords stored in plain text (anyone with DB access can see them)
✅ **After**: Passwords stored as bcrypt hashes (impossible to reverse)

### Example:
```
Plain text: "ABC12345"
Bcrypt hash: "$2a$10$N9qo8uLOickgx2ZMRZoMye/s9gNFYGJLZIa5lJqC6K5e7w0pQvG3."
```

Even with database access, the actual password cannot be recovered from the hash.

## Testing

After deploying and running the migration:

1. **Test Student Login**:
   - Try logging in with an existing student's credentials
   - Should work with their original password

2. **Test Password Change**:
   - Login as a student/teacher
   - Change password
   - Logout and login with new password

3. **Test New Student Creation**:
   - Process a new payment through Stripe
   - Verify student receives password via email
   - Login with the password from email

## Rollback Plan

If something goes wrong:

1. The migration script can be re-run (it skips already-hashed passwords)
2. Old code is in git history
3. Database has not been modified structurally (only password values changed)

## Files Modified

- ✅ `supabase/functions/stripe-webhook/index.ts` - Hash passwords on generation
- ✅ `src/pages/StudentPortal.jsx` - Verify and hash passwords
- ✅ `src/pages/TeacherPortal.jsx` - Verify and hash passwords
- ✅ `package.json` - Added bcryptjs dependency
- ✅ `migrate-passwords.js` - One-time migration script (NEW)

## Next Steps

1. ✅ Code changes deployed
2. ✅ Stripe webhook deployed
3. ⏳ **Run migration script** (`node migrate-passwords.js`)
4. ⏳ **Test login** with existing users
5. ⏳ **Test password change** functionality
6. ⏳ **Delete migration script** after successful migration

## Support

If you encounter issues:
- Check that `SUPABASE_SERVICE_ROLE_KEY` is in `.env`
- Check browser console for errors during login
- Check Supabase Edge Function logs for webhook errors
- Migration script shows detailed output for debugging
