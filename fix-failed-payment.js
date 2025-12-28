/**
 * Manually process enrollment for student whose payment succeeded but webhook failed
 * This simulates what the webhook should have done
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate password function (matching webhook logic)
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function fixFailedPayment(studentEmail) {
  console.log(`\n🔧 Processing failed payment for: ${studentEmail}\n`);

  // Find the student
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('email', studentEmail)
    .single();

  if (studentError || !student) {
    console.error('❌ Student not found:', studentEmail);
    process.exit(1);
  }

  console.log(`Found student: ${student.full_name} (ID: ${student.id})`);
  console.log(`Current status: ${student.status}`);
  console.log(`Stripe Customer ID: ${student.stripe_customer_id || 'None'}\n`);

  if (student.status !== 'pending_payment') {
    console.log(`✅ Student status is already "${student.status}". No action needed.`);
    return;
  }

  // Generate student ID
  console.log('Generating student ID...');
  const { data: studentId, error: idError } = await supabase
    .rpc('generate_random_student_id');

  if (idError || !studentId) {
    console.error('❌ Failed to generate student ID:', idError);
    process.exit(1);
  }

  console.log(`✅ Generated student ID: ${studentId}`);

  // Generate password
  const password = generatePassword();
  console.log(`✅ Generated password: ${password}`);

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(`✅ Password hashed`);

  // Update student
  console.log('\nUpdating student record...');
  const { error: updateError } = await supabase
    .from('students')
    .update({
      student_id: studentId,
      password: hashedPassword,
      status: 'enrolled'
    })
    .eq('id', student.id);

  if (updateError) {
    console.error('❌ Failed to update student:', updateError);
    process.exit(1);
  }

  console.log('✅ Student updated to enrolled status\n');

  // Create enrollment (assuming essentials program)
  const program = 'essentials'; // Change if needed
  const planType = 'monthly'; // Change if needed

  console.log(`Creating enrollment for ${program} program...`);

  // Find application
  const { data: application } = await supabase
    .from('applications')
    .select('id')
    .eq('email', student.email)
    .eq('program', program)
    .eq('status', 'approved')
    .single();

  const { data: enrollmentId, error: enrollmentError } = await supabase
    .rpc('create_enrollment', {
      p_student_id: student.id,
      p_program: program,
      p_payment_type: planType,
      p_application_id: application?.id || null
    });

  if (enrollmentError) {
    console.error('❌ Failed to create enrollment:', enrollmentError);
    process.exit(1);
  }

  console.log(`✅ Enrollment created (ID: ${enrollmentId})\n`);

  // Create payment record
  const amount = planType === 'monthly' ? 25 : (planType === 'annual' ? 275 : 120);

  console.log('Creating payment record...');
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      student_id: student.id,
      enrollment_id: enrollmentId,
      amount: amount,
      payment_method: 'stripe',
      status: 'verified',
      academic_year: 1,
      verified_at: new Date().toISOString()
    });

  if (paymentError) {
    console.error('❌ Failed to create payment record:', paymentError);
  } else {
    console.log('✅ Payment record created\n');
  }

  // Send welcome email
  console.log('Sending welcome email...');
  const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
    body: {
      studentData: {
        full_name: student.full_name,
        email: student.email,
        student_id: studentId,
        program: program,
        password: password // Send plain text password in email
      },
      baseUrl: 'https://tftmadrasah.nz'
    }
  });

  if (emailError) {
    console.error('⚠️  Failed to send welcome email:', emailError);
    console.log('\n📧 Manual credentials to send:');
    console.log(`   Student ID: ${studentId}`);
    console.log(`   Password: ${password}`);
  } else {
    console.log('✅ Welcome email sent!\n');
  }

  console.log('✨ Student enrollment completed successfully!\n');
  console.log('Summary:');
  console.log(`  Student: ${student.full_name} (${student.email})`);
  console.log(`  Student ID: ${studentId}`);
  console.log(`  Password: ${password}`);
  console.log(`  Program: ${program}`);
  console.log(`  Status: enrolled`);
}

// Get email from command line or use default
const studentEmail = process.argv[2] || 'abdulquadrialaka@gmail.com';
fixFailedPayment(studentEmail);
