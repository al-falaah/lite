/**
 * Check webhook processing status for recent payments
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWebhookStatus() {
  console.log('🔍 Checking webhook processing status...\n');

  // Check recent students
  console.log('📚 Recent Students:');
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, student_id, full_name, email, status, created_at, stripe_customer_id')
    .order('created_at', { ascending: false })
    .limit(5);

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
  } else {
    students.forEach(s => {
      console.log(`  ${s.status === 'enrolled' ? '✅' : '⏳'} ${s.full_name} (${s.email})`);
      console.log(`     Status: ${s.status} | Student ID: ${s.student_id || 'Not assigned'}`);
      console.log(`     Stripe: ${s.stripe_customer_id || 'No customer ID'}`);
      console.log(`     Created: ${new Date(s.created_at).toLocaleString()}\n`);
    });
  }

  // Check recent enrollments
  console.log('\n📝 Recent Enrollments:');
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('*, students(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (enrollmentsError) {
    console.error('Error fetching enrollments:', enrollmentsError);
  } else {
    enrollments.forEach(e => {
      console.log(`  ${e.status === 'active' ? '✅' : '⏳'} ${e.students.full_name}`);
      console.log(`     Program: ${e.program} | Payment: ${e.payment_type}`);
      console.log(`     Subscription: ${e.stripe_subscription_id || 'None'}`);
      console.log(`     Created: ${new Date(e.created_at).toLocaleString()}\n`);
    });
  }

  // Check recent payments
  console.log('\n💳 Recent Payments:');
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*, students(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (paymentsError) {
    console.error('Error fetching payments:', paymentsError);
  } else {
    payments.forEach(p => {
      console.log(`  ${p.status === 'verified' ? '✅' : '⏳'} $${p.amount} - ${p.students.full_name}`);
      console.log(`     Method: ${p.payment_method} | Status: ${p.status}`);
      console.log(`     Stripe Payment: ${p.stripe_payment_id || 'None'}`);
      console.log(`     Created: ${new Date(p.created_at).toLocaleString()}\n`);
    });
  }

  // Check for pending_payment students
  console.log('\n⏳ Students Waiting for Payment Processing:');
  const { data: pendingStudents, error: pendingError } = await supabase
    .from('students')
    .select('id, student_id, full_name, email, status, stripe_customer_id')
    .eq('status', 'pending_payment')
    .order('created_at', { ascending: false });

  if (pendingError) {
    console.error('Error fetching pending students:', pendingError);
  } else if (pendingStudents.length === 0) {
    console.log('  ✅ No students waiting for payment processing');
  } else {
    pendingStudents.forEach(s => {
      console.log(`  ⚠️  ${s.full_name} (${s.email})`);
      console.log(`     Stripe Customer: ${s.stripe_customer_id || 'Missing!'}`);
      console.log(`     This student may have paid but webhook failed\n`);
    });
  }
}

checkWebhookStatus();
