// Test the getCurrentActiveWeekAndYear logic with real data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rkcdamqaptapsrhejdzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrY2RhbXFhcHRhcHNyaGVqZHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3Njk5NDMsImV4cCI6MjA3ODM0NTk0M30.vcAxSA1u9g4WLpJhf9VVuO-SJ-VXuLQKN5i-usaE0vA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the getCurrentActiveWeekAndYear function
function getCurrentActiveWeekAndYear(scheduledClasses, selectedApplicantId) {
  if (!selectedApplicantId) return { year: 1, week: 1 };

  const studentSchedules = scheduledClasses.filter(s => s.student_id === selectedApplicantId);
  if (studentSchedules.length === 0) return { year: 1, week: 1 };

  const weekMap = {};

  studentSchedules.forEach(schedule => {
    const key = `${schedule.academic_year}-${schedule.week_number}`;
    if (!weekMap[key]) {
      weekMap[key] = [];
    }
    weekMap[key].push(schedule);
  });

  // Check Year 1 first
  for (let weekNum = 1; weekNum <= 52; weekNum++) {
    const weekClasses = weekMap[`1-${weekNum}`];
    if (!weekClasses || weekClasses.length === 0) {
      return { year: 1, week: weekNum }; // First week without classes
    }

    const allCompleted = weekClasses.every(c => c.status === 'completed');
    if (!allCompleted) {
      return { year: 1, week: weekNum }; // First incomplete week in Year 1
    }
  }

  // Year 1 complete, check Year 2
  for (let weekNum = 1; weekNum <= 52; weekNum++) {
    const weekClasses = weekMap[`2-${weekNum}`];
    if (!weekClasses || weekClasses.length === 0) {
      return { year: 2, week: weekNum }; // First week without classes in Year 2
    }

    const allCompleted = weekClasses.every(c => c.status === 'completed');
    if (!allCompleted) {
      return { year: 2, week: weekNum }; // First incomplete week in Year 2
    }
  }

  // All 104 weeks completed!
  return { year: 2, week: 52, allComplete: true };
}

async function testLogic() {
  console.log('🧪 Testing getCurrentActiveWeekAndYear logic...\n');

  // Get Yesirat's data
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, email')
    .eq('email', 'ganiyuyesirat@gmail.com')
    .single();

  if (!students) {
    console.error('❌ Student not found');
    return;
  }

  console.log(`Testing with: ${students.full_name} (${students.email})`);

  // Get all schedules
  const { data: schedules } = await supabase
    .from('class_schedules')
    .select('*')
    .eq('student_id', students.id)
    .order('academic_year', { ascending: true })
    .order('week_number', { ascending: true });

  console.log(`\nTotal schedules: ${schedules.length}`);

  // Test the function
  const result = getCurrentActiveWeekAndYear(schedules, students.id);

  console.log(`\n✅ Current Active Week: Year ${result.year}, Week ${result.week}`);

  // Show Week 1 status
  const week1 = schedules.filter(s => s.academic_year === 1 && s.week_number === 1);
  console.log(`\nWeek 1 classes:`);
  week1.forEach(c => {
    console.log(`  - ${c.class_type}: ${c.status}`);
  });

  // Show Week 2 status
  const week2 = schedules.filter(s => s.academic_year === 1 && s.week_number === 2);
  console.log(`\nWeek 2 classes:`);
  week2.forEach(c => {
    console.log(`  - ${c.class_type}: ${c.status}`);
  });

  // Calculate progress
  const progressPercent = Math.round(((result.year - 1) * 52 + result.week - 1) / 104 * 100);
  const weeksCompleted = (result.year - 1) * 52 + result.week - 1;
  console.log(`\nProgress: ${progressPercent}% (${weeksCompleted} of 104 weeks)`);
}

testLogic().catch(console.error);
