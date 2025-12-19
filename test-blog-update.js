import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBlogUpdate() {
  console.log('=== Testing Blog Post Update ===\n');

  // Step 1: Get a post to update
  console.log('1. Fetching existing blog post...');
  const { data: posts, error: fetchError } = await supabase
    .from('blog_posts')
    .select('*')
    .limit(1)
    .single();

  if (fetchError) {
    console.error('Error fetching post:', fetchError);
    return;
  }

  console.log('Found post:', posts.id, '-', posts.title);
  console.log('Current excerpt:', posts.excerpt);

  // Step 2: Try to update it (without authentication - should fail or timeout)
  console.log('\n2. Testing UPDATE without authentication...');
  const testExcerpt = `Test update at ${new Date().toISOString()}`;

  const startTime = Date.now();
  const { data: updateData, error: updateError } = await supabase
    .from('blog_posts')
    .update({ excerpt: testExcerpt })
    .eq('id', posts.id)
    .select()
    .single();

  const duration = Date.now() - startTime;

  console.log(`Request completed in ${duration}ms`);

  if (updateError) {
    console.error('Update failed:', updateError);
    console.error('Error code:', updateError.code);
    console.error('Error message:', updateError.message);
    console.error('Error details:', updateError.details);
  } else {
    console.log('Update succeeded!');
    console.log('New excerpt:', updateData.excerpt);
  }

  // Step 3: Check RLS policies
  console.log('\n3. Checking RLS policies...');
  const { data: policies, error: policyError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'blog_posts');

  if (policyError) {
    console.error('Error fetching policies:', policyError);
  } else {
    console.log('Active policies on blog_posts:');
    policies.forEach(p => {
      console.log(`  - ${p.policyname} (${p.cmd})`);
      console.log(`    Roles: ${p.roles}`);
      console.log(`    USING: ${p.qual}`);
      if (p.with_check) console.log(`    WITH CHECK: ${p.with_check}`);
    });
  }
}

testBlogUpdate().catch(console.error);
