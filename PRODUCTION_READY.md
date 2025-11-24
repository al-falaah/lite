# Production Readiness Checklist

## 1. Domain & Email Setup

### A. Purchase Domain
- [ ] Buy domain (recommended: `alfalaah.co.nz` or `alfalaah.org.nz`)
- [ ] Configure DNS with your domain registrar
- [ ] Point domain to your hosting (Vercel/Netlify recommended for React apps)

### B. Email Domain Setup (Resend)
1. [ ] Log into [Resend.com](https://resend.com)
2. [ ] Go to Domains → Add Domain
3. [ ] Add your domain (e.g., `alfalaah.co.nz`)
4. [ ] Add the DNS records Resend provides to your domain registrar:
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)
5. [ ] Wait for verification (usually 5-30 minutes)
6. [ ] Test sending from `noreply@yourdomain.co.nz`

### C. Update Environment Variables
```bash
# In Supabase Dashboard → Project Settings → Edge Functions → Secrets
APP_URL=https://yourdomain.co.nz
ADMIN_EMAIL=admin@yourdomain.co.nz
```

### D. Update All Email Functions
After domain verification, update these files to use your custom domain:
- `supabase/functions/send-application-confirmation/index.ts`
- `supabase/functions/send-welcome-email/index.ts`
- `supabase/functions/send-daily-digest/index.ts`
- `supabase/functions/_shared/email.ts`

Change from: `from: 'Name <onboarding@resend.dev>'`
To: `from: 'Al-Falaah <noreply@yourdomain.co.nz>'`

## 2. Hosting Setup

