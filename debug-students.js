// Debug script to check students and enrollments
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStudents() {
  console.log('=== DEBUGGING STUDENTS ===\n');
  console.log('Using key type:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON');
  console.log('');

  // Check 1: All students
  console.log('1. Checking all students in database...');
  const { data: allStudents, error: allError } = await supabase
    .from('students')
    .select('*');

  if (allError) {
    console.error('   ❌ Error fetching students:', allError);
  } else {
    console.log(`   ✅ Found ${allStudents?.length || 0} total students`);
    if (allStudents?.length > 0) {
      console.log('   Students:', allStudents.map(s => `${s.student_id} - ${s.full_name} (${s.status})`));
    }
  }
  console.log('');

  // Check 2: Test students specifically
  console.log('2. Checking test students (Fatima & Hassan)...');
  const { data: testStudents, error: testError } = await supabase
    .from('students')
    .select('*')
    .in('email', ['fatima.tajweed@test.com', 'hassan.multi@test.com']);

  if (testError) {
    console.error('   ❌ Error:', testError);
  } else {
    console.log(`   ✅ Found ${testStudents?.length || 0} test students`);
    testStudents?.forEach(s => {
      console.log(`   - ${s.student_id}: ${s.full_name}`);
      console.log(`     Email: ${s.email}`);
      console.log(`     Status: ${s.status}`);
      console.log(`     Created: ${s.created_at}`);
    });
  }
  console.log('');

  // Check 3: Enrollments
  console.log('3. Checking enrollments...');
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('*, students(student_id, full_name)');

  if (enrollError) {
    console.error('   ❌ Error:', enrollError);
  } else {
    console.log(`   ✅ Found ${enrollments?.length || 0} total enrollments`);
    enrollments?.forEach(e => {
      console.log(`   - ${e.students?.student_id}: ${e.program} (${e.status})`);
      console.log(`     Fees: $${e.total_fees}, Paid: $${e.total_paid}, Balance: $${e.balance_remaining}`);
    });
  }
  console.log('');

  // Check 4: Students with enrollments (like the UI query)
  console.log('4. Testing UI query (students with enrollments)...');
  const { data: uiQuery, error: uiError } = await supabase
    .from('students')
    .select(`
      *,
      enrollments (
        id,
        program,
        status,
        enrolled_date,
        total_fees,
        total_paid,
        balance_remaining
      )
    `)
    .eq('status', 'enrolled')
    .order('created_at', { ascending: false });

  if (uiError) {
    console.error('   ❌ Error:', uiError);
  } else {
    console.log(`   ✅ Query returned ${uiQuery?.length || 0} students`);
    uiQuery?.forEach(s => {
      console.log(`   - ${s.student_id}: ${s.full_name}`);
      console.log(`     Enrollments: ${s.enrollments?.length || 0}`);
      s.enrollments?.forEach(e => {
        console.log(`       • ${e.program} (${e.status}) - Paid: $${e.total_paid}/$${e.total_fees}`);
      });
    });

    // Apply same filter as UI
    const filtered = uiQuery?.filter(student =>
      student.enrollments && student.enrollments.length > 0 &&
      student.enrollments.some(e => e.status === 'active')
    );
    console.log(`   ℹ️  After filtering for active enrollments: ${filtered?.length || 0} students`);
  }
  console.log('');

  console.log('=== DEBUG COMPLETE ===');
}

debugStudents();
