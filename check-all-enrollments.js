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

async function checkAllEnrollments() {
  console.log('Checking all enrollments...\n');

  // Check all enrollments
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('*, students(student_id, full_name)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching enrollments:', error);
    return;
  }

  console.log(`Total enrollments fetched: ${enrollments?.length || 0}\n`);

  if (enrollments && enrollments.length > 0) {
    enrollments.forEach((e, i) => {
      console.log(`${i + 1}. ${e.students?.full_name || 'Unknown'} (${e.students?.student_id || 'No ID'})`);
      console.log(`   Program: ${e.program}, Status: ${e.status}`);
      console.log(`   Total Fees: $${e.total_fees}, Balance: $${e.balance_remaining}\n`);
    });
  } else {
    console.log('No enrollments found - might be an RLS issue');
  }

  // Check students with schedules but might not have enrollments
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, student_id, full_name, status')
    .limit(5);

  if (!studentsError && students) {
    console.log('\nChecking first 5 students:');
    for (const student of students) {
      const { data: schedules } = await supabase
        .from('class_schedules')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', student.id);

      const { data: enroll } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', student.id);

      console.log(`- ${student.full_name} (${student.student_id}): Enrollments: ${enroll?.length || 0}`);
    }
  }
}

checkAllEnrollments().catch(console.error);
