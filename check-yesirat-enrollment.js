import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkYesiratEnrollment() {
  // Find Yesirat's student record
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', '621370')
    .single();

  console.log('\n=== Yesirat Ganiyu - Enrollment Status ===');
  console.log('Student ID:', student.student_id);
  console.log('Name:', student.full_name);
  console.log('Email:', student.email);
  console.log('Status:', student.status);
  console.log('Stripe Customer ID:', student.stripe_customer_id || 'NOT SET');

  // Get enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', student.id);

  console.log('\n--- Enrollments ---');
  if (enrollments && enrollments.length > 0) {
    enrollments.forEach((e, i) => {
      console.log(`\nEnrollment ${i + 1}:`);
      console.log('  Program:', e.program);
      console.log('  Status:', e.status);
      console.log('  Payment Type:', e.payment_type);
      console.log('  Total Fees:', `$${e.total_fees}`);
      console.log('  Total Paid:', `$${e.total_paid}`);
      console.log('  Balance:', `$${e.balance_remaining}`);
      console.log('  Stripe Subscription:', e.stripe_subscription_id || 'NONE');
      console.log('  Enrolled Date:', e.enrolled_date);
    });
  } else {
    console.log('NO ENROLLMENTS FOUND');
  }

  // Get payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', student.id)
    .eq('status', 'verified')
    .order('created_at', { ascending: false });

  console.log('\n--- Payment History ---');
  if (payments && payments.length > 0) {
    console.log(`Total Verified Payments: ${payments.length}`);
    let totalPaid = 0;
    payments.forEach((p, i) => {
      totalPaid += parseFloat(p.amount);
      console.log(`  ${i + 1}. $${p.amount} - ${p.payment_method} - ${new Date(p.verified_at).toLocaleDateString()}`);
    });
    console.log(`Total Amount Paid: $${totalPaid.toFixed(2)}`);
  } else {
    console.log('NO PAYMENTS FOUND');
  }

  // Get schedules (only for active enrollments)
  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const activePrograms = activeEnrollments.map(e => e.program);

  console.log('\n--- Class Schedules (Active Programs Only) ---');
  if (activePrograms.length > 0) {
    const { data: schedules } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('student_id', student.id)
      .in('program', activePrograms);

    console.log(`Total Schedules for Active Programs: ${schedules?.length || 0}`);
    if (schedules && schedules.length > 0) {
      const byProgram = {};
      schedules.forEach(s => {
        if (!byProgram[s.program]) byProgram[s.program] = 0;
        byProgram[s.program]++;
      });
      Object.entries(byProgram).forEach(([program, count]) => {
        console.log(`  ${program}: ${count} classes`);
      });
    }
  } else {
    console.log('NO ACTIVE ENROLLMENTS - SCHEDULES HIDDEN');
  }

  console.log('\n--- Summary ---');
  if (activeEnrollments.length === 0) {
    console.log('⚠️  Student has NO active enrollments');
    console.log('   Schedules will NOT be visible in student portal');
    console.log('   Student must reapply to rejoin');
  } else {
    console.log(`✅ Student has ${activeEnrollments.length} active enrollment(s)`);
    console.log('   Schedules are visible in student portal');
  }
}

checkYesiratEnrollment().catch(console.error);
