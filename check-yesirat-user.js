// Check specific user with ID 159898 (Abdulquadri Alaka)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  console.log('🔍 Checking user with student_id 159898...\n');

  // Get the student
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(`
      *,
      enrollments (
        id,
        program,
        status,
        enrolled_date
      )
    `)
    .eq('student_id', '159898')
    .single();

  if (studentError) {
    console.error('❌ Error:', studentError.message);
    return;
  }

  console.log('✅ Student found:', student.full_name);
  console.log(`   Internal ID: ${student.id}`);
  console.log(`   Student ID: ${student.student_id}`);
  console.log(`   Email: ${student.email}`);
  console.log(`   Status: ${student.status}\n`);

  console.log('📚 Enrollments:');
  if (student.enrollments && student.enrollments.length > 0) {
    student.enrollments.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.program} - ${e.status}`);
    });
  } else {
    console.log('   ⚠️  No enrollments found');
  }

  console.log('\n📊 Checking schedules per program:');

  // Check Essentials schedules
  const { data: essentialsSchedules } = await supabase
    .from('class_schedules')
    .select('id')
    .eq('student_id', student.id)
    .eq('program', 'essentials');

  console.log(`   • Essentials: ${essentialsSchedules?.length || 0} classes`);

  // Check Tajweed schedules
  const { data: tajweedSchedules } = await supabase
    .from('class_schedules')
    .select('id')
    .eq('student_id', student.id)
    .eq('program', 'tajweed');

  console.log(`   • Tajweed: ${tajweedSchedules?.length || 0} classes`);

  // Simulate duplicate check for Tajweed
  console.log('\n🧪 Simulating "Generate Tajweed Schedule" duplicate check:');
  const { data: existingTajweedSchedules, error: checkError } = await supabase
    .from('class_schedules')
    .select('id')
    .eq('student_id', student.id)
    .eq('program', 'tajweed')
    .limit(1);

  if (checkError) {
    console.log('   ❌ Error during check:', checkError.message);
  } else {
    if (existingTajweedSchedules && existingTajweedSchedules.length > 0) {
      console.log('   ❌ WOULD BLOCK: Schedules already exist for Tajweed Program');
    } else {
      console.log('   ✅ WOULD PROCEED: No existing Tajweed schedules found');
      console.log('   ✅ Generation should be allowed!');
    }
  }

  console.log('\n💡 Active enrollments that should appear in dropdown:');
  const activeEnrollments = student.enrollments?.filter(e => e.status === 'active') || [];
  if (activeEnrollments.length > 0) {
    activeEnrollments.forEach(e => {
      const programName = e.program === 'tajweed'
        ? 'Tajweed Program (6 months)'
        : 'Essential Arabic & Islamic Studies (2 years)';
      console.log(`   • ${programName}`);
    });
  } else {
    console.log('   ⚠️  No active enrollments found');
  }
}

checkUser().catch(console.error);
