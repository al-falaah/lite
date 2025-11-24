# 🕌 Al-Falaah Academy - Management System

> A comprehensive web-based platform for managing Islamic education programs, student enrollments, payments, and learning materials.

[![Built with React](https://img.shields.io/badge/React-18.x-61dafb?logo=react)](https://reactjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Email by Resend](https://img.shields.io/badge/Resend-Email-000000)](https://resend.com/)

---

## 📖 Project Vision

Al-Falaah Academy aims to provide accessible, high-quality Islamic education to students worldwide. This management system streamlines the entire student journey from application to graduation, making it easier for both administrators and students to focus on what matters most: learning.

### Core Values
- **Authenticity**: Pristine curriculum based on the Qur'an and Sunnah
- **Accessibility**: Easy-to-use platform for students of all technical abilities
- **Transparency**: Clear communication at every step of the enrollment process
- **Efficiency**: Automated workflows to reduce administrative burden
- **Excellence**: Professional, polished experience worthy of Islamic education

---

## 🎯 Programs Offered

### 1-Year Foundational Certificate
- Duration: 1 year
- Fee: TBC
- Formats: One-on-one or Cohort-based
- Schedule: 2-3 hours per week

### 3-Year Essentials Program
- Duration: 3 years
- Fee: TBC
- Format: Cohort-based only
- Schedule: 4-5 hours per week

---

## ✅ Features Implemented

### 🎓 Student Application & Enrollment

- [x] **Public Application Form**
  - Multi-step form with validation
  - Program selection (Foundational/Essentials)
  - Class format selection (One-on-One/Cohort)
  - Personal information collection
  - Islamic background assessment
  - Payment plan selection
  - Motivation and learning goals

- [x] **Automated Email Notifications**
  - Application confirmation email
  - Approval & invitation email with signup link
  - Welcome email with student ID
  - Professional HTML email templates
  - Powered by Resend API

- [x] **Secure Token-based Signup**
  - Invite-only registration for approved applicants
  - 7-day token expiration
  - Automatic student number generation (AF{YY}{####})
  - Profile creation with application data preservation

### 👨‍💼 Admin Dashboard

- [x] **Application Management**
  - View all applications with filtering (pending, under review, approved, rejected)
  - Application details view with full applicant information
  - Mark applications as "under review"
  - Approve/Reject with admin notes
  - Generate and send invitation links
  - Copy invite links to clipboard

- [x] **Payment Verification Dashboard**
  - View all payments pending verification
  - Display uploaded proof documents (images & PDFs)
  - One-click approve/reject with admin notes
  - Student information and payment details
  - Audit trail (who verified, when, notes)
  - Automatic status updates after verification

- [x] **Security & Access Control**
  - Role-based access (Admin/Student)
  - Row Level Security (RLS) policies
  - Secure authentication with Supabase Auth
  - Protected routes with automatic redirects

### 🎒 Student Dashboard

- [x] **Student Profile**
  - View student ID, program, and enrollment details
  - Personal information display
  - Status tracking

- [x] **Payment Schedule & Processing**
  - View all payment installments
  - Due dates and amounts
  - Payment status (pending, paid, overdue, pending_verification)
  - Total paid and remaining balance
  - Payment plan summary
  - **Dual Payment Options:**
    - **Stripe Card Payment** - Instant confirmation for international students
    - **Manual Bank Transfer** - Zero-fee option for NZ students
  - Upload proof of payment with validation (images & PDFs)
  - Track verification status for manual payments
  - Payment success page with receipt details

- [x] **Applications Tracking**
  - View application history
  - Status updates
  - Admin notes and feedback
  - Rejection reasons (if applicable)

### 🔐 Authentication & Authorization

- [x] **Supabase Authentication**
  - Email/password authentication
  - Session management
  - Password reset functionality
  - Automatic profile creation on signup

- [x] **Row Level Security (RLS)**
  - `is_admin()` function with SECURITY DEFINER
  - Admin-only policies for applications, students, payments
  - Student self-access policies
  - Anonymous access for public application submission
  - Circular dependency prevention

### 💾 Database Architecture

- [x] **Core Tables**
  - `profiles` - User profile information
  - `students` - Enrolled student records
  - `applications` - Application submissions
  - `payments` - Payment schedules and tracking (Stripe + manual)
  - `payment_settings` - Bank account details for manual transfers
  - `cohorts` - Class groupings
  - `lesson_notes` - Teaching materials
  - `attendance` - Class attendance tracking
  - `notifications` - System notifications

- [x] **Advanced Features**
  - Atomic student number generation with PostgreSQL sequences
  - Race condition prevention
  - Automatic profile creation via database triggers
  - Referential integrity with foreign keys

---

## 🚀 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - Icon library
- **React Toastify** - Toast notifications

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security
  - Edge Functions (Deno runtime)
  - Storage buckets for file uploads
- **Stripe** - Payment processing for card payments
- **Resend** - Transactional email service

### Edge Functions
- `send-application-confirmation` - Application received email
- `send-approval-invite` - Invitation email with signup link
- `send-welcome-email` - Welcome email with student ID
- `create-checkout-session` - Stripe checkout session creation
- `stripe-webhook` - Payment webhook handler

### DevOps & Tools
- **Git & GitHub** - Version control
- **Supabase CLI** - Local development and deployment
- **ESLint** - Code linting
- **PostCSS** - CSS processing

---

## 📂 Project Structure

```
alfalaah/
├── src/
│   ├── components/
│   │   └── common/          # Reusable components (Button, Card, Input, etc.)
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication state management
│   ├── pages/
│   │   ├── LandingPage.jsx         # Public homepage
│   │   ├── ApplicationPage.jsx     # Multi-step application form
│   │   ├── LoginPage.jsx           # Login interface
│   │   ├── SignupPage.jsx          # Token-based signup
│   │   ├── AdminDashboard.jsx      # Admin application management
│   │   └── StudentDashboard.jsx    # Student portal
│   ├── services/
│   │   └── supabase.js      # Supabase client and API helpers
│   ├── utils/
│   │   ├── constants.js     # App constants (programs, payment plans)
│   │   └── helpers.js       # Utility functions
│   └── emails/
│       └── templates.js     # Email HTML templates
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   └── email.ts            # Email sending utility
│   │   ├── send-application-confirmation/
│   │   ├── send-invite-email/
│   │   └── send-welcome-email/
│   └── .env                 # Local environment variables (gitignored)
├── schema.sql               # Database schema
└── README.md               # This file
```

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Resend account (for emails)

### 1. Clone the Repository
```bash
git clone https://github.com/al-falaah/al-falaah-alpha.git
cd al-falaah-alpha
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase

#### Local Development
```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Run database migrations
supabase db reset
```

#### Link to Remote Project
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Configure Environment Variables

Create `.env` in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `supabase/.env` for edge functions:
```env
RESEND_API_KEY=your_resend_api_key
APP_URL=http://localhost:5173
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 5. Deploy Edge Functions
```bash
# Set remote secrets
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set APP_URL=https://yourdomain.com
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Deploy functions
supabase functions deploy
```

**Note:** See [PAYMENT_DEPLOYMENT_GUIDE.md](PAYMENT_DEPLOYMENT_GUIDE.md) for detailed payment system setup instructions.

### 6. Run Development Server
```bash
npm run dev
```

Visit http://localhost:5173

---

## 🎯 Roadmap

### ✅ Phase 1: Core Operations (COMPLETED)
- [x] Application form and submission
- [x] Admin dashboard for application review
- [x] Email notification system
- [x] Student enrollment and dashboard
- [x] Payment schedule display

### ✅ Phase 2: Payment Processing (COMPLETED)
- [x] **Hybrid Payment System** - Support for both Stripe and manual bank transfers
- [x] **Stripe Integration** - Card payments for international students
- [x] **Manual Bank Transfer** - Zero-fee option for NZ students
- [x] **Proof of Payment Upload** - File upload system with validation
- [x] **Admin Payment Verification** - Dashboard to approve/reject manual payments
- [x] **Payment Status Tracking** - Real-time status updates
- [x] **Secure Webhooks** - Automatic payment confirmation from Stripe
- [x] **Payment Success Page** - Detailed confirmation with receipt links
- [ ] Payment confirmation emails (TODO)
- [ ] Refund handling (TODO)

### 📋 Phase 3: Enhanced Admin Features (PLANNED)
- [ ] Search and filter applications
- [ ] Bulk approve/reject operations
- [ ] Export data to CSV/Excel
- [ ] Analytics dashboard (conversion rates, revenue)
- [ ] Application comments/notes

### 👥 Phase 4: Student & Learning (PLANNED)
- [ ] Student profile editing
- [ ] Document upload (ID verification)
- [ ] Cohort management system
- [ ] Lesson materials upload and access
- [ ] Attendance tracking
- [ ] Progress reports

### 🎓 Phase 5: Teacher Portal (PLANNED)
- [ ] Teacher dashboard
- [ ] Lesson planning tools
- [ ] Mark attendance
- [ ] Student performance tracking
- [ ] Grading system

### 🔮 Phase 6: Advanced Features (FUTURE)
- [ ] In-app messaging
- [ ] Video lesson integration (Zoom/Google Meet)
- [ ] Quiz and assessment system
- [ ] Certificate generation
- [ ] Mobile app (React Native)
- [ ] SMS notifications

---

## 🔒 Security

### Implemented Security Measures
- ✅ Row Level Security (RLS) on all database tables
- ✅ SECURITY DEFINER functions to prevent circular dependencies
- ✅ Email/password authentication
- ✅ Protected API routes
- ✅ Environment variable encryption
- ✅ Secure token-based signup
- ✅ SQL injection prevention via parameterized queries
- ✅ XSS prevention via React's built-in escaping

### Best Practices
- Never commit `.env` files to version control
- Rotate API keys regularly
- Use strong password requirements
- Implement rate limiting (planned)
- Regular security audits (planned)

---

## 📧 Email System

### Email Templates
1. **Application Confirmation** - Sent on form submission
2. **Invitation Email** - Sent when admin approves
3. **Welcome Email** - Sent after successful enrollment
4. **Payment Reminders** (planned) - Automated before due dates

### Current Sender
- Development: `onboarding@resend.dev`
- Production: Custom domain (setup required)

### Email Deliverability
- Professional HTML templates
- Mobile-responsive design
- SPF/DKIM/DMARC ready for custom domains

---

## 🤝 Contributing

This is a private project for Al-Falaah Academy. For internal team members:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request
5. Request review from project lead

### Commit Message Format
```
<type>: <description>

[optional body]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## 📝 License

Copyright © 2025 Al-Falaah Academy. All rights reserved.

---

## 🙏 Acknowledgments

Built with guidance from Claude Code (Anthropic)

**Tech Partners:**
- [Supabase](https://supabase.com) - Backend infrastructure
- [Resend](https://resend.com) - Email delivery
- [Vercel](https://vercel.com) - Hosting (planned)

---

## 📞 Support

For technical issues or questions:
- Email: admin@alfalaah.co.nz
- GitHub Issues: [Create an issue](https://github.com/al-falaah/al-falaah-alpha/issues)

---

**Last Updated:** November 17, 2025
**Version:** 1.0.0-alpha
**Status:** Active Development