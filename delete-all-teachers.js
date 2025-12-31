import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteAllTeachers() {
  console.log('🔍 Fetching all teachers...\n');

  // Get all teachers
  const { data: teachers, error: fetchError } = await supabase
    .from('teachers')
    .select('*');

  if (fetchError) {
    console.error('❌ Error fetching teachers:', fetchError);
    return;
  }

  if (!teachers || teachers.length === 0) {
    console.log('✅ No teachers found in database');
    return;
  }

  console.log(`📋 Found ${teachers.length} teacher(s):\n`);
  teachers.forEach((teacher, index) => {
    console.log(`${index + 1}. ${teacher.full_name} (${teacher.email}) - Staff ID: ${teacher.staff_id}`);
  });

  console.log('\n⚠️  This will delete:');
  console.log('   - Teacher records from teachers table');
  console.log('   - Profile records from profiles table');
  console.log('   - Auth users from Supabase Auth');
  console.log('   - Any associated data\n');

  // In a script, we'll just proceed (remove this check if you want manual confirmation)
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    rl.question('Are you sure you want to delete ALL teachers? (yes/no): ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Deletion cancelled');
    return;
  }

  console.log('\n🗑️  Starting deletion process...\n');

  let successCount = 0;
  let failCount = 0;

  for (const teacher of teachers) {
    console.log(`\nDeleting: ${teacher.full_name} (${teacher.email})...`);

    try {
      // 1. Get the profile to find auth_user_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('auth_user_id')
        .eq('email', teacher.email)
        .single();

      // 2. Delete from teachers table
      const { error: teacherError } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacher.id);

      if (teacherError) {
        console.log(`   ⚠️  Failed to delete teacher record: ${teacherError.message}`);
      } else {
        console.log('   ✅ Teacher record deleted');
      }

      // 3. Delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('email', teacher.email);

      if (profileError) {
        console.log(`   ⚠️  Failed to delete profile: ${profileError.message}`);
      } else {
        console.log('   ✅ Profile deleted');
      }

      // 4. Delete auth user
      if (profile?.auth_user_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(
          profile.auth_user_id
        );

        if (authError) {
          console.log(`   ⚠️  Failed to delete auth user: ${authError.message}`);
        } else {
          console.log('   ✅ Auth user deleted');
        }
      } else {
        console.log('   ⚠️  No auth user found (may have been deleted already)');
      }

      successCount++;
      console.log(`   ✅ Successfully deleted ${teacher.full_name}`);

    } catch (err) {
      console.error(`   ❌ Error deleting ${teacher.full_name}:`, err.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Deletion Summary:');
  console.log(`   ✅ Successfully deleted: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('='.repeat(50) + '\n');

  // Verify deletion
  console.log('🔍 Verifying deletion...');
  const { data: remainingTeachers } = await supabase
    .from('teachers')
    .select('count');

  if (remainingTeachers && remainingTeachers.length === 0) {
    console.log('✅ All teachers successfully deleted!\n');
  } else {
    console.log(`⚠️  ${remainingTeachers?.length || 0} teacher(s) still remain in database\n`);
  }
}

// Run the script
deleteAllTeachers()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  });
