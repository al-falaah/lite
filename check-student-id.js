import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStudent() {
  console.log('🔍 Checking students with email abdulquadrialaka@gmail.com...\n');

  const { data: students, error } = await supabase
    .from('students')
    .select('*')
    .eq('email', 'abdulquadrialaka@gmail.com');

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  if (!students || students.length === 0) {
    console.log('⚠️  No students found');
    return;
  }

  students.forEach((student, i) => {
    console.log(`\nStudent ${i + 1}:`);
    console.log(`  ID (UUID): ${student.id}`);
    console.log(`  Student ID: ${student.student_id}`);
    console.log(`  Full Name: ${student.full_name}`);
    console.log(`  Email: ${student.email}`);
    console.log(`  Status: ${student.status}`);
    console.log(`  Created: ${student.created_at}`);
  });
}

checkStudent().catch(console.error);
