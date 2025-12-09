// Setup multi-program test data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestData() {
  console.log('Setting up multi-program test data...\n');

  try {
    // Delete existing test students first
    await supabase.from('students').delete().in('email', ['fatima.tajweed@test.com', 'hassan.multi@test.com']);

    console.log('Scenario 1: Creating Fatima Ahmed (Tajweed only)...');

    const { data: fatima, error: fatimaError } = await supabase
      .from('students')
      .insert({
        student_id: 'STUD-TAJWEED-001',
        full_name: 'Fatima Ahmed',
        email: 'fatima.tajweed@test.com',
        phone: '+64 21 123 4567',
        date_of_birth: '1995-03-15',
        status: 'enrolled'
      })
      .select()
      .single();

    if (fatimaError) throw fatimaError;
    console.log('   Created student:', fatima.full_name);

    const { error: fatimaEnrollError } = await supabase
      .from('enrollments')
      .insert({
        student_id: fatima.id,
        program: 'tajweed',
        status: 'active',
        enrolled_date: new Date().toISOString().split('T')[0],
        program_duration_months: 6,
        total_fees: 120,
        payment_type: 'one-time'
      });

    if (fatimaEnrollError) throw fatimaEnrollError;
    console.log('   Enrolled in Tajweed program\n');

    console.log('Scenario 2: Creating Hassan Ibrahim (Essentials + Tajweed)...');

    const { data: hassan, error: hassanError } = await supabase
      .from('students')
      .insert({
        student_id: 'STUD-MULTI-002',
        full_name: 'Hassan Ibrahim',
        email: 'hassan.multi@test.com',
        phone: '+64 21 234 5678',
        date_of_birth: '1998-07-22',
        status: 'enrolled'
      })
      .select()
      .single();

    if (hassanError) throw hassanError;
    console.log('   Created student:', hassan.full_name);

    const { error: hassanEssentialsError } = await supabase
      .from('enrollments')
      .insert({
        student_id: hassan.id,
        program: 'essentials',
        status: 'active',
        enrolled_date: new Date().toISOString().split('T')[0],
        program_duration_months: 24,
        total_fees: 550,
        payment_type: 'annual'
      });

    if (hassanEssentialsError) throw hassanEssentialsError;
    console.log('   Enrolled in Essentials program');

    const { error: hassanTajweedError } = await supabase
      .from('enrollments')
      .insert({
        student_id: hassan.id,
        program: 'tajweed',
        status: 'active',
        enrolled_date: new Date().toISOString().split('T')[0],
        program_duration_months: 6,
        total_fees: 120,
        payment_type: 'one-time'
      });

    if (hassanTajweedError) throw hassanTajweedError;
    console.log('   Enrolled in Tajweed program\n');

    console.log('Scenario 3: Enrolling Fatima in Essentials (now has both)...');

    const { error: fatimaEssentialsError } = await supabase
      .from('enrollments')
      .insert({
        student_id: fatima.id,
        program: 'essentials',
        status: 'active',
        enrolled_date: new Date().toISOString().split('T')[0],
        program_duration_months: 24,
        total_fees: 550,
        payment_type: 'annual'
      });

    if (fatimaEssentialsError) throw fatimaEssentialsError;
    console.log('   Fatima now enrolled in both Tajweed + Essentials\n');

    console.log('===== Test Data Created Successfully! =====\n');
    console.log('Test Students:');
    console.log('  1. Fatima Ahmed (STUD-TAJWEED-001) - Tajweed + Essentials');
    console.log('  2. Hassan Ibrahim (STUD-MULTI-002) - Essentials + Tajweed\n');
    console.log('Next steps:');
    console.log('  1. Go to Admin Dashboard');
    console.log('  2. Navigate to Class Availability & Scheduling tab');
    console.log('  3. Switch to Students view');
    console.log('  4. Select Fatima or Hassan to test scheduling\n');

  } catch (error) {
    console.error('Error setting up test data:', error);
    process.exit(1);
  }
}

setupTestData();
