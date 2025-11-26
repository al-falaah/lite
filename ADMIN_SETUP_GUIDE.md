# Admin User Setup Guide

## Setting Up admin@alfalaah-academy.nz

This guide will help you set up the admin user for the Al-Falaah Academy system.

## Option 1: Using Supabase Dashboard (Recommended)

### Step 1: Create the Admin User in Supabase Auth

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Users** in the left sidebar
4. Click **Add User** button
5. Fill in the form:
   - **Email**: `admin@alfalaah-academy.nz`
   - **Password**: Choose a strong password (save it securely!)
   - **Auto Confirm User**: ✅ Check this box (so email confirmation is not required)
6. Click **Create User**

### Step 2: Get the User ID

1. After creating the user, you'll see them in the users list
2. Click on the user to view details
3. Copy the **User ID** (UUID format, e.g., `550e8400-e29b-41d4-a716-446655440000`)

### Step 3: Create/Update the Admin Profile

1. Navigate to **Table Editor** → **profiles** table
2. Check if a profile already exists for this user ID:
   - If YES: Click **Edit** and set `role` to `admin`
   - If NO: Click **Insert** → **Insert Row** and fill in:
     - **id**: Paste the User ID from Step 2
     - **email**: `admin@alfalaah-academy.nz`
     - **full_name**: `Al-Falaah Admin` (or your preferred name)
     - **role**: `admin`
3. Click **Save**

### Step 4: Test the Login

1. Go to your application: https://yourdomain.com/admin
2. Login with:
   - Email: `admin@alfalaah-academy.nz`
   - Password: [the password you set in Step 1]
3. You should now have access to the admin dashboard!

---

## Option 2: Using Supabase CLI

If you prefer using the command line:

### Step 1: Create the Admin User

```bash
# Login to Supabase CLI
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Create the admin user (run this in Node.js or browser console with your Supabase client)
# Note: This needs to be run with service role key for security
```

### Step 2: Use SQL Migration

After creating the user through the dashboard or API, run the migration:

```bash
npx supabase db push
```

This will ensure the profile has the correct admin role.

---

## Option 3: Manual SQL (After Creating Auth User)

If you've already created the user through the Dashboard:

1. Navigate to **SQL Editor** in Supabase Dashboard
2. Run this query (replace `YOUR_USER_ID` with the actual UUID):

```sql
-- Insert or update the admin profile
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  'YOUR_USER_ID',
  'admin@alfalaah-academy.nz',
  'Al-Falaah Admin',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id)
DO UPDATE SET
  role = 'admin',
  email = 'admin@alfalaah-academy.nz',
  updated_at = NOW();
```

---

## Setting Up info@alfalaah-academy.nz

This email will be used for:
- Contact form submissions
- General inquiries
- System notifications

### Email Provider Options:

1. **Google Workspace** (Recommended for professional use)
   - Cost: ~$6-12 NZD/month per user
   - Custom domain email
   - Professional features (Drive, Calendar, etc.)
   - Setup: https://workspace.google.com

2. **Microsoft 365**
   - Cost: ~$8-15 NZD/month per user
   - Custom domain email
   - Office apps included
   - Setup: https://www.microsoft.com/microsoft-365

3. **Zoho Mail** (Budget-friendly option)
   - Cost: Free for up to 5 users (lite plan)
   - Custom domain email
   - Basic features
   - Setup: https://www.zoho.com/mail/

4. **Your Domain Registrar** (e.g., Namecheap, GoDaddy)
   - Often includes email hosting
   - Check with alfalaah-academy.nz registrar

### Recommended Setup:

Create these email addresses:
- ✅ `admin@alfalaah-academy.nz` - Admin dashboard login
- ✅ `info@alfalaah-academy.nz` - General inquiries
- 📧 `support@alfalaah-academy.nz` - Student support (optional)
- 📧 `applications@alfalaah-academy.nz` - Application inquiries (optional)

---

## Configuring Email in the Application

Once you have the email addresses set up, you can configure:

1. **Resend API** (for sending automated emails):
   - Sign up at https://resend.com
   - Verify your domain (alfalaah-academy.nz)
   - Get API key
   - Add to `.env`: `RESEND_API_KEY=your_key_here`

2. **Update Environment Variables**:
   ```env
   ADMIN_EMAIL=admin@alfalaah-academy.nz
   INFO_EMAIL=info@alfalaah-academy.nz
   SUPPORT_EMAIL=support@alfalaah-academy.nz
   ```

---

## Security Best Practices

1. **Use a Strong Password** for admin@alfalaah-academy.nz
   - At least 16 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Use a password manager (1Password, Bitwarden, LastPass)

2. **Enable 2FA** (if available in your email provider)

3. **Backup Access**
   - Keep admin password in a secure location
   - Consider having a backup admin account

4. **Regular Security Audits**
   - Review admin access logs in Supabase
   - Monitor login attempts

---

## Troubleshooting

### Issue: "User already exists"
- The email is already in Auth, check the Users table in Supabase Dashboard
- Get the User ID and update the profile role to 'admin'

### Issue: "Login failed" or "Invalid credentials"
- Verify the email is exactly: `admin@alfalaah-academy.nz`
- Check that Auto Confirm User was enabled
- Verify the password is correct

### Issue: "Not authorized" after login
- Check the profiles table has role='admin' for this user
- Verify the user ID in profiles matches the Auth user ID
- Check browser console for errors

### Issue: Can't access admin dashboard
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Check Network tab in browser DevTools for API errors

---

## Next Steps After Setup

1. ✅ Login with admin@alfalaah-academy.nz
2. 📝 Test all admin features (Applications, Students, Scheduling)
3. 📧 Set up email notifications system
4. 🔐 Enable 2FA on the admin email account
5. 📊 Add analytics dashboard
6. 📤 Configure automated email sending via Resend

---

Need help? Check the Supabase documentation:
- Auth: https://supabase.com/docs/guides/auth
- Users: https://supabase.com/docs/guides/auth/managing-user-data
