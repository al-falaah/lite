// Check student enrollments and schedules
import { createClient } from '@supabase/supabase-js';

// Make sure to run this with: VITE_SUPABASE_URL=xxx VITE_SUPABASE_SERVICE_ROLE_KEY=yyy node check-student-enrollments.js
// Or it will pick up from your shell environment if you have them set
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('   Run with:');
  console.error('   VITE_SUPABASE_URL=your-url VITE_SUPABASE_SERVICE_ROLE_KEY=your-key node check-student-enrollments.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStudent() {
  // Get the student - replace with actual student_id or email
  const studentId = '100001'; // Replace with the actual 6-digit student ID

  console.log('🔍 Checking student:', studentId);
  console.log('');

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (studentError) {
    console.error('❌ Error fetching student:', studentError);
    return;
  }

  console.log('✅ Student found:', student.full_name);
  console.log('   Email:', student.email);
  console.log('');

  // Check enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', student.id);

  console.log('📚 Enrollments:');
  if (enrollments && enrollments.length > 0) {
    enrollments.forEach(e => {
      console.log(`   - ${e.program}: ${e.status} (enrolled: ${e.enrolled_date})`);
    });
  } else {
    console.log('   ⚠️  No enrollments found');
  }
  console.log('');

  // Check schedules
  const { data: schedules, error: schedulesError } = await supabase
    .from('class_schedules')
    .select('program')
    .eq('student_id', student.id);

  console.log('📅 Schedules:');
  if (schedules && schedules.length > 0) {
    const programCounts = {};
    schedules.forEach(s => {
      programCounts[s.program] = (programCounts[s.program] || 0) + 1;
    });

    Object.entries(programCounts).forEach(([program, count]) => {
      console.log(`   - ${program}: ${count} classes`);
    });
  } else {
    console.log('   ⚠️  No schedules found');
  }
  console.log('');

  // Check for each enrollment if schedules exist
  if (enrollments && enrollments.length > 0) {
    console.log('🔬 Detailed check:');
    for (const enrollment of enrollments) {
      const { data: programSchedules } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('student_id', student.id)
        .eq('program', enrollment.program)
        .limit(1);

      const hasSchedules = programSchedules && programSchedules.length > 0;
      console.log(`   - ${enrollment.program} (${enrollment.status}): ${hasSchedules ? '✅ Has schedules' : '⚠️  No schedules'}`);
    }
  }
}

checkStudent().catch(console.error);
