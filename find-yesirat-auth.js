import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
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

async function findYesiratAuth() {
  console.log('Searching for Yesirat\'s auth account...\n');

  // Search profiles for Yesirat
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .or('full_name.ilike.%yesirat%,email.ilike.%yesirat%');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`Found ${profiles?.length || 0} matching profiles:`);
  profiles?.forEach(p => {
    console.log(`\n- ID: ${p.id}`);
    console.log(`  Email: ${p.email}`);
    console.log(`  Name: ${p.full_name}`);
    console.log(`  Role: ${p.role}`);
  });

  // Check all students with null user_id
  const { data: orphanStudents } = await supabase
    .from('students')
    .select('id, student_id, full_name, email')
    .is('user_id', null)
    .limit(10);

  console.log(`\n\n Orphan Students (no user_id):`);
  console.log(`Total: ${orphanStudents?.length || 0}`);
  orphanStudents?.forEach(s => {
    console.log(`\n- ${s.full_name} (${s.student_id})`);
    console.log(`  Email: ${s.email}`);
  });
}

findYesiratAuth().catch(console.error);
