# Deployment Guide - Al-Falaah Islamic Institute

## Quick Production Deployment (30 minutes)

### Prerequisites
- [ ] Domain purchased (alfalaah.co.nz or similar)
- [ ] GitHub account
- [ ] Resend API key configured

---

## Step 1: Push Code to GitHub (5 min)

```bash
# Initialize git if not already done
git add .
git commit -m "Prepare for production deployment"

# Create GitHub repository
# Go to github.com → New Repository → "alfalaah"

# Push code
git remote add origin https://github.com/YOUR_USERNAME/alfalaah.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Frontend to Vercel (10 min)

### A. Sign Up & Import
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import your `alfalaah` repository

### B. Configure Build Settings
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### C. Add Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL = https://rkcdamqaptapsrhejdzm.supabase.co
VITE_SUPABASE_ANON_KEY = [your anon key from .env]
```

### D. Deploy
Click "Deploy" - wait 2-3 minutes

Your app will be live at: `https://alfalaah.vercel.app`

---

## Step 3: Configure Custom Domain (10 min)

### A. In Vercel
1. Go to your project → Settings → Domains
2. Add your domain: `alfalaah.co.nz`
3. Vercel will show DNS records to add

### B. In Your Domain Registrar (Namecheap/Domains.co.nz)
Add these DNS records:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME Record (www):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### C. Wait for SSL
- DNS propagation: 5 minutes - 24 hours
- SSL certificate: Automatic once DNS resolves
- Your site will be live at: `https://alfalaah.co.nz`

---

## Step 4: Set Up Custom Email Domain (15 min)

