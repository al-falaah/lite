import fetch from 'node-fetch';

const SUPABASE_URL = 'https://rkcdamqaptapsrhejdzm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrY2RhbXFhcHRhcHNyaGVqZHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3Njk5NDMsImV4cCI6MjA3ODM0NTk0M30.vcAxSA1u9g4WLpJhf9VVuO-SJ-VXuLQKN5i-usaE0vA';

try {
  // Get the enrollment we just changed to active
  const response = await fetch(`${SUPABASE_URL}/rest/v1/enrollments?id=eq.f637e152-923e-4d18-be57-eedf0e6ef701&select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    }
  });

  const enrollments = await response.json();
  
  if (enrollments && enrollments.length > 0) {
    const enrollment = enrollments[0];
    console.log('Current Enrollment Status:');
    console.log('========================');
    console.log('Status:', enrollment.status);
    console.log('Student ID:', enrollment.student_id);
    console.log('Program:', enrollment.program);
    console.log('Subscription ID:', enrollment.stripe_subscription_id);
    console.log('\nAdmin Notes:');
    console.log(enrollment.admin_notes || '(No notes)');
    
    // Get student info
    const studentResponse = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${enrollment.student_id}&select=full_name,email,student_id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const students = await studentResponse.json();
    if (students && students.length > 0) {
      console.log('\nStudent Info:');
      console.log('Name:', students[0].full_name);
      console.log('Email:', students[0].email);
      console.log('Student ID:', students[0].student_id);
    }
  }
} catch (err) {
  console.error('Error:', err);
}