### Option A: Vercel (Recommended)
1. [ ] Sign up at [Vercel.com](https://vercel.com)
2. [ ] Import your GitHub repository
3. [ ] Configure build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. [ ] Add environment variables in Vercel dashboard
5. [ ] Connect custom domain
6. [ ] Deploy!

### Option B: Netlify
1. [ ] Sign up at [Netlify.com](https://netlify.com)
2. [ ] Import repository
3. [ ] Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. [ ] Add environment variables
5. [ ] Connect custom domain
6. [ ] Deploy!

## 3. Environment Variables Review

### Frontend (.env - Vercel/Netlify)
```bash
VITE_SUPABASE_URL=https://rkcdamqaptapsrhejdzm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Backend (Supabase Edge Functions Secrets)
```bash
RESEND_API_KEY=re_your_key_here
ADMIN_EMAIL=admin@yourdomain.co.nz
APP_URL=https://yourdomain.co.nz
SUPABASE_URL=https://rkcdamqaptapsrhejdzm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

To set Supabase secrets:
```bash
supabase secrets set ADMIN_EMAIL=admin@yourdomain.co.nz
supabase secrets set APP_URL=https://yourdomain.co.nz
```

## 4. Security Checklist

### A. Review RLS Policies
- [ ] All tables have RLS enabled
- [ ] Public can only insert applications (read-only)
- [ ] Students can only read their own data
- [ ] Only admins can modify sensitive data
- [ ] Payment uploads properly restricted

### B. API Keys
- [ ] Never commit `.env` files to Git (already in `.gitignore`)
- [ ] Use environment variables for all secrets
- [ ] Rotate keys if accidentally exposed
- [ ] Use different keys for dev/prod

### C. Authentication
- [ ] Admin passwords are strong
- [ ] Rate limiting enabled on Supabase
- [ ] Email verification required (if using user signups)

## 5. Performance Optimization

### Frontend
- [ ] Images optimized (use WebP format)
- [ ] Lazy loading for routes
- [ ] Bundle size checked (`npm run build` - check dist size)
- [ ] Lighthouse score > 90

### Backend
- [ ] Database indexes on frequently queried columns:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
  CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
  CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
  CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
  ```
- [ ] Edge functions deployed and tested

## 6. Testing Checklist

### Manual Testing
- [ ] Submit application from public form
- [ ] Receive confirmation email
- [ ] Admin receives digest email (or individual notification)
- [ ] Admin can log in
- [ ] Admin can approve application
- [ ] Student record created successfully
- [ ] Applicant receives welcome/approval email
- [ ] Upload payment screenshot
- [ ] Admin can verify payment
- [ ] Student payment status updates
- [ ] All email links work with production domain

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile (iOS)
- [ ] Mobile (Android)

## 7. Monitoring & Analytics

### Error Tracking
- [ ] Set up [Sentry](https://sentry.io) for error tracking
- [ ] Configure error boundaries in React
- [ ] Monitor Supabase logs

### Analytics
- [ ] Add [Google Analytics 4](https://analytics.google.com) or [Plausible](https://plausible.io)
- [ ] Track key events:
  - Application submissions
  - Payment uploads
  - Admin logins

### Uptime Monitoring
- [ ] Set up [UptimeRobot](https://uptimerobot.com) (free)
- [ ] Monitor main site
- [ ] Monitor critical Edge Functions

## 8. Backup Strategy

### Database Backups
- [ ] Enable Supabase automatic backups (Settings → Database → Backups)
- [ ] Schedule weekly manual exports
- [ ] Test restore process

### Code Backups
- [ ] Repository pushed to GitHub
- [ ] Enable branch protection on main
- [ ] Tag production releases

## 9. Documentation

- [ ] Admin user guide (how to use dashboard)
- [ ] Student onboarding guide
- [ ] Payment process documentation
- [ ] Troubleshooting guide
- [ ] Contact information for support

## 10. Launch Preparation

### Pre-Launch
- [ ] All checklist items above completed
- [ ] Staging environment tested thoroughly
- [ ] Backups confirmed working
- [ ] Support email set up
- [ ] Social media accounts (if needed)
- [ ] Marketing materials ready

### Launch Day
- [ ] Deploy to production
- [ ] Verify all emails working
- [ ] Test complete user journey
- [ ] Monitor error logs closely
- [ ] Have rollback plan ready

### Post-Launch
- [ ] Monitor analytics daily (first week)
- [ ] Check error logs daily
- [ ] Respond to user feedback
- [ ] Create support ticket system if needed

## 11. Legal & Compliance

- [ ] Privacy policy page
- [ ] Terms of service
- [ ] Cookie consent (if using analytics)
- [ ] Data retention policy
- [ ] GDPR compliance (if applicable)
- [ ] Copyright notices

## 12. Maintenance Schedule

### Daily
- Check error logs
- Monitor application submissions
- Verify digest emails sent

### Weekly
- Review and approve applications
- Verify payments
- Database health check

### Monthly
- Security updates
- Dependency updates
- Performance review
- Backup verification

---

## Quick Start Guide

### Step 1: Get a Domain (Today)
1. Go to [Namecheap](https://namecheap.com) or [Domains.co.nz](https://domains.co.nz)
2. Search for `alfalaah.co.nz`
3. Purchase (~$20-30/year)

### Step 2: Set Up Email (Same Day)
1. Add domain to Resend
2. Configure DNS records
3. Wait for verification
4. Update email functions

### Step 3: Deploy Frontend (Same Day)
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

### Step 4: Configure Custom Domain
1. Add domain in Vercel
2. Update DNS to point to Vercel
3. Wait for SSL (automatic)

### Step 5: Test Everything
Run through the complete testing checklist

### Step 6: Go Live! 🚀

---

## Need Help?

**Common Issues:**
- DNS not propagating? Wait 24-48 hours
- Emails not sending? Check Resend domain verification
- 404 errors? Check routing and build output
- RLS errors? Review database policies

**Support Resources:**
- Supabase Docs: https://supabase.com/docs
- Vite Docs: https://vitejs.dev
- Vercel Docs: https://vercel.com/docs
- Resend Docs: https://resend.com/docs
