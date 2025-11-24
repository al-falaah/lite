# Al-Falaah Lite Version - Implementation Plan

## Overview
Simplifying the app to launch quickly with essential features only. Focus: Admin-centric management system with public application and payment submission.

---

## 1. New App Structure

### Public Routes (No Auth Required)
- `/` - Homepage: FREE Tafseer Course ad + Google Form link
- `/apply` - Public application form
- `/payment` - Public payment proof upload (lookup by email/student number/name)

### Admin Routes (Auth Required)
- `/admin` - Admin login page
- `/admin/dashboard` - Main admin dashboard with tabs:
  - Applications
  - Students (status, schedule, payments)
  - Schedule View (all students by day/time)

---

## 2. Features to Remove

### Code to Delete:
- [ ] Stripe integration (`src/services/stripe.js`, Stripe components)
- [ ] Edge functions (`supabase/functions/create-checkout-session/`, `stripe-webhook/`)
- [ ] Student dashboard (`src/pages/StudentDashboard.jsx`)
- [ ] Student authentication routes
- [ ] Login button from homepage
- [ ] ProtectedRoute for students
- [ ] Cohorts logic and components
- [ ] Weekend/Weekday program enum logic
- [ ] Payment success page for Stripe

### Database to Remove:
- [ ] `cohorts` table
- [ ] `program_type` enum (weekend/weekday)
- [ ] `class_format` enum
- [ ] Stripe-related columns in `payments` table
- [ ] `payment_method` enum values: 'stripe'

---

## 3. Features to Add

### A. Public Payment Upload Page (`/payment`)
**Purpose:** Students upload payment proof without logging in

**Features:**
- Input field: Email OR Student Number OR Full Name
- Lookup student in database
- If found, show: Student name, outstanding balance
- Upload proof of payment (image/PDF)
- Submit and show success message

**Database:**
- Reuse existing `payments` table
- Add lookup capability by email/student_number/full_name

---

### B. Class Schedule Management (Admin)

**Purpose:** Admin sets individual class times for each student

**Features:**
- Each student gets 2 sessions/week:
  - 1x 1.5 hours session
  - 1x 30 minutes session
- Admin can set/update: Day, Time, Duration for each session
- Calendar view showing all students' sessions by day/time

**Database Changes:**
```sql
CREATE TABLE class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL, -- 90 or 30
  session_type TEXT, -- 'main' or 'short'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### C. Email Notifications

**Required Emails:**
1. **Application Received** (to student)
   - Subject: "Application Received - Al-Falaah Islamic Institute"
   - Body: Acknowledge receipt, next steps

2. **Application Approved** (to student)
   - Subject: "Welcome to Al-Falaah! Application Approved"
   - Body: Warm welcome, payment instructions, next steps

3. **Application Rejected** (to student)
   - Subject: "Al-Falaah Application Status"
   - Body: Polite rejection, encouragement

4. **Payment Confirmed** (to student)
   - Subject: "Payment Received - Al-Falaah"
   - Body: Confirm amount, remaining balance if installments

5. **Payment Reminder** (to student)
   - Subject: "Payment Reminder - Al-Falaah"
   - Body: Friendly reminder, amount due, payment instructions

**Implementation:**
- Reuse existing `send-invite-email` edge function pattern
- Create new edge function: `send-notification-email`
- Templates for each email type

---

### D. Enhanced Admin Dashboard

**Applications Tab:**
- List all applications with status filter
- Actions: Approve (send email), Reject (send email)
- View full application details

**Students Tab:**
- List all students with status: enrolled, graduated, dropout
- For each student:
  - View/edit status
  - View/edit class schedule (2 sessions)
  - View payment history
  - View outstanding balance
  - Send payment reminder button

**Schedule View:**
- Weekly calendar showing all students' sessions
- Filter by day
- Click to edit session

**Payments Tab (Keep existing):**
- Review pending payment proofs
- Approve/Reject with email notification

---

## 4. Database Schema Changes

### Students Table - Simplify
```sql
ALTER TABLE students
DROP COLUMN IF EXISTS cohort_id,
DROP COLUMN IF EXISTS program_type,
DROP COLUMN IF EXISTS class_format;

-- Add if not exists
ALTER TABLE students
ADD COLUMN IF NOT EXISTS total_fees DECIMAL(10,2) DEFAULT 4000.00,
ADD COLUMN IF NOT EXISTS payment_plan TEXT DEFAULT 'full', -- 'full' or 'installments'
ADD COLUMN IF NOT EXISTS installments_count INTEGER;
```

### Payments Table - Remove Stripe
```sql
ALTER TABLE payments
DROP COLUMN IF EXISTS stripe_checkout_session_id,
DROP COLUMN IF EXISTS stripe_payment_intent_id,
DROP COLUMN IF EXISTS stripe_payment_method_id,
DROP COLUMN IF EXISTS last_four,
DROP COLUMN IF EXISTS card_brand,
DROP COLUMN IF EXISTS receipt_url;
```

### Add Class Sessions Table
```sql
-- See section 3B above
```

---

## 5. Implementation Order

### Phase 1: Remove (Clean Slate)
1. Remove Stripe files and imports
2. Remove student dashboard files
3. Remove student auth routes
4. Remove cohorts logic
5. Run database cleanup SQL

### Phase 2: Core Features
1. Simplify homepage
2. Create public payment upload page
3. Update admin dashboard structure
4. Add class schedule management

### Phase 3: Email System
1. Create email notification edge function
2. Add email sending to application approval/rejection
3. Add email to payment confirmation
4. Add payment reminder functionality

### Phase 4: Testing & Cleanup
1. Test public application flow
2. Test public payment upload
3. Test admin workflows
4. Remove unused files
5. Update README

---

## 6. Files to Delete

### Components:
- `src/pages/StudentDashboard.jsx`
- `src/pages/PaymentSuccess.jsx`
- `src/components/common/ProtectedRoute.jsx` (for students)

### Services:
- Any Stripe-related code in `src/services/supabase.js`

### Functions:
- `supabase/functions/create-checkout-session/`
- `supabase/functions/stripe-webhook/`

### SQL:
- `supabase/migrations/002_add_stripe_fields.sql` (parts of it)
- All the test/fix SQL files we created

### Docs:
- `STRIPE_SETUP_GUIDE.md`
- `PAYMENT_DEPLOYMENT_GUIDE.md`
- `PAYMENT_SYSTEM_SUMMARY.md`

---

## 7. Success Criteria

✅ Homepage shows only Tafseer course + Google Form link
✅ Public can submit applications without login
✅ Public can upload payment proof without login
✅ Admin can login via `/admin`
✅ Admin can approve/reject applications with email notification
✅ Admin can set 2 class sessions per student
✅ Admin can view weekly schedule of all students
✅ Admin can verify payments and send email confirmation
✅ Admin can see payment history and outstanding balance per student
✅ Admin can send payment reminders
✅ No Stripe code remaining
✅ No student login/dashboard
✅ Clean project structure

---

## Next Steps

Shall I proceed with:
1. **Phase 1 first** - Remove all Stripe and student dashboard code?
2. **Or start fresh** - Would you prefer to see the new homepage design first?

Let me know which approach you'd prefer!