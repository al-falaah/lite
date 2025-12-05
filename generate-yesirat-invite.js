import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function generateInvite() {
  const { data: student } = await supabase
    .from('students')
    .select('*, applications(*)')
    .eq('student_id', '621370')
    .single();

  console.log('\n=== Yesirat Invite Status ===');
  console.log('Email:', student.email);
  console.log('Application ID:', student.application_id);

  if (student.applications) {
    console.log('\nApplication Status:', student.applications.status);
    console.log('Invite Token:', student.applications.invite_token || 'NOT GENERATED');
    console.log('Invite Sent At:', student.applications.invite_sent_at || 'NEVER');
    console.log('Invite Expires:', student.applications.invite_expires_at || 'N/A');

    if (student.applications.invite_token) {
      const baseUrl = envVars.VITE_APP_URL || 'https://yourdomain.com';
      const inviteUrl = `${baseUrl}/signup?token=${student.applications.invite_token}`;
      console.log('\n✅ INVITATION LINK:');
      console.log(inviteUrl);
      console.log('\nSend this link to:', student.email);
    } else {
      console.log('\n❌ No invite token. Generate one from the admin dashboard.');
    }
  } else {
    console.log('\n❌ No application found');
  }
}

generateInvite().catch(console.error);
