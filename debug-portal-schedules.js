import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSchedules() {
  console.log('🔍 Debugging why schedules are not showing in student portal...\n');

  // Get most recent student
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    return;
  }

  console.log('📋 Recent Students:');
  students.forEach(s => {
    console.log(`  - ${s.email} (${s.full_name}) - Status: ${s.status}`);
  });
  console.log('');

  // For the most recent student, check their enrollments
  const recentStudent = students[0];
  console.log(`🎓 Checking enrollments for: ${recentStudent.email}\n`);

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', recentStudent.id);

  if (enrollmentsError) {
    console.error('Error fetching enrollments:', enrollmentsError);
    return;
  }

  console.log('📚 Enrollments:');
  enrollments.forEach(e => {
    console.log(`  - Program: ${e.program}, Status: ${e.status}, Enrolled: ${e.enrolled_date}`);
  });
  console.log('');

  // Check class schedules
  const { data: schedules, error: schedulesError } = await supabase
    .from('class_schedules')
    .select('*')
    .eq('student_id', recentStudent.id);

  if (schedulesError) {
    console.error('Error fetching schedules:', schedulesError);
    return;
  }

  console.log('📅 Class Schedules:');
  if (schedules.length === 0) {
    console.log('  ⚠️  NO SCHEDULES FOUND!');
  } else {
    schedules.forEach(s => {
      console.log(`  - Program: ${s.program}, Year: ${s.academic_year}, Week: ${s.week_number}, Day: ${s.day_of_week}, Time: ${s.class_time}, Status: ${s.status}`);
    });
  }
  console.log('');

  // Simulate the StudentPortal logic
  console.log('🔄 Simulating StudentPortal.jsx logic:');
  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  console.log(`  - Active enrollments: ${activeEnrollments.length}`);

  const activePrograms = activeEnrollments.map(e => e.program);
  console.log(`  - Active programs: [${activePrograms.join(', ')}]`);

  if (activePrograms.length === 0) {
    console.log('  ⚠️  NO ACTIVE PROGRAMS - This is why schedules are not showing!');
    console.log('  💡 The student needs at least one ACTIVE enrollment to see schedules.');
  } else {
    // Try to fetch schedules with the same filter
    const { data: filteredSchedules, error: filteredError } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('student_id', recentStudent.id)
      .in('program', activePrograms)
      .order('academic_year', { ascending: true })
      .order('week_number', { ascending: true });

    console.log(`  - Filtered schedules (matching active programs): ${filteredSchedules?.length || 0}`);

    if (filteredSchedules && filteredSchedules.length > 0) {
      console.log('  ✅ Schedules should be visible in portal!');
    } else {
      console.log('  ⚠️  No schedules match the active programs!');
      console.log('  💡 Possible issue: Schedule program doesn\'t match enrollment program');
    }
  }
}

debugSchedules().catch(console.error);
