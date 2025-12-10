// Clear all schedules for student ID 159898
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearSchedules() {
  console.log('🗑️  Clearing all schedules for student_id 159898...\n');

  // Get the student
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, full_name, student_id')
    .eq('student_id', '159898')
    .single();

  if (studentError) {
    console.error('❌ Error:', studentError.message);
    return;
  }

  console.log(`✅ Found student: ${student.full_name}`);
  console.log(`   Internal ID: ${student.id}`);
  console.log(`   Student ID: ${student.student_id}\n`);

  // Count existing schedules
  const { data: existingSchedules, error: countError } = await supabase
    .from('class_schedules')
    .select('id, program')
    .eq('student_id', student.id);

  if (countError) {
    console.error('❌ Error counting schedules:', countError.message);
    return;
  }

  console.log(`📊 Current schedules: ${existingSchedules.length} total`);

  const essentialsCount = existingSchedules.filter(s => s.program === 'essentials').length;
  const tajweedCount = existingSchedules.filter(s => s.program === 'tajweed').length;

  console.log(`   • Essentials: ${essentialsCount} classes`);
  console.log(`   • Tajweed: ${tajweedCount} classes\n`);

  if (existingSchedules.length === 0) {
    console.log('✅ No schedules to delete!');
    return;
  }

  // Delete all schedules
  const { error: deleteError } = await supabase
    .from('class_schedules')
    .delete()
    .eq('student_id', student.id);

  if (deleteError) {
    console.error('❌ Error deleting schedules:', deleteError.message);
    return;
  }

  console.log(`✅ Successfully deleted all ${existingSchedules.length} schedules!`);
  console.log('');
  console.log('🎉 Student now has a clean slate for testing schedule generation.');
}

clearSchedules().catch(console.error);
