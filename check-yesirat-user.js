import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function checkYesiratUser() {
  console.log('Checking Yesirat\'s user and enrollment linkage...\n');

  // Get student record with user_id
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, student_id, full_name, user_id')
    .eq('student_id', '621370')
    .single();

  if (studentError) {
    console.error('Error fetching student:', studentError);
    return;
  }

  console.log('Student Record:');
  console.log('- ID:', student.id);
  console.log('- Student ID:', student.student_id);
  console.log('- Full Name:', student.full_name);
  console.log('- User ID:', student.user_id);

  // Check if user exists in profiles
  if (student.user_id) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', student.user_id)
      .single();

    console.log('\nProfile/Auth Record:');
    if (profileError) {
      console.log('- ERROR:', profileError.message);
    } else {
      console.log('- Email:', profile.email);
      console.log('- Role:', profile.role);
    }
  } else {
    console.log('\n⚠️  WARNING: Student has no user_id! This means they can\'t log in.');
  }

  // Try to get enrollments as anon (should fail)
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', student.id);

  console.log('\nEnrollments (via anon key):');
  if (enrollError) {
    console.log('- ERROR:', enrollError.message);
  } else {
    console.log('- Count:', enrollments?.length || 0);
  }
}

checkYesiratUser().catch(console.error);
