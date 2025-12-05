import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function fixYesiratData() {
  console.log('\n=== Fixing Yesirat Data ===\n');

  // Get Yesirat's student record
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', '621370')
    .single();

  console.log('Student:', student.full_name);
  console.log('Email:', student.email);
  console.log('Stripe Customer ID:', student.stripe_customer_id);

  // Get her enrollment
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', student.id);

  if (!enrollments || enrollments.length === 0) {
    console.log('\n❌ No enrollments found!');
    return;
  }

  const enrollment = enrollments[0]; // Get first enrollment
  console.log('\nEnrollment ID:', enrollment.id);
  console.log('Program:', enrollment.program);
  console.log('Current Stripe Subscription ID:', enrollment.stripe_subscription_id || 'NONE');

  // ===================================================
  // OPTION 1: Link to existing Stripe subscription
  // ===================================================
  console.log('\n--- OPTION 1: Link Stripe Subscription ---');
  console.log('If Yesirat has an active Stripe subscription, you need to:');
  console.log('1. Go to Stripe Dashboard');
  console.log('2. Find her subscription (search by email: ' + student.email + ')');
  console.log('3. Copy the subscription ID (starts with "sub_")');
  console.log('4. Run this command:');
  console.log('\nnode -e "');
  console.log('import { createClient } from \'@supabase/supabase-js\';');
  console.log('const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);');
  console.log(`await supabase.from('enrollments').update({ stripe_subscription_id: 'sub_PASTE_HERE' }).eq('id', '${enrollment.id}');`);
  console.log('console.log(\'Done!\');');
  console.log('"\n');

  // ===================================================
  // OPTION 2: Manually record her $25 payment
  // ===================================================
  console.log('\n--- OPTION 2: Record $25 Payment Manually ---');
  console.log('To record her $25 payment in the database:\n');

  const shouldRecordPayment = true; // Set to true to actually record the payment

  if (shouldRecordPayment) {
    console.log('Recording $25 payment...');

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: student.id,
        enrollment_id: enrollment.id,
        amount: 25.00,
        payment_method: 'stripe',
        status: 'verified',
        academic_year: 1,
        stripe_payment_id: 'manual_entry_' + Date.now(),
        verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.log('❌ Error recording payment:', paymentError.message);
    } else {
      console.log('✅ Payment recorded!');
      console.log('Payment ID:', payment.id);
      console.log('Amount: $25.00');

      // Check updated enrollment
      const { data: updatedEnrollment } = await supabase
        .from('enrollments')
        .select('total_paid, balance_remaining')
        .eq('id', enrollment.id)
        .single();

      console.log('\nUpdated Enrollment:');
      console.log('Total Paid: $' + updatedEnrollment.total_paid);
      console.log('Balance: $' + updatedEnrollment.balance_remaining);
    }
  }

  // ===================================================
  // OPTION 3: Generate class schedules
  // ===================================================
  console.log('\n--- OPTION 3: Generate Class Schedules ---');

  // Check if schedules exist
  const { data: schedules } = await supabase
    .from('class_schedules')
    .select('id')
    .eq('student_id', student.id);

  console.log('Current schedules:', schedules?.length || 0);

  if (!schedules || schedules.length === 0) {
    console.log('\nTo generate schedules, you need to:');
    console.log('1. Check if you have a schedule generation function');
    console.log('2. Or manually create schedules for this student');
    console.log('3. Schedules should include: program, week_number, class_date, etc.');
  }

  console.log('\n=== Summary ===');
  console.log('To fully fix Yesirat\'s data:');
  console.log('1. ✅ Record her $25 payment (done if shouldRecordPayment = true)');
  console.log('2. ⚠️  Link her Stripe subscription ID (if subscription still active)');
  console.log('3. ⚠️  Generate her class schedules');
}

fixYesiratData().catch(console.error);