### A. Add Domain to Resend
1. Log into [resend.com](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain: `alfalaah.co.nz`

### B. Add DNS Records
Resend will show you 3 DNS records. Add them to your domain:

**SPF Record (TXT):**
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

**DKIM Record (TXT):**
```
Type: TXT
Name: resend._domainkey
Value: [long key provided by Resend]
```

**DMARC Record (TXT):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; [rest provided by Resend]
```

### C. Wait for Verification
- Check every 5 minutes in Resend dashboard
- Usually verified within 15-30 minutes
- Status will show "Verified" when ready

### D. Update Email Functions
```bash
# Run the update script
./update-email-domain.sh alfalaah.co.nz

# Review changes
git diff

# Deploy updated functions
supabase functions deploy send-application-confirmation
supabase functions deploy send-welcome-email
supabase functions deploy send-daily-digest

# Commit changes
git add .
git commit -m "Update email domain to custom domain"
git push
```

---

## Step 5: Update Supabase Environment Variables

```bash
# Set admin email
supabase secrets set ADMIN_EMAIL=admin@alfalaah.co.nz

# Set app URL
supabase secrets set APP_URL=https://alfalaah.co.nz

# Verify secrets
supabase secrets list
```

Or in Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Add/Update these secrets:
   - `ADMIN_EMAIL` = `admin@alfalaah.co.nz`
   - `APP_URL` = `https://alfalaah.co.nz`

---

## Step 6: Apply Performance Optimizations

```bash
# Run the performance indexes migration
supabase db push

# This will apply migration 015_performance_indexes.sql
# Creates indexes for faster queries
```

---

## Step 7: Set Up Daily Digest Cron

### Option 1: EasyCron (Recommended - 5 min)
1. Sign up at [easycron.com](https://easycron.com)
2. Create Morning Digest:
   - URL: `https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/send-daily-digest`
   - Schedule: `0 20 * * *` (8 AM NZ time)
   - Method: POST
   - Headers:
     ```
     Authorization: Bearer [your_anon_key]
     Content-Type: application/json
     ```
3. Create Evening Digest:
   - Same URL and headers
   - Schedule: `0 8 * * *` (8 PM NZ time)

---

## Step 8: Final Testing

### Test Application Flow
1. Go to `https://alfalaah.co.nz`
2. Click "Apply Now"
3. Fill out application form
4. Submit
5. Check email for confirmation ✅

### Test Admin Flow
1. Go to `https://alfalaah.co.nz/admin`
2. Log in with admin credentials
3. View the new application
4. Click "Approve"
5. Verify student created ✅
6. Check applicant email for welcome message ✅

### Test Digest Email
```bash
./test-digest.sh
```
Check admin email for digest ✅

---

## Step 9: Monitor & Launch

### Enable Monitoring
1. Sign up for [UptimeRobot](https://uptimerobot.com) (free)
2. Add monitor for your site
3. Add email alert to admin@alfalaah.co.nz

### Check Error Logs
- Vercel: Dashboard → Logs
- Supabase: Dashboard → Logs Explorer

### Soft Launch
1. Share with a small group first
2. Monitor for 24-48 hours
3. Fix any issues
4. Full public launch!

---

## Rollback Plan

If something goes wrong:

### Frontend Rollback
1. Go to Vercel dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Database Rollback
```bash
# Revert last migration
supabase db reset --linked

# Or restore from backup
# Supabase Dashboard → Database → Backups → Restore
```

### Email Rollback
```bash
# Revert to sandbox email temporarily
git revert [commit-hash]
git push
supabase functions deploy --all
```

---

## Production Checklist

Before announcing:
- [ ] Custom domain working (`https://alfalaah.co.nz`)
- [ ] SSL certificate active (🔒 in browser)
- [ ] Application form submits successfully
- [ ] Confirmation emails received
- [ ] Admin login works
- [ ] Application approval creates student
- [ ] Welcome emails sent
- [ ] Payment upload works
- [ ] Payment verification works
- [ ] Digest emails scheduled
- [ ] Monitoring enabled
- [ ] Backups enabled
- [ ] All emails use custom domain
- [ ] No console errors in browser
- [ ] Mobile responsive
- [ ] Fast load time (<3 seconds)

---

## Support & Maintenance

### Daily Tasks
- Check digest emails
- Review new applications
- Monitor error logs

### Weekly Tasks
- Process payments
- Check uptime reports
- Review user feedback

### Monthly Tasks
- Update dependencies: `npm update`
- Security audit
- Performance review
- Backup verification

---

## Common Issues & Solutions

### Domain not resolving
- Wait 24-48 hours for DNS propagation
- Check DNS records with: `dig alfalaah.co.nz`
- Clear browser cache

### Emails not sending
- Verify domain in Resend
- Check SPF/DKIM/DMARC records
- Test with `./test-digest.sh`
- Check Supabase function logs

### 404 errors on refresh
- Add `vercel.json` with rewrites
- Check build output directory

### Slow loading
- Run Lighthouse audit
- Optimize images
- Enable CDN caching

---

## Costs Summary

| Service | Cost | Billing |
|---------|------|---------|
| Domain (Namecheap) | $20-30/year | Yearly |
| Vercel (Hobby) | $0 | Free |
| Supabase (Free tier) | $0 | Free* |
| Resend (Free tier) | $0 | Free* |
| EasyCron (Free tier) | $0 | Free |
| **Total** | **~$25/year** | |

*Free tier limits:
- Supabase: 500MB database, 2GB storage, 2GB bandwidth/month
- Resend: 100 emails/day, 3,000/month

Upgrade when needed:
- Supabase Pro: $25/month (more resources)
- Resend Growth: $20/month (50,000 emails/month)

---

## Next Steps After Launch

1. **Marketing:**
   - Social media announcement
   - Email existing community
   - Local community outreach

2. **Analytics:**
   - Set up Google Analytics
   - Track conversion rates
   - Monitor user behavior

3. **Feedback:**
   - Collect user feedback
   - Iterate on features
   - Fix bugs promptly

4. **Growth:**
   - Add more courses
   - Enhance student dashboard
   - Payment gateway integration

---

## Questions?

Check:
- [PRODUCTION_READY.md](PRODUCTION_READY.md) - Full checklist
- [DIGEST_SETUP.md](DIGEST_SETUP.md) - Email digest guide
- [README.md](README.md) - Project overview

**You're ready to launch! 🚀**
