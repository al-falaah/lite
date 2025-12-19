// Quick test to check blog_posts table access
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBlogAccess() {
  console.log('Testing blog_posts table access...\n');

  // Test 1: Check if table exists and can query it
  console.log('1. Testing SELECT on blog_posts (unauthenticated):');
  const { data: posts, error: selectError } = await supabase
    .from('blog_posts')
    .select('*');

  if (selectError) {
    console.error('  ❌ Error:', selectError.message);
    console.error('  Details:', selectError);
  } else {
    console.log('  ✓ Success! Found', posts?.length || 0, 'posts');
    if (posts && posts.length > 0) {
      console.log('  Sample post:', posts[0]);
    }
  }

  console.log('\n2. Testing INSERT on blog_posts (unauthenticated - should fail):');
  const { data: insertData, error: insertError } = await supabase
    .from('blog_posts')
    .insert([{
      title: 'Test Post',
      slug: 'test-post',
      content: 'Test content',
      status: 'draft'
    }])
    .select();

  if (insertError) {
    console.log('  ✓ Correctly blocked:', insertError.message);
  } else {
    console.log('  ⚠️  WARNING: Unauthenticated insert succeeded! RLS not working correctly.');
    console.log('  Inserted:', insertData);
  }

  console.log('\n3. Checking table schema:');
  const { data: schema, error: schemaError } = await supabase
    .from('blog_posts')
    .select('*')
    .limit(0);

  if (schemaError) {
    console.error('  ❌ Error:', schemaError.message);
  } else {
    console.log('  ✓ Table exists and is accessible');
  }
}

testBlogAccess().catch(console.error);
