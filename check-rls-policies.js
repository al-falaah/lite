// Check RLS policies and test blog_posts access
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('=== Blog RLS Policy Check ===\n');

async function checkPolicies() {
  // 1. Check if we can view published posts (public access)
  console.log('1. Testing PUBLIC access to published posts...');
  const { data: publicPosts, error: publicError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published');

  if (publicError) {
    console.error('❌ PUBLIC access failed:', publicError.message);
    console.error('   Details:', publicError);
  } else {
    console.log('✓ PUBLIC can view published posts');
    console.log('  Found', publicPosts?.length || 0, 'published posts');
    if (publicPosts?.length > 0) {
      console.log('  Sample:', publicPosts[0].title);
    }
  }

  // 2. Try to sign in as admin
  console.log('\n2. Testing ADMIN access...');
  console.log('Please provide admin credentials:');
  console.log('Email: abdulquadrialaka@gmail.com');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'abdulquadrialaka@gmail.com',
    password: process.argv[2] // Pass password as command line arg
  });

  if (authError) {
    console.error('❌ Admin sign-in failed:', authError.message);
    return;
  }

  console.log('✓ Admin signed in successfully');
  console.log('  User ID:', authData.user.id);

  // 3. Check profile and is_admin status
  console.log('\n3. Checking admin profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('❌ Profile check failed:', profileError.message);
  } else {
    console.log('✓ Profile loaded');
    console.log('  Email:', profile.email);
    console.log('  is_admin:', profile.is_admin);
    console.log('  role:', profile.role);
  }

  // 4. Try to fetch ALL posts as admin
  console.log('\n4. Testing admin access to ALL posts...');
  const { data: allPosts, error: allPostsError } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (allPostsError) {
    console.error('❌ Admin cannot view all posts:', allPostsError.message);
    console.error('   Details:', allPostsError);
  } else {
    console.log('✓ Admin can view all posts');
    console.log('  Found', allPosts?.length || 0, 'total posts');
    allPosts?.forEach(post => {
      console.log(`  - ${post.title} (${post.status})`);
    });
  }

  // 5. Try to UPDATE a post
  if (allPosts?.length > 0) {
    console.log('\n5. Testing admin UPDATE access...');
    const testPost = allPosts[0];
    const { data: updateData, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        excerpt: 'Test update at ' + new Date().toISOString()
      })
      .eq('id', testPost.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Admin cannot update posts:', updateError.message);
      console.error('   Details:', updateError);
      console.error('   This is likely an RLS policy issue!');
    } else {
      console.log('✓ Admin can update posts');
      console.log('  Updated post:', updateData.title);
    }
  }

  // 6. Try to INSERT a new post
  console.log('\n6. Testing admin INSERT access...');
  const { data: insertData, error: insertError } = await supabase
    .from('blog_posts')
    .insert([{
      title: 'RLS Test Post',
      slug: 'rls-test-' + Date.now(),
      content: '<p>This is a test post to check RLS policies.</p>',
      author_name: 'Test Admin',
      status: 'draft'
    }])
    .select()
    .single();

  if (insertError) {
    console.error('❌ Admin cannot insert posts:', insertError.message);
    console.error('   Details:', insertError);
    console.error('   This is likely an RLS policy issue!');
  } else {
    console.log('✓ Admin can insert posts');
    console.log('  Created post:', insertData.title);

    // Clean up test post
    await supabase.from('blog_posts').delete().eq('id', insertData.id);
    console.log('  (Test post deleted)');
  }

  console.log('\n=== Summary ===');
  console.log('If you see ❌ on admin operations, run fix_blog_rls.sql in Supabase Dashboard');
}

if (!process.argv[2]) {
  console.error('Usage: node check-rls-policies.js <admin-password>');
  process.exit(1);
}

checkPolicies().catch(console.error);
