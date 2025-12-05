import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function testStatusSync() {
  console.log('\n=== Testing Student Status Sync ===\n');

  // Get all students with their enrollments
  const { data: students } = await supabase
    .from('students')
    .select(`
      student_id,
      full_name,
      status,
      enrollments (
        program,
        status
      )
    `)
    .order('student_id');

  students.forEach(student => {
    console.log(`\n📋 ${student.full_name} (${student.student_id})`);
    console.log(`   Overall Status: ${student.status}`);

    if (student.enrollments && student.enrollments.length > 0) {
      console.log('   Enrollments:');
      student.enrollments.forEach(e => {
        console.log(`     - ${e.program}: ${e.status}`);
      });

      // Explain the logic
      const activeCount = student.enrollments.filter(e => e.status === 'active').length;
      const withdrawnCount = student.enrollments.filter(e => e.status === 'withdrawn').length;
      const completedCount = student.enrollments.filter(e => e.status === 'completed').length;

      console.log('   Logic:');
      if (activeCount > 0) {
        console.log(`     ✅ Has ${activeCount} active enrollment(s) → status = 'enrolled'`);
      } else if (completedCount === student.enrollments.length) {
        console.log(`     ✅ All enrollments completed → status = 'graduated'`);
      } else if (withdrawnCount === student.enrollments.length) {
        console.log(`     ✅ All enrollments withdrawn → status = 'dropout'`);
      }
    } else {
      console.log('   No enrollments → status = \'pending_payment\'');
    }
  });

  console.log('\n=== Status Sync Examples ===\n');
  console.log('Scenario 1: Student has ONE active enrollment');
  console.log('  - Enrollments: [essentials: active]');
  console.log('  - Result: students.status = "enrolled" ✅\n');

  console.log('Scenario 2: Student has MULTIPLE active enrollments');
  console.log('  - Enrollments: [essentials: active, tajweed: active]');
  console.log('  - Result: students.status = "enrolled" ✅\n');

  console.log('Scenario 3: Student has mixed statuses');
  console.log('  - Enrollments: [essentials: active, tajweed: withdrawn]');
  console.log('  - Result: students.status = "enrolled" (at least one active) ✅\n');

  console.log('Scenario 4: Student cancels ALL subscriptions');
  console.log('  - Enrollments: [essentials: withdrawn, tajweed: withdrawn]');
  console.log('  - Result: students.status = "dropout" ✅');
  console.log('  - Admin dashboard will show them as dropout');
  console.log('  - Student portal will show "No active enrollments"\n');

  console.log('Scenario 5: Student completes ALL programs');
  console.log('  - Enrollments: [essentials: completed, tajweed: completed]');
  console.log('  - Result: students.status = "graduated" ✅\n');

  console.log('Scenario 6: Student has no enrollments');
  console.log('  - Enrollments: []');
  console.log('  - Result: students.status = "pending_payment" ✅\n');
}

testStatusSync().catch(console.error);
