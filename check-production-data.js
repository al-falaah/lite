// Quick script to check production database state
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rkcdamqaptapsrhejdzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrY2RhbXFhcHRhcHNyaGVqZHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3Njk5NDMsImV4cCI6MjA3ODM0NTk0M30.vcAxSA1u9g4WLpJhf9VVuO-SJ-VXuLQKN5i-usaE0vA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking production database...\n');

  // 1. Check enrolled students
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, student_id, full_name, email, status, enrolled_date')
    .eq('status', 'enrolled')
    .order('enrolled_date', { ascending: false });

  if (studentsError) {
    console.error('❌ Error fetching students:', studentsError);
  } else {
    console.log(`✅ Found ${students.length} enrolled students:`);
    students.forEach(s => {
      console.log(`   - ${s.full_name} (${s.email}) - Student ID: ${s.student_id}`);
    });
  }

  if (students && students.length > 0) {
    // 2. Check schedules for first enrolled student
    const firstStudent = students[0];
    console.log(`\n📅 Checking schedules for ${firstStudent.full_name}...\n`);

    const { data: schedules, error: schedulesError } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('student_id', firstStudent.id)
      .order('academic_year', { ascending: true })
      .order('week_number', { ascending: true });

    if (schedulesError) {
      console.error('❌ Error fetching schedules:', schedulesError);
    } else {
      console.log(`   Total schedules: ${schedules.length}`);

      const completed = schedules.filter(s => s.status === 'completed').length;
      const scheduled = schedules.filter(s => s.status === 'scheduled').length;

      console.log(`   Completed: ${completed}`);
      console.log(`   Scheduled: ${scheduled}`);

      // Check Week 1 specifically
      const week1 = schedules.filter(s => s.academic_year === 1 && s.week_number === 1);
      console.log(`\n   Week 1 schedules (${week1.length}):`);
      week1.forEach(w => {
        console.log(`     - ${w.class_type} (${w.day_of_week} ${w.class_time || 'no time'}): ${w.status}`);
      });

      // Check Week 2
      const week2 = schedules.filter(s => s.academic_year === 1 && s.week_number === 2);
      console.log(`\n   Week 2 schedules (${week2.length}):`);
      week2.forEach(w => {
        console.log(`     - ${w.class_type} (${w.day_of_week} ${w.class_time || 'no time'}): ${w.status}`);
      });

      // Find first incomplete week
      const firstIncomplete = schedules.find(s => s.status === 'scheduled');
      if (firstIncomplete) {
        console.log(`\n   🎯 First incomplete week: Year ${firstIncomplete.academic_year}, Week ${firstIncomplete.week_number}`);
      } else {
        console.log(`\n   🎉 All schedules completed!`);
      }
    }
  }
}

checkData().catch(console.error);
