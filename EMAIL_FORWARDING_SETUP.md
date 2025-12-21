# Email Forwarding Setup Guide

## Overview
This guide will help you set up email forwarding from `admin@tftmadrasah.nz` to your Gmail account `alfalaah.academy.nz@gmail.com` using ImprovMX (free service).

## What You'll Accomplish
1. ✅ Receive emails sent to admin@tftmadrasah.nz in your Gmail
2. ✅ Send emails FROM admin@tftmadrasah.nz through Gmail
3. ✅ All automated emails will have proper reply-to address

---

## Part 1: Set Up ImprovMX Email Forwarding

### Step 1: Create ImprovMX Account
1. Go to [improvmx.com](https://improvmx.com)
2. Click **"Get Started Free"**
3. Enter your email: **alfalaah.academy.nz@gmail.com**
4. Check your Gmail inbox and verify your email address
5. Set a password for your ImprovMX account

### Step 2: Add Your Domain to ImprovMX
1. Log in to your ImprovMX dashboard
2. Click **"Add Domain"**
3. Enter: **tftmadrasah.nz**
4. Click **"Add Domain"**

### Step 3: Create Email Alias
1. Click on **tftmadrasah.nz** in your domain list
2. Click **"Add Alias"** or **"Create Alias"**
3. Fill in:
   - **Alias**: `admin` (or use `*` for catch-all - forwards ALL emails to your Gmail)
   - **Forward to**: `alfalaah.academy.nz@gmail.com`
4. Click **"Create Alias"**

> **Tip**: Using `*` as the alias creates a catch-all, so any email to your domain (contact@, info@, support@, etc.) will forward to your Gmail.

---

## Part 2: Configure DNS Records

ImprovMX will provide you with MX records that you need to add to your domain's DNS settings.

### Where to Add DNS Records

Your domain **tftmadrasah.nz** is registered with a domain registrar. Common registrars include:
- Namecheap
- GoDaddy
- Google Domains / Squarespace Domains
- Cloudflare
- Name.com
- Others

**Find your registrar**: Check your email for domain registration confirmation, or use [whois.domaintools.com](https://whois.domaintools.com) to find out.

### MX Records to Add

ImprovMX will show you the exact records. They should look like this:

| Type | Name/Host | Priority | Value/Points to      |
|------|-----------|----------|----------------------|
| MX   | @         | 10       | mx1.improvmx.com     |
| MX   | @         | 20       | mx2.improvmx.com     |

**Important Notes**:
- `@` means your root domain (tftmadrasah.nz)
- Some registrars use "Host" instead of "Name" - enter `@` or leave blank
- **Delete any existing MX records** for your domain first!
- DNS changes can take up to 24 hours to propagate (usually within 1-2 hours)

### Common Registrar Instructions

#### For Namecheap:
1. Log in to Namecheap
2. Go to Domain List → Manage
3. Advanced DNS tab
4. Add new record → Choose MX Record
5. Delete any existing MX records

#### For GoDaddy:
1. Log in to GoDaddy
2. My Products → DNS
3. Add → MX
4. Delete any existing MX records

#### For Cloudflare:
1. Log in to Cloudflare
2. Select your domain
3. DNS → Records → Add record
4. Type: MX

### Step 4: Verify DNS Configuration

1. After adding MX records, go back to ImprovMX dashboard
2. Click **"Verify DNS"** or **"Check DNS"**
3. ImprovMX will check if the records are set up correctly
4. Once verified, you'll see a green checkmark ✅

### Step 5: Test Email Forwarding

1. Send a test email to `admin@tftmadrasah.nz` from any email account
2. Check your Gmail inbox (`alfalaah.academy.nz@gmail.com`)
3. You should receive the forwarded email within seconds

---

## Part 3: Gmail Send-As Configuration (Optional but Recommended)

This allows you to send emails FROM `admin@tftmadrasah.nz` through Gmail, so recipients see your professional email address.

### Option A: Simple Method (Send through Gmail)

1. Open Gmail (`alfalaah.academy.nz@gmail.com`)
2. Click the ⚙️ **Settings** icon → **See all settings**
3. Go to **"Accounts and Import"** tab
4. Under **"Send mail as"**, click **"Add another email address"**
5. A popup window will appear:
   - **Name**: `The FastTrack Madrasah`
   - **Email address**: `admin@tftmadrasah.nz`
   - ☐ **Uncheck** "Treat as an alias"
6. Click **"Next Step"**
7. Choose **"Send through Gmail"** (easier, recommended)
8. Click **"Add Account"**
9. Gmail will send a verification code to `admin@tftmadrasah.nz`
10. Check your Gmail inbox (it will be forwarded from ImprovMX)
11. Enter the verification code
12. Done! ✅

### Option B: Professional Method (Send through SMTP - Resend)

This method uses your existing Resend account for sending, which is more professional.

1. Follow steps 1-6 from Option A
2. Choose **"Send through SMTP server"**
3. Fill in Resend SMTP details:
   - **SMTP Server**: `smtp.resend.com`
   - **Port**: `587`
   - **Username**: `resend`
   - **Password**: Your `RESEND_API_KEY` (get it from Resend dashboard)
   - ☑️ **Check** "Secured connection using TLS"
4. Click **"Add Account"**
5. Gmail will send a verification code
6. Check your Gmail and enter the code
7. Done! ✅

### Set Default "From" Address

1. In Gmail Settings → Accounts and Import
2. Under **"Send mail as"**, find `admin@tftmadrasah.nz`
3. Click **"make default"**

Now when you compose emails in Gmail, they'll appear from `admin@tftmadrasah.nz` by default!

---

## Part 4: Email Signature (Optional)

Add a professional signature to emails sent from the academy:

1. Gmail Settings → General tab
2. Scroll to **"Signature"**
3. Click **"+ Create new"**
4. Name it: "The FastTrack Madrasah"
5. Add your signature:

```
--
The FastTrack Madrasah
Islamic Institute in New Zealand

📧 admin@tftmadrasah.nz
🌐 https://tftmadrasah.nz
```

6. Set it as default for `admin@tftmadrasah.nz`

---

## Summary of What's Set Up

✅ **Sending emails**: Already configured with Resend
✅ **Reply-to address**: All automated emails now include reply-to: admin@tftmadrasah.nz
✅ **Receiving emails**: Set up ImprovMX forwarding to Gmail (once DNS is configured)
✅ **Sending from Gmail**: Use Gmail send-as to reply from admin@tftmadrasah.nz

---

## Troubleshooting

### Emails not forwarding after 24 hours?
- Check DNS records are correct using [mxtoolbox.com](https://mxtoolbox.com/SuperTool.aspx?action=mx%3atftmadrasah.nz)
- Ensure no old MX records exist
- Contact your domain registrar support

### Gmail send-as verification not working?
- Wait a few hours after setting up DNS
- Check spam folder for verification email
- Try "Send through Gmail" option instead

### Students not receiving automated emails?
- All email functions have been updated and deployed
- Check Supabase logs if emails fail to send
- Ensure RESEND_API_KEY is set in Supabase secrets

---

## Next Steps

1. ✅ Complete ImprovMX setup (Parts 1-2)
2. ✅ Configure Gmail send-as (Part 3)
3. ✅ Test by sending email to admin@tftmadrasah.nz
4. ✅ Test by sending email FROM admin@tftmadrasah.nz in Gmail
5. ✅ Update any email addresses on your website to use admin@tftmadrasah.nz

---

## Need Help?

- **ImprovMX Support**: [improvmx.com/guides](https://improvmx.com/guides)
- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **Gmail Send-as**: [support.google.com/mail/answer/22370](https://support.google.com/mail/answer/22370)
