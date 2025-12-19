// Test admin UPDATE permissions
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminUpdate() {
  console.log('=== Testing Admin UPDATE Permission ===\n');

  // 1. Sign in as admin
  console.log('1. Signing in as admin...');
  const email = 'abdulquadrialaka@gmail.com';
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: node test-admin-update.js <password>');
    process.exit(1);
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('❌ Sign-in failed:', authError.message);
    return;
  }

  console.log('✓ Signed in as:', authData.user.email);

  // 2. Check profile
  console.log('\n2. Checking profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('❌ Profile check failed:', profileError.message);
    return;
  }

  console.log('✓ Profile loaded');
  console.log('  is_admin:', profile.is_admin);

  if (!profile.is_admin) {
    console.error('❌ User is not an admin!');
    return;
  }

  // 3. Get existing post
  console.log('\n3. Fetching existing posts...');
  const { data: posts, error: postsError } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (postsError) {
    console.error('❌ Failed to fetch posts:', postsError.message);
    return;
  }

  if (!posts || posts.length === 0) {
    console.error('❌ No posts found to update');
    return;
  }

  const post = posts[0];
  console.log('✓ Found post to update');
  console.log('  Title:', post.title);
  console.log('  Status:', post.status);
  console.log('  ID:', post.id);

  // 4. Try to UPDATE the post
  console.log('\n4. Attempting to UPDATE post...');
  const updateData = {
    excerpt: 'Test update at ' + new Date().toISOString()
  };

  console.log('Update data:', updateData);

  const { data: updateResult, error: updateError } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', post.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ UPDATE FAILED:', updateError.message);
    console.error('Error code:', updateError.code);
    console.error('Error details:', JSON.stringify(updateError, null, 2));
    console.log('\n🔍 This is the RLS policy issue!');
    console.log('You need to run fix-blog-complete.sql in Supabase Dashboard');
    return;
  }

  console.log('✓ UPDATE SUCCESSFUL!');
  console.log('Updated post:', updateResult.title);
  console.log('New excerpt:', updateResult.excerpt);

  console.log('\n=== Test Complete ===');
  console.log('✓ Admin can successfully update blog posts');
}

testAdminUpdate().catch(console.error);
