// Check application availability data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkApplications() {
  console.log('🔍 Checking applications for student_id 159898...\n');

  // Get the student
  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, student_id')
    .eq('student_id', '159898')
    .single();

  console.log(`✅ Student: ${student.full_name}\n`);

  // Get applications
  const { data: applications } = await supabase
    .from('applications')
    .select('id, program, status, preferred_days, preferred_times, timezone, availability_notes')
    .eq('student_id', student.id);

  console.log('📋 Applications:');
  if (applications && applications.length > 0) {
    applications.forEach((app, i) => {
      console.log(`\n   ${i + 1}. ${app.program} - ${app.status}`);
      console.log(`      ID: ${app.id}`);
      console.log(`      Preferred Days: ${app.preferred_days ? app.preferred_days.join(', ') : 'None'}`);
      console.log(`      Preferred Times: ${app.preferred_times ? app.preferred_times.join(', ') : 'None'}`);
      console.log(`      Timezone: ${app.timezone || 'Not set'}`);
      console.log(`      Notes: ${app.availability_notes || 'None'}`);
    });
  } else {
    console.log('   ⚠️  No applications found');
  }

  // Get enrollments with application_id
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, program, application_id, preferred_days, preferred_times')
    .eq('student_id', student.id);

  console.log('\n\n📚 Enrollments with application links:');
  if (enrollments && enrollments.length > 0) {
    enrollments.forEach((e, i) => {
      console.log(`\n   ${i + 1}. ${e.program}`);
      console.log(`      Enrollment ID: ${e.id}`);
      console.log(`      Application ID: ${e.application_id || 'None'}`);
      console.log(`      Has preferred_days: ${e.preferred_days ? 'Yes' : 'No'}`);
      console.log(`      Has preferred_times: ${e.preferred_times ? 'Yes' : 'No'}`);
    });
  }
}

checkApplications().catch(console.error);
