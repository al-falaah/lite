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

async function checkYesirat() {
  console.log('Checking Yesirat Ganiyu (Student ID: 621370)...\n');

  // Check student record
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', '621370')
    .single();

  if (studentError) {
    console.error('Error fetching student:', studentError);
    return;
  }

  console.log('Student Record:', {
    id: student.id,
    student_id: student.student_id,
    full_name: student.full_name,
    status: student.status,
    enrolled_date: student.enrolled_date
  });

  // Check enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', student.id);

  console.log('\nEnrollments:', enrollments?.length || 0);
  if (enrollments && enrollments.length > 0) {
    console.log(enrollments);
  } else {
    console.log('No enrollments found');
  }

  // Check class schedules
  const { data: schedules, error: schedulesError } = await supabase
    .from('class_schedules')
    .select('*')
    .eq('student_id', student.id);

  console.log('\nClass Schedules:', schedules?.length || 0);
  if (schedules && schedules.length > 0) {
    console.log('Has class schedules - should have been backfilled');
  } else {
    console.log('No class schedules - explains why no enrollment was created');
  }
}

checkYesirat().catch(console.error);
