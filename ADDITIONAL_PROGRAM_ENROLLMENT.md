# Additional Program Enrollment Feature

## Overview

Existing students can now enroll in additional programs through a streamlined process that auto-fills their information and only requires program selection and payment.

---

## How It Works

### For New Students (First-Time Applicants)
1. Visit `/apply` (regular application form)
2. Fill out complete application form
3. Submit and pay via Stripe
4. Get enrolled in selected program

### For Existing Students (Adding Programs)
1. Login to Student Portal (`/student`)
2. See "Apply for Another Program" button (only if not enrolled in all programs)
3. Click button → redirected to `/enroll-additional?email=their-email`
4. See auto-filled information (read-only):
   - Full Name
   - Email
   - Phone
   - Student ID
5. Select new program:
   - Islamic Essentials (if not enrolled)
   - Tajweed Mastery (if not enrolled)
6. Choose payment plan
7. Proceed to Stripe checkout
8. Get enrolled in new program

---

## Key Features

### Auto-Filled Student Information
All personal details are auto-filled from the database:
- Full Name ✅ (read-only)
- Email ✅ (read-only)
- Phone ✅ (read-only)
- Student ID ✅ (read-only)

Students cannot edit this information for security.

### Current Enrollments Display
Shows what programs they're already enrolled in:
- Program name
- Enrollment status (active/withdrawn)

### Smart Program Selection
Only shows programs they're NOT already enrolled in:
- If enrolled in essentials → only shows tajweed
- If enrolled in tajweed → only shows essentials
- If enrolled in both → button doesn't appear in student portal

### Payment Integration
- Connects to existing Stripe checkout
- Passes `program` metadata to webhook
- Webhook creates new enrollment for that program
- Links Stripe subscription to specific enrollment

---

## User Flow Example

**Scenario: Student enrolled in Essentials wants to add Tajweed**

1. Student logs into portal with `ganiyuyesirat@gmail.com`
2. Sees "Expand Your Learning" card with "Apply for Another Program" button
3. Clicks button → goes to `/enroll-additional?email=ganiyuyesirat@gmail.com`
4. Page loads and shows:
   ```
   Your Information (locked):
   - Full Name: Yesirat Ganiyu
   - Email: ganiyuyesirat@gmail.com
   - Phone: +1234567890
   - Student ID: 621370

   Current Enrollments:
   - Islamic Essentials [active]

   Select New Program:
   ○ Tajweed Mastery - $120 one-time
   ```
5. Selects Tajweed
6. Clicks "Proceed to Payment"
7. Redirected to Stripe checkout ($120)
8. Completes payment
9. Webhook receives event with `program: 'tajweed'`
10. System creates new enrollment:
    ```
    enrollments:
      - student_id: ...
        program: 'essentials'
        status: 'active'
        stripe_subscription_id: 'sub_123'
      - student_id: ...
        program: 'tajweed'  ← NEW
        status: 'active'
        stripe_subscription_id: 'sub_456'
    ```
11. Student now sees schedules for both programs in portal

---

## Implementation Files

### New Page
- **src/pages/EnrollAdditionalProgram.jsx** - Streamlined enrollment page for existing students

### Updated Files
- **src/App.jsx** - Added route `/enroll-additional`
- **src/pages/StudentPortal.jsx** - Updated button link to pass email parameter

### Webhook Integration
- **supabase/functions/stripe-webhook/index.ts** - Already handles multi-program enrollments
- Receives `program` metadata from checkout session
- Creates enrollment for specific program
- Links Stripe subscription to that enrollment

---

## Differences from Regular Application

| Feature | New Student | Existing Student |
|---------|-------------|------------------|
| Route | `/apply` | `/enroll-additional` |
| Personal Info | Manual entry | Auto-filled (read-only) |
| Program Selection | All programs | Only unenrolled programs |
| Creates New Student | Yes | No |
| Creates New Enrollment | Yes | Yes |
| Student ID | Generated on payment | Already exists |

---

## Security & Validation

1. **Email Validation**: Page checks if email exists in database
2. **Redirect if Not Found**: Sends to `/apply` if student doesn't exist
3. **Enrollment Check**: Verifies student isn't already in all programs
4. **Read-Only Fields**: Personal info cannot be edited
5. **Stripe Metadata**: Passes student_id and program to ensure correct enrollment

---

## Future Enhancements

- Allow students to update their phone/address (with verification)
- Show payment history for all enrollments
- Allow re-enrollment in withdrawn programs
- Bundle pricing for multiple programs

---

## Testing

To test the feature:

```bash
# 1. Login to student portal
Visit: http://localhost:5173/student
Email: existing-student@example.com

# 2. Click "Apply for Another Program"

# 3. Verify:
- Student info is auto-filled and read-only
- Only shows programs they're not enrolled in
- Payment process works correctly
- New enrollment appears in database
- Schedules for new program appear in portal
```
