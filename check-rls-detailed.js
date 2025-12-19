// Detailed RLS policy check
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLSDetailed() {
  console.log('=== Detailed RLS Policy Check ===\n');

  // Test 1: Unauthenticated INSERT (should fail)
  console.log('1. Testing UNAUTHENTICATED INSERT (should fail)...');
  const { data: unauthInsert, error: unauthError } = await supabase
    .from('blog_posts')
    .insert([{
      title: 'Test',
      slug: 'test',
      content: 'Test',
      status: 'draft'
    }])
    .select();

  if (unauthError) {
    console.log('✓ Correctly blocked:', unauthError.message);
  } else {
    console.log('❌ WARNING: Unauthenticated insert succeeded!');
  }

  // Test 2: Sign in
  console.log('\n2. Signing in as admin...');
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: node check-rls-detailed.js <password>');
    process.exit(1);
  }

  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: 'abdulquadrialaka@gmail.com',
    password
  });

  if (authError) {
    console.error('❌ Sign-in failed:', authError.message);
    process.exit(1);
  }

  console.log('✓ Signed in');
  console.log('  User ID:', auth.user.id);
  console.log('  Email:', auth.user.email);

  // Test 3: Check profile
  console.log('\n3. Checking profile and is_admin...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .single();

  if (profileError) {
    console.error('❌ Profile error:', profileError.message);
    process.exit(1);
  }

  console.log('✓ Profile loaded');
  console.log('  is_admin:', profile.is_admin);
  console.log('  role:', profile.role);
  console.log('  id:', profile.id);

  if (!profile.is_admin) {
    console.error('❌ User is_admin is false!');
    console.log('Run this SQL to fix:');
    console.log(`UPDATE profiles SET is_admin = true WHERE id = '${auth.user.id}';`);
    process.exit(1);
  }

  // Test 4: Try INSERT
  console.log('\n4. Testing ADMIN INSERT...');
  const testSlug = 'test-' + Date.now();
  const { data: insertData, error: insertError } = await supabase
    .from('blog_posts')
    .insert([{
      title: 'Test Insert',
      slug: testSlug,
      content: '<p>Test content</p>',
      author_name: 'Test Admin',
      status: 'draft'
    }])
    .select()
    .single();

  if (insertError) {
    console.error('❌ INSERT FAILED');
    console.error('Error:', insertError.message);
    console.error('Code:', insertError.code);
    console.error('Details:', insertError.details);
    console.error('Hint:', insertError.hint);
    console.log('\n🔍 RLS policies are NOT working correctly!');
  } else {
    console.log('✓ INSERT successful');
    console.log('  Created post ID:', insertData.id);

    // Test 5: Try UPDATE
    console.log('\n5. Testing ADMIN UPDATE...');
    const { data: updateData, error: updateError } = await supabase
      .from('blog_posts')
      .update({ excerpt: 'Updated excerpt' })
      .eq('id', insertData.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ UPDATE FAILED');
      console.error('Error:', updateError.message);
      console.error('Code:', updateError.code);
      console.log('\n🔍 UPDATE RLS policy not working!');
    } else {
      console.log('✓ UPDATE successful');
    }

    // Test 6: Try DELETE
    console.log('\n6. Testing ADMIN DELETE...');
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.error('❌ DELETE FAILED');
      console.error('Error:', deleteError.message);
    } else {
      console.log('✓ DELETE successful');
    }
  }

  console.log('\n=== Summary ===');
  if (!insertError && !updateError && !deleteError) {
    console.log('✓ All RLS policies working correctly!');
    console.log('The issue must be in the frontend code.');
  } else {
    console.log('❌ RLS policies have issues');
    console.log('Please share the error messages above.');
  }
}

checkRLSDetailed().catch(console.error);
