import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('=== Blog Update Detailed Debugging ===\n');

  // Test 1: Check RLS status
  console.log('1. Checking RLS status...');
  const { data: rlsStatus, error: rlsError } = await supabase
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .eq('tablename', 'blog_posts')
    .single();

  if (rlsError) {
    console.log('Note: Cannot check RLS via anon key (expected)');
  } else {
    console.log('RLS enabled:', rlsStatus?.rowsecurity);
  }

  // Test 2: Get current post data
  console.log('\n2. Fetching current post data...');
  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, title, excerpt, author_id, created_at, updated_at')
    .eq('id', 'fd946767-6d84-4536-92e3-1f088ce00daf')
    .single();

  if (fetchError) {
    console.error('Error fetching post:', fetchError);
    return;
  }

  console.log('Post found:');
  console.log('  ID:', post.id);
  console.log('  Title:', post.title);
  console.log('  Excerpt:', post.excerpt?.substring(0, 50) + '...');
  console.log('  Author ID:', post.author_id);
  console.log('  Created:', post.created_at);
  console.log('  Updated:', post.updated_at);

  // Test 3: Try UPDATE without auth (should fail/return empty)
  console.log('\n3. Testing UPDATE without authentication...');
  const testExcerpt = `Unauthenticated test at ${new Date().toISOString()}`;

  const { data: updateData, error: updateError } = await supabase
    .from('blog_posts')
    .update({ excerpt: testExcerpt })
    .eq('id', 'fd946767-6d84-4536-92e3-1f088ce00daf')
    .select();

  console.log('Update result:', updateData);
  console.log('Update error:', updateError);
  console.log('Rows affected:', updateData?.length || 0);

  // Test 4: Check if excerpt actually changed
  console.log('\n4. Re-fetching post to see if it changed...');
  const { data: postAfter } = await supabase
    .from('blog_posts')
    .select('excerpt')
    .eq('id', 'fd946767-6d84-4536-92e3-1f088ce00daf')
    .single();

  console.log('Excerpt before:', post.excerpt?.substring(0, 50));
  console.log('Excerpt after:', postAfter?.excerpt?.substring(0, 50));
  console.log('Did it change?', post.excerpt !== postAfter?.excerpt);

  // Test 5: Check author_id field
  console.log('\n5. Checking if author_id field exists...');
  if (post.author_id === null) {
    console.log('⚠️  WARNING: author_id is NULL! This might cause foreign key issues.');
  } else if (post.author_id === undefined) {
    console.log('⚠️  WARNING: author_id column does not exist!');
  } else {
    console.log('✓ author_id exists:', post.author_id);
  }
}

runTests().catch(console.error);