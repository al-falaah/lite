import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function linkYesirat() {
  // Get Yesirat's student record
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', '621370')
    .single();

  console.log('Yesirat Student:', student);
  console.log('\nEmail:', student?.email);
  console.log('User ID:', student?.user_id);

  // Search for matching profile by email
  if (student?.email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', student.email)
      .single();

    console.log('\nMatching Profile:');
    if (profile) {
      console.log('- Found!');
      console.log('- Profile ID:', profile.id);
      console.log('- Email:', profile.email);
      console.log('- Name:', profile.full_name);
      
      console.log('\n✅ Need to update student.user_id to:', profile.id);
    } else {
      console.log('- Not found. Yesirat needs to create an account.');
    }
  }

  // Check all profiles
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .order('created_at', { ascending: false })
    .limit(20);

  console.log('\n\nAll Recent Profiles (last 20):');
  allProfiles?.forEach((p, i) => {
    console.log(`${i+1}. ${p.full_name || 'N/A'} - ${p.email} (${p.role})`);
  });
}

linkYesirat().catch(console.error);
