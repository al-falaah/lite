// Sync availability from applications to enrollments
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAvailability() {
  console.log('🔄 Syncing availability from applications to enrollments...\n');

  // Get the student
  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, student_id, email')
    .eq('student_id', '159898')
    .single();

  console.log(`✅ Student: ${student.full_name} (${student.email})\n`);

  // Get all applications for this student (try by email since student_id might not match)
  const { data: applications, error: appError } = await supabase
    .from('applications')
    .select('id, program, status, preferred_days, preferred_times, timezone, availability_notes, email')
    .eq('email', student.email);

  if (appError) {
    console.log('❌ Error fetching applications:', appError.message);
    return;
  }

  if (!applications || applications.length === 0) {
    console.log('⚠️  No applications found for email:', student.email);
    return;
  }

  console.log('📋 Found applications:');
  applications.forEach(app => {
    console.log(`   • ${app.program}: ${app.preferred_days?.join(', ')} | ${app.preferred_times?.join(', ')}`);
  });

  // Get enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, program, application_id')
    .eq('student_id', student.id);

  console.log('\n📚 Updating enrollments:\n');

  for (const enrollment of enrollments) {
    // Find matching application
    const matchingApp = applications.find(app => app.program === enrollment.program);

    if (matchingApp) {
      console.log(`   Updating ${enrollment.program} enrollment...`);

      const { error } = await supabase
        .from('enrollments')
        .update({
          preferred_days: matchingApp.preferred_days,
          preferred_times: matchingApp.preferred_times,
          timezone: matchingApp.timezone || 'Pacific/Auckland',
          availability_notes: matchingApp.availability_notes,
          application_id: matchingApp.id // Also link the application
        })
        .eq('id', enrollment.id);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Updated with: ${matchingApp.preferred_days?.join(', ')} | ${matchingApp.preferred_times?.join(', ')}`);
      }
    } else {
      console.log(`   ⚠️  No matching application found for ${enrollment.program}`);
    }
  }

  console.log('\n✅ Sync complete!\n');

  // Verify the update
  const { data: updatedEnrollments } = await supabase
    .from('enrollments')
    .select('program, preferred_days, preferred_times, application_id')
    .eq('student_id', student.id);

  console.log('🔍 Verification - Updated enrollments:');
  updatedEnrollments.forEach(e => {
    console.log(`   • ${e.program}:`);
    console.log(`     Days: ${e.preferred_days?.join(', ') || 'None'}`);
    console.log(`     Times: ${e.preferred_times?.join(', ') || 'None'}`);
    console.log(`     App ID: ${e.application_id || 'None'}`);
  });
}

syncAvailability().catch(console.error);
