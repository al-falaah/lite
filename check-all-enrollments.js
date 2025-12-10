// Check all student enrollments and schedules
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('   Run with:');
  console.error('   VITE_SUPABASE_URL=your-url VITE_SUPABASE_SERVICE_ROLE_KEY=your-key node check-all-enrollments.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllStudents() {
  console.log('🔍 Checking all students and their enrollments...\n');

  // Get all students
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  if (studentsError) {
    console.error('❌ Error fetching students:', studentsError);
    return;
  }

  if (!students || students.length === 0) {
    console.log('⚠️  No students found in database');
    return;
  }

  console.log(`📊 Found ${students.length} student(s)\n`);
  console.log('='.repeat(80));

  for (const student of students) {
    console.log(`\n👤 Student: ${student.full_name}`);
    console.log(`   Student ID: ${student.student_id}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   Status: ${student.status}`);

    // Get enrollments for this student
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', student.id);

    if (enrollments && enrollments.length > 0) {
      console.log(`\n   📚 Enrollments (${enrollments.length}):`);
      for (const enrollment of enrollments) {
        console.log(`      • ${enrollment.program}: ${enrollment.status}`);

        // Check schedules for this program
        const { data: schedules, error: schedulesError } = await supabase
          .from('class_schedules')
          .select('id, week_number')
          .eq('student_id', student.id)
          .eq('program', enrollment.program);

        if (schedules && schedules.length > 0) {
          const weeks = [...new Set(schedules.map(s => s.week_number))].sort((a, b) => a - b);
          console.log(`        → Has ${schedules.length} classes (weeks: ${weeks.join(', ')})`);
        } else {
          console.log(`        → ⚠️  NO SCHEDULES for ${enrollment.program}`);
        }
      }
    } else {
      console.log(`   ⚠️  No enrollments`);
    }

    console.log('\n' + '-'.repeat(80));
  }

  console.log('\n✅ Check complete!');
}

checkAllStudents().catch(console.error);
