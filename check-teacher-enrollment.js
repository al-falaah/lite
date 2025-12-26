import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeacherAssignment() {
  // Get the test student
  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, enrollments(id, program, status)')
    .eq('student_id', '715030')
    .single();

  console.log('Student:', student.full_name);
  console.log('Enrollments:', student.enrollments);

  // Check teacher assignments for this student
  const { data: assignments } = await supabase
    .from('teacher_assignments')
    .select('program, teacher:teachers(full_name)')
    .eq('student_id', student.id);

  console.log('\nTeacher assignments:', assignments);
}

checkTeacherAssignment();
