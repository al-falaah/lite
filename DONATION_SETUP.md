# Donation Link Setup Guide

## Overview
A "Donate" button has been added to strategic locations across the Al-Falaah Academy website, linking directly to Stripe for donations.

## Locations Where Donate Button Appears

### 1. Landing Page (LandingPage.jsx)
- **Navigation Bar (Desktop)**: Between "Programs" and "Apply Now" with a heart icon
- **Navigation Bar (Mobile)**: In the mobile menu dropdown
- **CTA Section**: Alongside "Apply Now" and "Student Portal" buttons
- **Footer**: In the Quick Links section as "Support Our Mission"

### 2. 404 Error Page (NotFoundPage.jsx)
- **Quick Links Section**: Listed with other navigation links

## Button Design
- **Icon**: Heart icon (lucide-react)
- **Colors**: 
  - Hover effect: Rose/pink tint to stand out from emerald theme
  - Desktop nav: White text with rose hover
  - Footer: Gray text with rose hover
- **Opens in new tab**: All donation links open externally

## Setup Instructions

### Step 1: Create Stripe Donation Link
1. Log in to your Stripe Dashboard
2. Navigate to **Products** → **Payment Links**
3. Click **Create payment link**
4. Configure your donation product:
   - Name: "Support Al-Falaah Academy"
   - Description: "Help us provide authentic Islamic education"
   - Set up either:
     - **Fixed amount** (e.g., $10, $25, $50 options), OR
     - **Customer chooses amount** (recommended for donations)
5. Enable **Tax collection** if required in NZ
6. Copy the generated payment link (format: `https://donate.stripe.com/xxxxx`)

### Step 2: Add Link to Environment Variables
1. Open your `.env` file
2. Add the following line:
   ```
   VITE_STRIPE_DONATION_LINK=https://donate.stripe.com/your-actual-link-here
   ```
3. Replace `your-actual-link-here` with your actual Stripe payment link
4. Save the file

### Step 3: Update Production Environment
For deployment (Vercel, Netlify, etc.):
1. Go to your hosting dashboard
2. Navigate to Environment Variables
3. Add:
   - **Key**: `VITE_STRIPE_DONATION_LINK`
   - **Value**: Your Stripe payment link
4. Redeploy your application

### Step 4: Test the Integration
1. Restart your development server: `npm run dev`
2. Visit your website
3. Click any "Donate" or "Support Us" button
4. Verify it opens your Stripe donation page in a new tab
5. Test a small donation to confirm the flow works

## Customization Options

### Change Button Text
In `LandingPage.jsx` and `NotFoundPage.jsx`, you can modify:
- Navigation: Currently "Donate"
- CTA Section: Currently "Support Us"
- Footer: Currently "Support Our Mission"

### Change Button Colors
Modify the hover color classes:
- Current: `hover:text-rose-400` (rose/pink)
- Options: `hover:text-emerald-400`, `hover:text-blue-400`, etc.

### Add More Locations
The donation link is stored in the `donationLink` constant and can be reused anywhere on the site.

## Fallback
If the environment variable is not set, the link defaults to:
```
https://donate.stripe.com/your-link
```
This will result in a Stripe 404 page. Make sure to set the actual link!

## Files Modified
1. `.env.example` - Added `VITE_STRIPE_DONATION_LINK` template
2. `src/pages/LandingPage.jsx` - Added donate buttons in nav, CTA, and footer
3. `src/pages/NotFoundPage.jsx` - Added donate link in quick links

## Notes
- All links open in new tab (`target="_blank"`)
- Security attributes included (`rel="noopener noreferrer"`)
- Responsive design works on mobile and desktop
- Heart icon provides visual distinction from other navigation items
