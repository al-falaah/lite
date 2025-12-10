import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateEnrollments() {
  console.log('📝 Manually updating enrollments with availability data...\n');

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('student_id', '159898')
    .single();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, program')
    .eq('student_id', student.id);

  for (const enrollment of enrollments) {
    let days, times, notes;

    if (enrollment.program === 'essentials') {
      days = ['Saturday', 'Sunday'];
      times = ['Morning', 'Afternoon', 'Evening', 'Night'];
      notes = 'Flexible schedule, prefers weekends';
    } else if (enrollment.program === 'tajweed') {
      days = ['Sunday', 'Wednesday'];
      times = ['Evening', 'Morning'];
      notes = 'Prefers evening classes on weekdays';
    }

    console.log(`Updating ${enrollment.program}...`);
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        preferred_days: days,
        preferred_times: times,
        timezone: 'Pacific/Auckland',
        availability_notes: notes
      })
      .eq('id', enrollment.id)
      .select();

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`   Details:`, error);
    } else {
      console.log(`✅ Updated successfully`);
      console.log(`   Days: ${days.join(', ')}`);
      console.log(`   Times: ${times.join(', ')}`);
    }
    console.log('');
  }

  console.log('🔍 Verification:');
  const { data: verify } = await supabase
    .from('enrollments')
    .select('program, preferred_days, preferred_times, availability_notes')
    .eq('student_id', student.id);

  verify.forEach(e => {
    console.log(`\n${e.program}:`);
    console.log(`  Days: ${e.preferred_days ? e.preferred_days.join(', ') : 'None'}`);
    console.log(`  Times: ${e.preferred_times ? e.preferred_times.join(', ') : 'None'}`);
    console.log(`  Notes: ${e.availability_notes || 'None'}`);
  });
}

updateEnrollments().catch(console.error);
