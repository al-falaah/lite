// Test script to send welcome email without going through Stripe

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function testWelcomeEmail() {
  console.log('🧪 Testing welcome email function...\n');

  // Replace this email with your actual email to receive the test
  const testEmail = 'scigine.dev@gmail.com'; // <-- CHANGE THIS!

  const payload = {
    studentData: {
      full_name: 'Test Student',
      email: testEmail,
      student_id: '100001',
      program: 'tajweed' // or 'tajweed'
    },
    baseUrl: 'https://alfalaah-academy.nz' // Production URL
  };

  console.log('📤 Sending test email to:', testEmail);
  console.log('📋 Student ID:', payload.studentData.student_id);
  console.log('📚 Program:', payload.studentData.program);
  console.log('');

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-welcome-email`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Success! Welcome email sent.');
      console.log('📧 Check your inbox at:', testEmail);
      console.log('💡 Don\'t forget to check spam folder!');
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testWelcomeEmail();
