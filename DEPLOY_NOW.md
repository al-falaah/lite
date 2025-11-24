# Deploy Al-Falaah Academy - Step by Step

## Your Domain: `alfalaah-academy.nz` ✅

Let's get your site live! Follow these steps in order.

---

## Step 1: Push Code to GitHub (5 min)

```bash
# Commit all changes
git add .
git commit -m "Production ready - Al-Falaah Academy"

# Push to GitHub
git push origin main
```

If you haven't set up GitHub yet:
1. Go to [github.com](https://github.com) → New Repository
2. Name: `alfalaah-academy`
3. Create repository
4. Run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/alfalaah-academy.git
git branch -M main
git push -u origin main
```

✅ **Check:** Your code is on GitHub

---

## Step 2: Deploy to Vercel (10 min)

### A. Sign Up & Import
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" → Continue with GitHub
3. Click "Add New" → "Project"
4. Find and import `alfalaah-academy`

### B. Configure Project
Vercel will auto-detect Vite. Just verify:
- **Framework Preset:** Vite
- **Root Directory:** ./
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### C. Add Environment Variables
Click "Environment Variables" and add:

```
Name: VITE_SUPABASE_URL
Value: https://rkcdamqaptapsrhejdzm.supabase.co

Name: VITE_SUPABASE_ANON_KEY
Value: [Copy from your .env file]
```

### D. Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. You'll get a URL like: `https://alfalaah-academy.vercel.app`

✅ **Check:** Visit the Vercel URL - your site should load!

---

## Step 3: Connect Custom Domain (15 min)

### A. In Vercel Dashboard
1. Go to your project → Settings → Domains
2. Click "Add Domain"
3. Enter: `alfalaah-academy.nz`
4. Click "Add"
5. Vercel will show you DNS records to add

### B. In Your Domain Registrar
Log into where you bought the domain and add these DNS records:

**A Record:**
```
Type: A
Name: @ (or blank)
Value: 76.76.21.21
TTL: 3600
```

**A Record (www):**
```
Type: A
Name: www
Value: 76.76.21.21
TTL: 3600
```

**Or use CNAME (alternative):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### C. Wait for DNS Propagation
- Usually takes 5-30 minutes
- Can take up to 24 hours
- Check status in Vercel dashboard
- SSL certificate will be issued automatically

✅ **Check:** Visit `https://alfalaah-academy.nz` - should show your site with 🔒

---

## Step 4: Set Up Email Domain in Resend (20 min)

### A. Add Domain
1. Log into [resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter: `alfalaah-academy.nz`
4. Click "Add Domain"

### B. Add DNS Records
Resend will show you 3 DNS records. Add them in your domain registrar:

**SPF Record:**
```
Type: TXT
Name: @ (or blank)
Value: v=spf1 include:resend.com ~all
TTL: 3600
```

**DKIM Record:**
```
Type: TXT
Name: resend._domainkey
Value: [Long value provided by Resend - copy exactly]
TTL: 3600
```

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@alfalaah-academy.nz
TTL: 3600
```

### C. Wait for Verification
- Check Resend dashboard every 5 minutes
- Status will change from "Pending" to "Verified"
- Usually takes 15-30 minutes
- DNS records must fully propagate

✅ **Check:** Resend shows domain as "Verified" ✓

---

## Step 5: Update Email Functions (5 min)

Once Resend domain is verified:

```bash
# Update all email functions to use your domain
./update-email-domain.sh

# Review the changes
git diff

# Commit changes
git add .
git commit -m "Update email domain to alfalaah-academy.nz"
git push
```

Deploy updated functions:
```bash
supabase functions deploy send-application-confirmation
supabase functions deploy send-welcome-email
supabase functions deploy send-daily-digest
```

✅ **Check:** All 3 functions deployed successfully

---

## Step 6: Update Supabase Environment Variables (2 min)

```bash
# Set admin email
supabase secrets set ADMIN_EMAIL=admin@alfalaah-academy.nz

# Set app URL
supabase secrets set APP_URL=https://alfalaah-academy.nz

# Verify secrets set
supabase secrets list
```

✅ **Check:** See ADMIN_EMAIL and APP_URL in secrets list

---

## Step 7: Apply Performance Optimizations (1 min)

```bash
# Apply database indexes for faster queries
supabase db push
```

This applies migration `015_performance_indexes.sql`

✅ **Check:** Migration applied successfully

---

## Step 8: Set Up Daily Digest Cron (5 min)

### Option: EasyCron (Free)
1. Go to [easycron.com](https://easycron.com)
2. Sign up (free account)
3. Click "Create New Cron Job"

**Morning Digest (8 AM NZ):**
- **URL:** `https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/send-daily-digest`
- **Cron Expression:** `0 20 * * *`
- **When:** Custom
- **HTTP Method:** POST
- **HTTP Headers:**
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... [your SUPABASE_ANON_KEY]
  Content-Type: application/json
  ```
- **Request Body:** `{}`

Click "Save"

**Evening Digest (8 PM NZ):**
- Same settings as above
- **Cron Expression:** `0 8 * * *`

Click "Save"

✅ **Check:** 2 cron jobs created and enabled

---

## Step 9: Final Testing (10 min)

### Test Application Flow
1. Visit: `https://alfalaah-academy.nz`
2. Click "Apply Now"
3. Fill out the form with test data
4. Submit

**Expected:**
- ✅ Success message shown
- ✅ Confirmation email received at test email

### Test Admin Flow
1. Visit: `https://alfalaah-academy.nz/admin`
2. Log in with admin credentials
3. View the test application
4. Click "Approve"

**Expected:**
- ✅ Student created successfully
- ✅ Welcome email sent to applicant
- ✅ No errors in console

### Test Digest Email
```bash
./test-digest.sh
```

**Expected:**
- ✅ Success response
- ✅ Digest email received at admin@alfalaah-academy.nz

✅ **Check:** All tests passing!

---

## Step 10: Enable Monitoring (5 min)

### Set Up Uptime Monitoring
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up (free)
3. Add New Monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Al-Falaah Academy
   - **URL:** `https://alfalaah-academy.nz`
   - **Monitoring Interval:** 5 minutes
   - **Alert Contacts:** Your email

✅ **Check:** Uptime monitor active

---

## 🎉 You're Live!

Your site is now live at: **https://alfalaah-academy.nz**

### What's Working:
- ✅ Public application form
- ✅ Email confirmations
- ✅ Admin dashboard
- ✅ Application approval
- ✅ Student creation
- ✅ Welcome emails
- ✅ Daily digest emails
- ✅ Custom domain with SSL
- ✅ Uptime monitoring

---

## Quick Reference

**Your URLs:**
- **Public Site:** https://alfalaah-academy.nz
- **Admin Dashboard:** https://alfalaah-academy.nz/admin
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Resend Dashboard:** https://resend.com/emails

**Important Emails:**
- **Admin:** admin@alfalaah-academy.nz
- **No-Reply:** noreply@alfalaah-academy.nz

**Credentials:**
- Saved in your password manager ✓

---

## Common Issues

**Domain not loading?**
- Wait 24 hours for DNS propagation
- Check DNS records in registrar
- Clear browser cache (Cmd+Shift+R)

**Emails not sending?**
- Verify domain in Resend
- Check DNS TXT records
- Wait for full propagation
- Test with `./test-digest.sh`

**Admin can't log in?**
- Check credentials
- Clear browser cookies
- Check Supabase Auth logs

**Need Help?**
- Check logs: Vercel Dashboard → Logs
- Check errors: Supabase Dashboard → Logs
- Check email status: Resend Dashboard → Emails

---

## Next Steps

1. **Share the link** with your community
2. **Monitor** applications coming in
3. **Respond** to digest emails
4. **Process** applications regularly

**Congratulations on launching! 🚀**
