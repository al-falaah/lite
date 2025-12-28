/**
 * Check student credentials in database
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

async function checkStudentCredentials(studentIdOrEmail) {
  console.log(`\n🔍 Checking credentials for: ${studentIdOrEmail}\n`);

  // Try to find student by student_id or email
  let query = supabase
    .from('students')
    .select('*');

  if (studentIdOrEmail.includes('@')) {
    query = query.eq('email', studentIdOrEmail);
  } else {
    query = query.eq('student_id', studentIdOrEmail);
  }

  const { data: student, error } = await query.single();

  if (error || !student) {
    console.error('❌ Student not found');
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('✅ Student found:\n');
  console.log(`Name: ${student.full_name}`);
  console.log(`Email: ${student.email}`);
  console.log(`Student ID: ${student.student_id || 'Not assigned'}`);
  console.log(`Status: ${student.status}`);
  console.log(`First Login: ${student.first_login}`);
  console.log(`\nPassword Details:`);
  console.log(`  Length: ${student.password?.length || 0}`);
  console.log(`  First 10 chars: ${student.password?.substring(0, 10) || 'N/A'}`);
  console.log(`  Is Hashed: ${student.password?.startsWith('$2') ? 'YES (bcrypt)' : 'NO (plain text)'}`);
  console.log(`  Full Password: ${student.password}`);
  console.log(`\nLogin Credentials:`);
  console.log(`  Student ID: ${student.student_id}`);
  console.log(`  Password: ${student.password?.startsWith('$2') ? '[HASHED - use original password]' : student.password}`);
}

const identifier = process.argv[2] || '881095';
checkStudentCredentials(identifier);
